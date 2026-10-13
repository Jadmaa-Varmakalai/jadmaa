import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../../db.js';
import { registerSchema, loginSchema } from './auth.validation.js';
import { BrevoService } from '../../services/email/brevo.service.js';
import { invalidateUserCache } from '../../middleware/auth.middleware.js';

const generateTokens = (user: any) => {
  const accessToken = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET || 'supersecret_jwt_key',
    { expiresIn: '7d' }
  );
  
  const refreshToken = jwt.sign(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET || 'supersecret_refresh_key',
    { expiresIn: '30d' }
  );
  
  return { accessToken, refreshToken };
};

export const register = async (req: Request, res: Response) => {
  try {
    const validated = registerSchema.parse(req.body);
    const email = validated.email.trim().toLowerCase();
    const { applyAsInstructor, title, specialization, experience, bio } = req.body;
    
    const existing = await prisma.user.findUnique({ 
      where: { email },
      include: { instructorProfile: true }
    });

    if (existing) {
      if (existing.role === 'INSTRUCTOR' || existing.instructorProfile) {
        return res.status(400).json({ 
          success: false, 
          isAlreadyInstructor: true,
          error: { message: 'This email is already registered as an Instructor. Please log in directly.' } 
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
        role: 'STUDENT', // Registered as student until admin approves
      }
    });

    // If applying as instructor, record application and notify admin
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
          description: `Instructor Application for ${user.name}`
        },
        create: {
          key: `instructor_app_${user.id}`,
          value: JSON.stringify(applicationData),
          description: `Instructor Application for ${user.name}`
        }
      });
    }

    // Add registered user to Brevo marketing list in the background
    BrevoService.addContactToMarketingList(user.email, user.name).catch(err => {
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
          : 'Registration successful!'
      } 
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
      }
    });
    if (!user) {
      console.warn(`[Auth:Login] Login failed: User with email "${validated.email}" not found.`);
      return res.status(401).json({ success: false, error: { message: 'Invalid credentials or inactive account' } });
    }

    if (!user.isActive) {
      console.warn(`[Auth:Login] Login failed: User "${validated.email}" is marked inactive.`);
      return res.status(401).json({ success: false, error: { message: 'Invalid credentials or inactive account' } });
    }

    const isValid = await bcrypt.compare(validated.password, user.passwordHash);
    if (!isValid) {
      console.warn(`[Auth:Login] Login failed: Password comparison failed for "${validated.email}".`);
      return res.status(401).json({ success: false, error: { message: 'Invalid credentials' } });
    }

    prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    }).catch(console.error);

    // Check if user has an unacknowledged instructor approval notification
    let showInstructorApprovalNotice = false;
    if (user.role === 'INSTRUCTOR') {
      const noticeKey = `instructor_approved_notice_${user.id}`;
      const notice = await prisma.systemSetting.findUnique({ where: { key: noticeKey } });
      if (notice && notice.value === 'UNNOTIFIED') {
        showInstructorApprovalNotice = true;
        // Mark as NOTIFIED so it is only shown ONE TIME after approval
        await prisma.systemSetting.update({
          where: { key: noticeKey },
          data: { value: 'NOTIFIED' }
        }).catch(console.error);
      }
    }

    const { accessToken, refreshToken } = generateTokens(user);

    // Set refresh token in HTTP-only cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
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
          enrolledCourses: user.enrollments.map(e => e.courseId) 
        } 
      } 
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: { message: 'Validation error', details: (err as any).errors } });
    }
    console.error('Login error:', err);
    res.status(500).json({ success: false, error: { message: 'Server error' } });
  }
};

export const refresh = async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken || (req.headers['x-refresh-token'] as string);
    if (!refreshToken) {
      return res.status(401).json({ success: false, error: { message: 'No refresh token provided' } });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'supersecret_refresh_key') as any;
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, error: { message: 'Invalid refresh token or inactive account' } });
    }

    const tokens = generateTokens(user);

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000
    });

    res.json({ 
      success: true, 
      data: { 
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken
      } 
    });
  } catch (err) {
    res.status(401).json({ success: false, error: { message: 'Invalid or expired refresh token' } });
  }
};

export const logout = async (req: Request, res: Response) => {
  res.clearCookie('refreshToken');
  res.json({ success: true, data: { message: 'Logged out successfully' } });
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
      enrolledCourses: user.enrollments ? user.enrollments.map((e: any) => e.courseId) : []
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
      data: updateData
    });

    invalidateUserCache(userId);

    res.json({ success: true, data: { name: user.name, phone: user.phone, avatarUrl: user.avatarUrl } });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ success: false, error: { message: 'Server error' } });
  }
};

export const checkInstructorStatus = async (req: Request, res: Response) => {
  try {
    const email = String(req.query.email || req.body?.email || '').trim().toLowerCase();
    if (!email) {
      return res.status(400).json({ success: false, error: { message: 'Email is required' } });
    }
    const user = await prisma.user.findUnique({
      where: { email },
      include: { instructorProfile: true }
    });
    const isInstructor = user ? (user.role === 'INSTRUCTOR' || Boolean(user.instructorProfile)) : false;
    res.json({
      success: true,
      data: {
        exists: Boolean(user),
        isInstructor,
        role: user?.role || null
      }
    });
  } catch (err) {
    console.error('Check instructor status error:', err);
    res.status(500).json({ success: false, error: { message: 'Server error' } });
  }
};

