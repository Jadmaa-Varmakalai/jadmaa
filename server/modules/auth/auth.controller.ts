import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { z } from 'zod';
import { prisma } from '../../db.js';
import { registerSchema, loginSchema } from './auth.validation.js';
import { BrevoService } from '../../services/email/brevo.service.js';
import { sendSessionReverifyOtpEmail } from '../../services/email/email.service.js';
import { invalidateUserCache } from '../../middleware/auth.middleware.js';
import { getJwtSecret, getJwtRefreshSecret, hashToken } from '../../config/security.js';

// Dual-Expiry Session Constants
const ABSOLUTE_SESSION_LIFETIME_MS = 14 * 24 * 60 * 60 * 1000; // 14 days max absolute lifetime
const INACTIVITY_TIMEOUT_MS = 7 * 24 * 60 * 60 * 1000;         // 7 days without user activity
const OTP_EXPIRY_MS = 10 * 60 * 1000;                           // 10 minutes OTP validity

/**
 * Generates an access token and a cryptographically secure refresh token.
 * Hashes and persists the refresh token in the Prisma UserSession & RefreshSession models.
 */
export const generateTokens = async (
  user: any,
  req?: Request
): Promise<{ accessToken: string; refreshToken: string }> => {
  const accessToken = jwt.sign(
    { id: user.id, role: user.role },
    getJwtSecret(),
    { expiresIn: '15m' } // 15-minute access token lifespan
  );

  // Generate cryptographically random 40-byte hex refresh token
  const rawRefreshToken = crypto.randomBytes(40).toString('hex');
  const tokenHash = hashToken(rawRefreshToken);
  const expiresAt = new Date(Date.now() + ABSOLUTE_SESSION_LIFETIME_MS); // 14 days absolute cap

  const ipAddress = (req?.ip || (req?.headers?.['x-forwarded-for'] as string) || null)?.substring(0, 45);
  const userAgent = (req?.headers?.['user-agent'] as string || null)?.substring(0, 255);

  // Store in UserSession model
  await prisma.userSession.create({
    data: {
      userId: user.id,
      refreshToken: tokenHash,
      expiresAt,
      lastActiveAt: new Date(),
      ipAddress,
      userAgent,
    },
  });

  // Store in RefreshSession model for backward compatibility
  await prisma.refreshSession.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt,
      ipAddress,
      userAgent,
    },
  });

  return { accessToken, refreshToken: rawRefreshToken };
};

