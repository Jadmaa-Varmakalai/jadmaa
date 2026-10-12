import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../db.js';

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
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecret_jwt_key') as any;
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
    
    // Load fresh user from database with enrollment IDs
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        enrollments: {
          select: { courseId: true }
        }
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
