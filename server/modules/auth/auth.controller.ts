import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { z } from 'zod';
import { prisma } from '../../db.js';
import { registerSchema, loginSchema } from './auth.validation.js';
import { BrevoService } from '../../services/email/brevo.service.js';
import { invalidateUserCache } from '../../middleware/auth.middleware.js';
import { getJwtSecret, getJwtRefreshSecret, hashToken } from '../../config/security.js';

/**
 * Generates an access token and a cryptographically secure refresh token.
 * Hashes and persists the refresh token in the Prisma RefreshSession model.
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
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  const ipAddress = (req?.ip || (req?.headers?.['x-forwarded-for'] as string) || null)?.substring(0, 45);
  const userAgent = (req?.headers?.['user-agent'] as string || null)?.substring(0, 255);

  // Store in database
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
      maxAge: 30 * 24 * 60 * 60 * 1000,
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
 * Refreshes an access token using refresh token rotation.
 * Validates token hash in RefreshSession, revokes previous token, and detects reuse attempts.
 */
export const refresh = async (req: Request, res: Response) => {
  try {
    const refreshToken =
      req.cookies?.refreshToken || req.body?.refreshToken || (req.headers['x-refresh-token'] as string);

    if (!refreshToken || typeof refreshToken !== 'string') {
      return res.status(401).json({ success: false, error: { message: 'No refresh token provided' } });
    }

    const incomingHash = hashToken(refreshToken);

    // 1. Look up session in RefreshSession table
    const session = await prisma.refreshSession.findUnique({
      where: { tokenHash: incomingHash },
      include: { user: true },
    });

    // 2. REUSE DETECTION: If token was already revoked, token theft has occurred!
    // Invalidate the entire session family for this user to lock out the adversary.
    if (session && session.revokedAt) {
      console.warn(`[Security Alert] Refresh token reuse detected for user ${session.userId}. Revoking all sessions.`);
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
    let oldSessionId: string | null = null;

    if (session) {
      if (new Date() > session.expiresAt) {
        return res.status(401).json({ success: false, error: { message: 'Refresh token has expired' } });
      }
      user = session.user;
      oldSessionId = session.id;
    } else {
      // Legacy Token Migration Plan: Accept valid stateless JWT refresh token from before DB migration
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

    // 3. REFRESH-TOKEN ROTATION: Revoke the old session immediately
    if (oldSessionId) {
      await prisma.refreshSession.update({
        where: { id: oldSessionId },
        data: { revokedAt: new Date() },
      });
    }

    // Issue new token pair and insert new RefreshSession record
    const tokens = await generateTokens(user, req);

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
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
 * Server-side logout: Invalidates the active RefreshSession and user cache.
 */
export const logout = async (req: Request, res: Response) => {
  try {
    const refreshToken =
      req.cookies?.refreshToken || req.body?.refreshToken || (req.headers['x-refresh-token'] as string);

    if (refreshToken && typeof refreshToken === 'string') {
      const incomingHash = hashToken(refreshToken);
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