export const register = async (req: Request, res: Response) => {
  try {
    const validated = registerSchema.parse(req.body);
    const email = validated.email.trim().toLowerCase();
    const { applyAsInstructor, title, specialization, experience, bio } = req.body;

    const existing = await prisma.user.findUnique({
      where: { email },
      include: { instructorProfile: true },
    });

    if (existing) {
      if (existing.role === 'INSTRUCTOR' || existing.instructorProfile) {
        return res.status(400).json({
          success: false,
          isAlreadyInstructor: true,
          error: { message: 'This email is already registered as an Instructor. Please log in directly.' },
        });
      }
      return res.status(400).json({ success: false, error: { message: 'Email already exists. Please log in.' } });
    }

    const passwordHash = await bcrypt.hash(validated.password, 10);
    const user = await prisma.user.create({
      data: {
        name: validated.name.trim(),
        email,
        phone: validated.phone.trim(),
        passwordHash,
        role: 'STUDENT',
      },
    });

    if (applyAsInstructor) {
      const applicationData = {
        userId: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        title: title || 'Instructor Candidate',
        specialization: specialization || 'Varmakalai Training',
        experience: experience || '',
        bio: bio || '',
        status: 'PENDING',
        appliedAt: new Date().toISOString(),
      };

      await prisma.systemSetting.upsert({
        where: { key: `instructor_app_${user.id}` },
        update: {
          value: JSON.stringify(applicationData),
          description: `Instructor Application for ${user.name}`,
        },
        create: {
          key: `instructor_app_${user.id}`,
          value: JSON.stringify(applicationData),
          description: `Instructor Application for ${user.name}`,
        },
      });
    }

    BrevoService.addContactToMarketingList(user.email, user.name).catch((err) => {
      console.error('[AuthController] Failed to add contact to Brevo marketing list:', err);
    });

    res.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        appliedAsInstructor: !!applyAsInstructor,
        message: applyAsInstructor
          ? 'Registration successful! Your request to become an instructor has been submitted to the Admin. Until approved, you can explore courses as a student.'
          : 'Registration successful!',
      },
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: { message: 'Validation error', details: (err as any).errors } });
    }
    console.error('Register error:', err);
    res.status(500).json({ success: false, error: { message: 'Server error' } });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const validated = loginSchema.parse(req.body);
    const email = validated.email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        enrollments: { select: { courseId: true } },
        instructorProfile: true,
      },
    });

    // Account Enumeration Defense: Return identical generic message if user not found or inactive
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, error: { message: 'Invalid email or password' } });
    }

    const isValid = await bcrypt.compare(validated.password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ success: false, error: { message: 'Invalid email or password' } });
    }

    prisma.user
      .update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      })
      .catch(console.error);

    // DUAL-EXPIRY & SESSION VERIFICATION CHECK:
    // If user's previous session expired (14 days absolute cap OR 7 days inactivity),
    // OR if user is logging into an older account with NO active session, require 6-digit email OTP.
    const now = Date.now();

    const activeSession = await prisma.userSession.findFirst({
      where: {
        userId: user.id,
        revokedAt: null,
        expiresAt: { gt: new Date() },
        lastActiveAt: { gt: new Date(now - INACTIVITY_TIMEOUT_MS) },
      },
    });

    const latestUserSession = await prisma.userSession.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });
    const latestRefreshSession = !latestUserSession
      ? await prisma.refreshSession.findFirst({
          where: { userId: user.id },
          orderBy: { createdAt: 'desc' },
        })
      : null;

    const latestSession = latestUserSession || latestRefreshSession;
    let isSessionExpired = false;

    // Check if account is a brand new registration (created within the last 10 minutes)
    const isBrandNewRegistration = now - new Date(user.createdAt).getTime() < 10 * 60 * 1000;

    if (!isBrandNewRegistration) {
      if (latestSession) {
        const isAbsoluteExpired = now > latestSession.expiresAt.getTime();
        const lastActiveTime = (latestSession as any).lastActiveAt
          ? new Date((latestSession as any).lastActiveAt).getTime()
          : new Date(latestSession.createdAt).getTime();
        const isInactiveExpired = now - lastActiveTime > INACTIVITY_TIMEOUT_MS;

        if (isAbsoluteExpired || isInactiveExpired || latestSession.revokedAt) {
          isSessionExpired = true;
        }
      } else {
        // Old unused ID with NO recorded active session in the database
        isSessionExpired = true;
      }
    }

    if (isSessionExpired) {
      // Require 6-digit email OTP verification before creating a new session
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpHash = await bcrypt.hash(otp, 10);
      const otpExpiresAt = new Date(Date.now() + OTP_EXPIRY_MS);

      await prisma.authOtp.deleteMany({
        where: { email, purpose: 'SESSION_REVERIFY' },
      });

      await prisma.authOtp.create({
        data: {
          email,
          otpHash,
          purpose: 'SESSION_REVERIFY',
          expiresAt: otpExpiresAt,
        },
      });

      sendSessionReverifyOtpEmail(email, otp, user.name).catch((err) => {
        console.error('[AuthController] Failed to send session reverify OTP:', err);
      });

      return res.json({
        success: true,
        requireOtp: true,
        email: user.email,
        message: 'Your previous session expired. For security, a 6-digit verification code has been sent to your email.',
      });
    }

    let showInstructorApprovalNotice = false;
    if (user.role === 'INSTRUCTOR') {
      const noticeKey = `instructor_approved_notice_${user.id}`;
      const notice = await prisma.systemSetting.findUnique({ where: { key: noticeKey } });
      if (notice && notice.value === 'UNNOTIFIED') {
        showInstructorApprovalNotice = true;
        await prisma.systemSetting
          .update({
            where: { key: noticeKey },
            data: { value: 'NOTIFIED' },
          })
          .catch(console.error);
      }
    }

    // Generate tokens and store hashed refresh session
    const { accessToken, refreshToken } = await generateTokens(user, req);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: ABSOLUTE_SESSION_LIFETIME_MS,
    });

    res.json({
      success: true,
      data: {
        token: accessToken,
        refreshToken,
        showInstructorApprovalNotice,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          avatarUrl: user.avatarUrl,
          enrolledCourses: user.enrollments.map((e) => e.courseId),
        },
      },
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: { message: 'Validation error', details: (err as any).errors } });
    }
    console.error('Login error:', err);
    res.status(500).json({ success: false, error: { message: 'Server error' } });
  }
};

/**
 * Re-authentication OTP verification endpoint for expired sessions.
 * Validates 6-digit OTP, creates fresh UserSession, and issues tokens.
 */
