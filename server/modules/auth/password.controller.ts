import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '../../db.js';
import { z } from 'zod';
import { sendPasswordResetEmail, sendPasswordChangedEmail } from '../../services/email/email.service.js';
import { invalidateUserCache } from '../../middleware/auth.middleware.js';

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = forgotPasswordSchema.parse(req.body);
    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    // Check for cooldown even if user doesn't exist (to avoid timing attacks, though harder).
    // If user exists, we strictly enforce DB-based 60-second cooldown.
    if (user) {
      const recentToken = await prisma.passwordResetToken.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' }
      });

      if (recentToken) {
        const secondsSinceLastToken = (Date.now() - recentToken.createdAt.getTime()) / 1000;
        if (secondsSinceLastToken < 60) {
          return res.status(429).json({
            success: false,
            error: {
              message: "Please wait 60 seconds before requesting another reset email."
            }
          });
        }
      }

      if (!user.isActive) {
        // We still return generic success to prevent enumeration, or we could return error.
        // The prompt says "Existing active user -> create token + send email. Non-existing user -> do not create token/send email. Response remains generic."
        return res.json({
          success: true,
          message: "If an account exists for this email address, password reset instructions have been sent."
        });
      }

      // Invalidate existing unused tokens for this user
      await prisma.passwordResetToken.updateMany({
        where: { userId: user.id, usedAt: null },
        data: { usedAt: new Date() }
      });

      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = await bcrypt.hash(rawToken, 10);
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 mins

      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt
        }
      });

      let frontendUrl = process.env.FRONTEND_URL;
      if (frontendUrl && (frontendUrl.includes('frontend_url=') || frontendUrl === '/')) {
        frontendUrl = '';
      }
      if (!frontendUrl) {
        frontendUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL 
          ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` 
          : (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:5173');
      }

      const resetUrl = `${frontendUrl}/reset-password?token=${rawToken}&id=${user.id}`;

      const result = await sendPasswordResetEmail(user.email, resetUrl, user.name);
      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: { message: `Unable to send the reset email. Please try again later. (Reason: ${result.reason || 'Unknown error'})` }
        });
      }
    }

    // Generic response for both existing and non-existing active users
    res.json({
      success: true,
      message: "If an account exists for this email address, password reset instructions have been sent."
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: { message: 'Invalid email address' } });
    }
    console.error('forgotPassword error:', err);
    res.status(500).json({ success: false, error: { message: 'Internal server error' } });
  }
};

const resetPasswordSchema = z.object({
  userId: z.string().uuid(),
  token: z.string(),
  password: z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, 'Password must contain uppercase, lowercase and a number'),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { userId, token, password } = resetPasswordSchema.parse(req.body);

    const resetTokenRecord = await prisma.passwordResetToken.findFirst({
      where: { 
        userId,
        usedAt: null,
        expiresAt: { gt: new Date() }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!resetTokenRecord) {
      return res.status(400).json({ success: false, error: { message: 'This password reset link is invalid or has expired.' } });
    }

    const isValidToken = await bcrypt.compare(token, resetTokenRecord.tokenHash);
    if (!isValidToken) {
      return res.status(400).json({ success: false, error: { message: 'This password reset link is invalid or has expired.' } });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { passwordHash }
      }),
      prisma.passwordResetToken.update({
        where: { id: resetTokenRecord.id },
        data: { usedAt: new Date() }
      }),
      // Invalidate existing sessions in RefreshSession if we were using it (we are now starting to use it or just stateless)
      prisma.refreshSession.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() }
      })
    ]);

    invalidateUserCache(userId);

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user) {
      await sendPasswordChangedEmail(user.email, user.name);
    }

    res.json({
      success: true,
      message: "Your password has been reset successfully."
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: { message: (err as any).issues[0].message } });
    }
    console.error('resetPassword error:', err);
    res.status(500).json({ success: false, error: { message: 'Internal server error' } });
  }
};

const changePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, 'Password must contain uppercase, lowercase and a number'),
  confirmPassword: z.string()
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

export const changePassword = async (req: Request, res: Response) => {
  try {
    const userContext = (req as any).user;
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { id: userContext.id } });
    if (!user) {
      return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ success: false, error: { message: 'Incorrect current password' } });
    }
    
    if (currentPassword === newPassword) {
        return res.status(400).json({ success: false, error: { message: 'New password must be different from current password' } });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { passwordHash }
      }),
      prisma.refreshSession.updateMany({
        where: { userId: user.id, revokedAt: null },
        data: { revokedAt: new Date() }
      })
    ]);

    invalidateUserCache(user.id);

    await sendPasswordChangedEmail(user.email, user.name);

    res.json({
      success: true,
      message: "Your password has been changed successfully."
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: { message: (err as any).issues[0].message } });
    }
    console.error('changePassword error:', err);
    res.status(500).json({ success: false, error: { message: 'Internal server error' } });
  }
};
