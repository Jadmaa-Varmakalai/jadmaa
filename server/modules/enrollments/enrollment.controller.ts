import { Request, Response } from 'express';
import { prisma } from '../../db.js';

export const enrollFreeCourse = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { courseId } = req.body;

    const course = await prisma.course.findUnique({ where: { id: courseId } });
    
    if (!course || course.status !== 'PUBLISHED') {
      return res.status(404).json({ success: false, error: { message: 'Course not found' } });
    }

    if ((course as any)?.isAvailable === false) {
      return res.status(403).json({ success: false, error: { message: 'This course is currently unavailable for new enrollments.' } });
    }

    if (!course.isFree && course.price > 0) {
      return res.status(400).json({ success: false, error: { message: 'Course is not free. Please complete payment.' } });
    }

    // Check existing
    const existing = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: user.id, courseId: course.id } }
    });

    if (existing && existing.status === 'ACTIVE') {
      return res.status(400).json({ success: false, error: { message: 'Already enrolled' } });
    }

    const enrollment = await prisma.enrollment.upsert({
      where: { userId_courseId: { userId: user.id, courseId: course.id } },
      update: { status: 'ACTIVE' },
      create: {
        userId: user.id,
        courseId: course.id,
        status: 'ACTIVE'
      }
    });

    res.json({ success: true, data: enrollment });
  } catch (err) {
    console.error('enrollFreeCourse error:', err);
    res.status(500).json({ success: false, error: { message: 'Server error' } });
  }
};