export const verifySessionOtp = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, error: { message: 'Email and verification code are required' } });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const cleanOtp = String(otp).trim();

    // Look up active unexpired OTP record
    const otpRecord = await prisma.authOtp.findFirst({
      where: {
        email: normalizedEmail,
        purpose: 'SESSION_REVERIFY',
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid or expired verification code. Please request a new code.' },
      });
    }

    const isValid = await bcrypt.compare(cleanOtp, otpRecord.otpHash);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        error: { message: 'Incorrect verification code. Please check your email and try again.' },
      });
    }

    // Clean up used OTP records
    await prisma.authOtp.deleteMany({
      where: { email: normalizedEmail, purpose: 'SESSION_REVERIFY' },
    });

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        enrollments: { select: { courseId: true } },
        instructorProfile: true,
      },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, error: { message: 'Account not found or inactive' } });
    }

    await prisma.user
      .update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      })
      .catch(console.error);

    const { accessToken, refreshToken } = await generateTokens(user, req);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: ABSOLUTE_SESSION_LIFETIME_MS,
    });

    res.json({
      success: true,
      data: {
        token: accessToken,
        refreshToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          avatarUrl: user.avatarUrl,
          enrolledCourses: user.enrollments.map((e) => e.courseId),
        },
      },
    });
  } catch (err: any) {
    console.error('verifySessionOtp error:', err);
    res.status(500).json({ success: false, error: { message: 'Verification failed' } });
  }
};

/**
 * Resends a fresh 6-digit session re-verification OTP to the user's email.
 */
