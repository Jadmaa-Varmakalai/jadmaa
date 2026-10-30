import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../db.js';
import { getJwtSecret } from '../config/security.js';

// In-memory user auth cache to eliminate repeated round-trips to database
const authUserCache = new Map<string, { user: any; expiresAt: number }>();

export const invalidateUserCache = (userId?: string) => {
  if (userId) {
    authUserCache.delete(userId);
  } else {
    authUserCache.clear();
  }
};

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.split(' ')[1]
    : (req.cookies?.accessToken || req.cookies?.token);

  if (!token) {
    return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
  }
  try {
    const decoded = jwt.verify(token, getJwtSecret()) as any;
    const userId = decoded.id;

    // Check fast in-memory cache first (0ms)
    const cached = authUserCache.get(userId);
    if (cached && Date.now() < cached.expiresAt) {
      if (!cached.user || !cached.user.isActive) {
        return res.status(401).json({ success: false, error: { message: 'Unauthorized: Account inactive or not found' } });
      }
      (req as any).user = cached.user;
      return next();
    }
    
    // Load fresh user from database with enrollment IDs and instructor profile
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        enrollments: {
          select: { courseId: true, status: true }
        },
        instructorProfile: true
      }
    });
    
    if (!user || !user.isActive) {
      if (user) authUserCache.set(userId, { user, expiresAt: Date.now() + 60_000 });
      return res.status(401).json({ success: false, error: { message: 'Unauthorized: Account inactive or not found' } });
    }
    
    authUserCache.set(userId, { user, expiresAt: Date.now() + 60_000 });
    (req as any).user = user;
    next();
  } catch (err) {
    res.status(401).json({ success: false, error: { message: 'Invalid or expired token' } });
  }
};

/**
 * Optional authentication: Attaches user to req.user if a valid token is present,
 * but allows unauthenticated visitors to proceed anonymously without 401.
 */
export const optionalAuthenticate = async (req: Request, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.split(' ')[1]
    : (req.cookies?.accessToken || req.cookies?.token);

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret()) as any;
    const userId = decoded?.id;
    if (!userId) return next();

    const cached = authUserCache.get(userId);
    if (cached && Date.now() < cached.expiresAt) {
      if (cached.user && cached.user.isActive) {
        (req as any).user = cached.user;
      }
      return next();
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        enrollments: {
          select: { courseId: true, status: true }
        },
        instructorProfile: true
      }
    });

    if (user && user.isActive) {
      authUserCache.set(userId, { user, expiresAt: Date.now() + 60_000 });
      (req as any).user = user;
    }
  } catch (_) {
    // Continue anonymously if token is invalid or expired
  }

  next();
};

export const authorize = (roles: string[]) => {
  const normalizedRoles = roles.map(r => r.toUpperCase());
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    const userRole = (user?.role || '').toUpperCase();
    if (!user || (!normalizedRoles.includes(userRole) && !user.isAdmin)) {
      return res.status(403).json({ success: false, error: { message: 'Forbidden: Insufficient permissions' } });
    }
    next();
  };
};

export const requireAdmin = authorize(['ADMIN', 'SUPER_ADMIN']);
export const requireSuperAdmin = authorize(['SUPER_ADMIN']);
export const requireInstructor = authorize(['INSTRUCTOR', 'ADMIN', 'SUPER_ADMIN']);