export const resendSessionOtp = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: { message: 'Email is required' } });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (!user || !user.isActive) {
      return res.json({
        success: true,
        message: 'If an account exists with this email, a new verification code has been sent.',
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    const otpExpiresAt = new Date(Date.now() + OTP_EXPIRY_MS);

    await prisma.authOtp.deleteMany({
      where: { email: normalizedEmail, purpose: 'SESSION_REVERIFY' },
    });

    await prisma.authOtp.create({
      data: {
        email: normalizedEmail,
        otpHash,
        purpose: 'SESSION_REVERIFY',
        expiresAt: otpExpiresAt,
      },
    });

    sendSessionReverifyOtpEmail(normalizedEmail, otp, user.name).catch((err) => {
      console.error('[AuthController] Failed to resend session reverify OTP:', err);
    });

    res.json({
      success: true,
      message: 'A new 6-digit verification code has been sent to your email.',
    });
  } catch (err: any) {
    console.error('resendSessionOtp error:', err);
    res.status(500).json({ success: false, error: { message: 'Failed to resend code' } });
  }
};

/**
 * Refreshes an access token using refresh token rotation.
 * Validates token hash in UserSession and RefreshSession, enforces dual-expiry
 * (14 days absolute, 7 days inactivity), updates lastActiveAt, and rotates tokens.
 */
export const refresh = async (req: Request, res: Response) => {
  try {
    const refreshToken =
      req.cookies?.refreshToken || req.body?.refreshToken || (req.headers['x-refresh-token'] as string);

    if (!refreshToken || typeof refreshToken !== 'string') {
      return res.status(401).json({ success: false, error: { message: 'No refresh token provided' } });
    }

    const incomingHash = hashToken(refreshToken);

    // 1. Look up session in UserSession first, then fallback to RefreshSession
    const userSession = await prisma.userSession.findUnique({
      where: { refreshToken: incomingHash },
      include: { user: true },
    });
    const refreshSession = !userSession
      ? await prisma.refreshSession.findUnique({
          where: { tokenHash: incomingHash },
          include: { user: true },
        })
      : null;

    const session = userSession || refreshSession;

    // 2. REUSE DETECTION: If token was already revoked, token theft has occurred!
    if (session && session.revokedAt) {
      console.warn(`[Security Alert] Refresh token reuse detected for user ${session.userId}. Revoking all sessions.`);
      await prisma.userSession.updateMany({
        where: { userId: session.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      await prisma.refreshSession.updateMany({
        where: { userId: session.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      res.clearCookie('refreshToken');
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid refresh token: Reused or previously revoked token detected.' },
      });
    }

    let user: any = null;
    let oldUserSessionId: string | null = null;
    let oldRefreshSessionId: string | null = null;

    if (session) {
      const now = Date.now();
      // Absolute expiry check (14 days cap)
      if (now > session.expiresAt.getTime()) {
        if (userSession) {
          await prisma.userSession.update({ where: { id: userSession.id }, data: { revokedAt: new Date() } });
        }
        if (refreshSession) {
          await prisma.refreshSession.update({ where: { id: refreshSession.id }, data: { revokedAt: new Date() } });
        }
        res.clearCookie('refreshToken');
        return res.status(401).json({ success: false, error: { message: 'Session expired (14-day limit reached). Please log in again.' } });
      }

      // Inactivity check (7 days without activity)
      const lastActive = (session as any).lastActiveAt
        ? (session as any).lastActiveAt.getTime()
        : session.createdAt.getTime();
      if (now - lastActive > INACTIVITY_TIMEOUT_MS) {
        if (userSession) {
          await prisma.userSession.update({ where: { id: userSession.id }, data: { revokedAt: new Date() } });
        }
        if (refreshSession) {
          await prisma.refreshSession.update({ where: { id: refreshSession.id }, data: { revokedAt: new Date() } });
        }
        res.clearCookie('refreshToken');
        return res.status(401).json({ success: false, error: { message: 'Session expired due to inactivity. Please log in again.' } });
      }

      user = session.user;
      if (userSession) oldUserSessionId = userSession.id;
      if (refreshSession) oldRefreshSessionId = refreshSession.id;
    } else {
      // Legacy Token Migration Plan
      try {
        const decoded = jwt.verify(refreshToken, getJwtRefreshSecret()) as any;
        if (decoded?.id) {
          user = await prisma.user.findUnique({ where: { id: decoded.id } });
        }
      } catch (_) {
        // Not a valid legacy JWT either
      }
    }

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, error: { message: 'Invalid refresh token or inactive account' } });
    }

    // 3. REFRESH-TOKEN ROTATION: Revoke the old session records immediately
    if (oldUserSessionId) {
      await prisma.userSession.update({
        where: { id: oldUserSessionId },
        data: { revokedAt: new Date() },
      });
    }
    if (oldRefreshSessionId) {
      await prisma.refreshSession.update({
        where: { id: oldRefreshSessionId },
        data: { revokedAt: new Date() },
      });
    }

    // Issue new token pair and insert new UserSession & RefreshSession records with updated lastActiveAt
    const tokens = await generateTokens(user, req);

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: ABSOLUTE_SESSION_LIFETIME_MS,
    });

    res.json({
      success: true,
      data: {
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    });
  } catch (err) {
    res.status(401).json({ success: false, error: { message: 'Invalid or expired refresh token' } });
  }
};

/**
 * Server-side logout: Invalidates active UserSession & RefreshSession and clears user cache.
 */
export const logout = async (req: Request, res: Response) => {
  try {
    const refreshToken =
      req.cookies?.refreshToken || req.body?.refreshToken || (req.headers['x-refresh-token'] as string);

    if (refreshToken && typeof refreshToken === 'string') {
      const incomingHash = hashToken(refreshToken);
      await prisma.userSession.updateMany({
        where: { refreshToken: incomingHash, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      await prisma.refreshSession.updateMany({
        where: { tokenHash: incomingHash, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }

    const user = (req as any).user;
    if (user?.id) {
      invalidateUserCache(user.id);
    }
  } catch (err) {
    console.warn('[Logout] Session revocation error:', err);
  } finally {
    res.clearCookie('refreshToken');
    res.json({ success: true, data: { message: 'Logged out successfully' } });
  }
};

export const getMe = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) {
      return res.status(404).json({ success: false, error: { message: 'User not found' } });
    }

    const formattedUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
      enrolledCourses: user.enrollments ? user.enrollments.map((e: any) => e.courseId) : [],
    };

    res.json({ success: true, data: formattedUser });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: 'Server error' } });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { name, phone, avatarUrl } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, error: { message: 'Name is required' } });
    }

    const updateData: any = { name, phone };
    if (avatarUrl !== undefined) {
      updateData.avatarUrl = avatarUrl;
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    invalidateUserCache(userId);

    res.json({ success: true, data: { name: user.name, phone: user.phone, avatarUrl: user.avatarUrl } });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ success: false, error: { message: 'Server error' } });
  }
};

/**
 * Account Enumeration Defense: Only returns whether the email belongs to an approved active instructor
 * to guide the login form toggle, but NEVER leaks student existence, user IDs, or internal roles.
 */
export const checkInstructorStatus = async (req: Request, res: Response) => {
  try {
    const email = String(req.query.email || req.body?.email || '').trim().toLowerCase();
    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, error: { message: 'Valid email is required' } });
    }

    const instructor = await prisma.user.findFirst({
      where: { email, role: 'INSTRUCTOR', isActive: true },
      select: { id: true },
    });

    // Never return exists: true/false or user role for non-instructors
    res.json({
      success: true,
      data: {
        isInstructor: Boolean(instructor),
      },
    });
  } catch (err) {
    console.error('Check instructor status error:', err);
    res.status(500).json({ success: false, error: { message: 'Server error' } });
  }
};
