import { Request, Response } from 'express';
import { prisma } from '../../db.js';
import { logAdminAction } from '../../utils/audit.js';
import bcrypt from 'bcryptjs';
import { sendNewCourseSuggestionEmail, sendEnquiryAdminNotificationEmail, sendEnquiryUserAcknowledgementEmail } from '../../services/email/email.service.js';
import { BrevoService } from '../../services/email/brevo.service.js';
import { invalidateUserCache } from '../../middleware/auth.middleware.js';

const extractYouTubeId = (input: string): string => {
  if (!input) return '';
  const trimmed = input.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }
  const match = trimmed.match(
    /(?:youtu\.be\/|youtube\.com\/(?:shorts\/|embed\/|v\/|live\/|watch\?v=|watch\?.+&v=))([a-zA-Z0-9_-]{11})/i
  );
  if (match && match[1]) {
    return match[1];
  }
  const fallback = trimmed.match(
    /(?:youtu\.be\/|youtube\.com\/(?:shorts\/|embed\/|v\/|live\/|watch\?v=|watch\?.+&v=))([^&?#/]+)/i
  );
  return fallback && fallback[1] ? fallback[1] : trimmed;
};

const getPagination = (req: Request) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const totalStudents = await prisma.user.count({ where: { role: 'STUDENT' } });
    const activeStudents = await prisma.user.count({ where: { role: 'STUDENT', isActive: true } });
    const totalInstructors = await prisma.user.count({ where: { role: 'INSTRUCTOR' } });
    const publishedCourses = await prisma.course.count({ where: { status: 'PUBLISHED' } });
    const draftCourses = await prisma.course.count({ where: { status: 'DRAFT' } });
    
    const totalEnrollments = await prisma.enrollment.count();
    const completedCourses = await prisma.enrollment.count({ where: { status: 'COMPLETED' } });
    const certificatesIssued = await prisma.certificate.count({ where: { status: 'ISSUED' } });
    
    const successfulPaymentsCount = await prisma.payment.count({ where: { status: 'SUCCESS' } });
    const pendingPaymentsCount = await prisma.payment.count({ where: { status: 'PENDING' } });
    
    const successfulPayments = await prisma.payment.aggregate({
      where: { status: 'SUCCESS' },
      _sum: { amount: true }
    });
    
    const refundedPayments = await prisma.payment.aggregate({
      where: { status: 'REFUNDED' },
      _sum: { amount: true }
    });
    
    const totalRevenue = (successfulPayments._sum.amount || 0) - (refundedPayments._sum.amount || 0);

    res.json({
      success: true,
      data: {
        totalStudents, activeStudents, totalInstructors, publishedCourses, draftCourses,
        totalEnrollments, completedCourses, certificatesIssued,
        successfulPayments: successfulPaymentsCount,
        pendingPayments: pendingPaymentsCount,
        totalRevenue
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message || 'Server error' } });
  }
};

export const getAnalytics = async (req: Request, res: Response) => {
  // A simplified analytics implementation
  try {
    // For now, return basic mock structures representing the shape
    // In production, this would use group by queries based on date ranges
    res.json({
      success: true,
      data: {
        enrollmentsOverTime: [],
        revenueOverTime: [],
        courseCompletionRate: 0
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message || 'Server error' } });
  }
};

export const getStudents = async (req: Request, res: Response) => {
  try {
    const { page, limit, skip } = getPagination(req);
    const search = req.query.search as string;
    const status = req.query.status as string;
    
    const where: any = { role: 'STUDENT' };
    
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
        { phone: { contains: search as string, mode: 'insensitive' } }
      ];
    }
    if (status === 'active') where.isActive = true;
    if (status === 'inactive') where.isActive = false;

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: { id: true, name: true, email: true, phone: true, isActive: true, createdAt: true, lastLoginAt: true },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        items,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message || 'Server error' } });
  }
};

export const getStudentById = async (req: Request, res: Response) => {
  try {
    const student = await prisma.user.findUnique({
      where: { id: (req.params.id as string) },
      select: { 
        id: true, name: true, email: true, phone: true, isActive: true, createdAt: true, lastLoginAt: true, role: true,
        enrollments: { include: { course: { select: { title: true } } } },
        payments: { orderBy: { createdAt: 'desc' } },
        certificates: { include: { course: { select: { title: true } } } },
        lessonProgress: true
      }
    });
    if (!student || (student.role !== 'STUDENT' && student.role !== 'ADMIN' && student.role !== 'SUPER_ADMIN')) {
      return res.status(404).json({ success: false, error: { message: 'Student not found' } });
    }
    res.json({ success: true, data: student });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message || 'Server error' } });
  }
};

export const updateStudentStatus = async (req: Request, res: Response) => {
  try {
    const { isActive } = req.body;
    const student = await prisma.user.update({
      where: { id: (req.params.id as string) },
      data: { isActive }
    });
    
    await logAdminAction((req as any).user.id, 'UPDATE_STUDENT_STATUS', 'User', student.id, { isActive }, req);
    
    res.json({ success: true, data: { id: student.id, isActive: student.isActive } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message || 'Server error' } });
  }
};

// --- Instructors ---
export const getInstructors = async (req: Request, res: Response) => {
  try {
    const { page, limit, skip } = getPagination(req);
    const search = req.query.search as string;
    
    const where: any = {};
    if (search) {
      where.OR = [
        { displayName: { contains: search as string, mode: 'insensitive' } },
        { user: { email: { contains: search as string, mode: 'insensitive' } } }
      ];
    }

    const [items, total] = await Promise.all([
      prisma.instructor.findMany({
        where, skip, take: limit,
        include: { user: { select: { email: true, name: true, isAdmin: true } } },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.instructor.count({ where })
    ]);

    res.json({ success: true, data: { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message || 'Server error' } });
  }
};

export const getInstructorById = async (req: Request, res: Response) => {
  try {
    const instructor = await prisma.instructor.findUnique({
      where: { id: (req.params.id as string) },
      include: { 
        user: { select: { email: true, name: true, phone: true } },
        courses: { select: { id: true, title: true, status: true } } 
      }
    });
    if (!instructor) return res.status(404).json({ success: false, error: { message: 'Instructor not found' } });
    res.json({ success: true, data: instructor });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message || 'Server error' } });
  }
};

export const createInstructor = async (req: Request, res: Response) => {
  try {
    const { email, password, name, phone, displayName, title, bio, specialization, experience, avatarUrl } = req.body;
    
    // Check if user exists
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      const passwordHash = await bcrypt.hash(password || 'Jadmaa@123', 10);
      user = await prisma.user.create({
        data: { name, email, phone, passwordHash, role: 'INSTRUCTOR', avatarUrl: avatarUrl || null }
      });
    } else {
      user = await prisma.user.update({
        where: { email },
        data: { role: 'INSTRUCTOR', ...(avatarUrl ? { avatarUrl } : {}) }
      });
    }

    const instructor = await prisma.instructor.create({
      data: { userId: user.id, displayName: displayName || name, title, bio, specialization, experience, avatarUrl: avatarUrl || null }
    });

    await logAdminAction((req as any).user.id, 'CREATE_INSTRUCTOR', 'Instructor', instructor.id, { email }, req);
    res.json({ success: true, data: instructor });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message || 'Server error' } });
  }
};

export const updateInstructor = async (req: Request, res: Response) => {
  try {
    const { displayName, title, bio, specialization, experience, avatarUrl } = req.body;
    const instructor = await prisma.instructor.update({
      where: { id: (req.params.id as string) },
      data: { displayName, title, bio, specialization, experience, ...(avatarUrl !== undefined ? { avatarUrl } : {}) }
    });
    await logAdminAction((req as any).user.id, 'UPDATE_INSTRUCTOR', 'Instructor', instructor.id, null, req);
    res.json({ success: true, data: instructor });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message || 'Server error' } });
  }
};

export const updateInstructorStatus = async (req: Request, res: Response) => {
  try {
    const { isActive } = req.body;
    
    // Check if it's the founder/admin
    const existing = await prisma.instructor.findUnique({
      where: { id: (req.params.id as string) },
      include: { user: true }
    });
    
    if (existing?.user?.isAdmin || existing?.user?.role === 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, error: { message: 'Cannot deactivate an admin instructor' } });
    }

    const instructor = await prisma.instructor.update({
      where: { id: (req.params.id as string) },
      data: { isActive },
      include: { user: true }
    });
    
    await prisma.user.update({
      where: { id: instructor.userId },
      data: { isActive }
    });
    
    await logAdminAction((req as any).user.id, 'UPDATE_INSTRUCTOR_STATUS', 'Instructor', instructor.id, { isActive }, req);
    res.json({ success: true, data: instructor });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message || 'Server error' } });
  }
};

/**
 * List pending/processed instructor applications
 */
export const getInstructorApplications = async (req: Request, res: Response) => {
  try {
    const settings = await prisma.systemSetting.findMany({
      where: {
        key: { startsWith: 'instructor_app_' }
      },
      orderBy: { updatedAt: 'desc' }
    });

    const applications = settings.map((s) => {
      try {
        return { key: s.key, ...JSON.parse(s.value) };
      } catch (_) {
        return { key: s.key, raw: s.value };
      }
    });

    res.json({ success: true, data: applications });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message || 'Server error' } });
  }
};

/**
 * Approve instructor application:
 * 1. Upgrades user role to 'INSTRUCTOR'
 * 2. Creates instructor profile if not present
 * 3. Sets single-time approval notification flag
 * 4. Invalidates cached auth session
 */
export const approveInstructorApplication = async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, error: { message: 'User ID is required' } });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { instructorProfile: true }
    });

    if (!user) {
      return res.status(404).json({ success: false, error: { message: 'User not found' } });
    }

    // Get candidate app details if present
    const appSetting = await prisma.systemSetting.findUnique({
      where: { key: `instructor_app_${userId}` }
    });
    let appData: any = {};
    if (appSetting) {
      try { appData = JSON.parse(appSetting.value); } catch (_) {}
    }

    // 1. Upgrade user role
    await prisma.user.update({
      where: { id: userId },
      data: { role: 'INSTRUCTOR' }
    });

    // 2. Create or update instructor profile
    if (!user.instructorProfile) {
      await prisma.instructor.create({
        data: {
          userId,
          displayName: appData.displayName || user.name,
          title: appData.title || 'Instructor',
          specialization: appData.specialization || 'Varmakalai',
          experience: appData.experience || '',
          bio: appData.bio || '',
          isActive: true
        }
      });
    } else {
      await prisma.instructor.update({
        where: { id: user.instructorProfile.id },
        data: { isActive: true }
      });
    }

    // 3. Mark application as APPROVED in system settings
    if (appSetting) {
      appData.status = 'APPROVED';
      appData.approvedAt = new Date().toISOString();
      await prisma.systemSetting.update({
        where: { key: `instructor_app_${userId}` },
        data: { value: JSON.stringify(appData) }
      });
    }

    // 4. Set single-time notification flag for next login/session
    await prisma.systemSetting.upsert({
      where: { key: `instructor_approved_notice_${userId}` },
      update: { value: 'UNNOTIFIED', description: 'One-time approval notice' },
      create: { key: `instructor_approved_notice_${userId}`, value: 'UNNOTIFIED', description: 'One-time approval notice' }
    });

    invalidateUserCache(userId);

    await logAdminAction((req as any).user.id, 'APPROVE_INSTRUCTOR_APP', 'User', userId, { email: user.email }, req);
    res.json({ success: true, message: 'Instructor approved successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message || 'Server error' } });
  }
};

/**
 * Reject instructor application
 */
export const rejectInstructorApplication = async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, error: { message: 'User ID is required' } });
    }

    const appSetting = await prisma.systemSetting.findUnique({
      where: { key: `instructor_app_${userId}` }
    });

    if (appSetting) {
      let appData: any = {};
      try { appData = JSON.parse(appSetting.value); } catch (_) {}
      appData.status = 'REJECTED';
      appData.rejectedAt = new Date().toISOString();
      await prisma.systemSetting.update({
        where: { key: `instructor_app_${userId}` },
        data: { value: JSON.stringify(appData) }
      });
    }

    await logAdminAction((req as any).user.id, 'REJECT_INSTRUCTOR_APP', 'User', userId, null, req);
    res.json({ success: true, message: 'Instructor application rejected' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message || 'Server error' } });
  }
};

// --- Courses ---
export const getCourses = async (req: Request, res: Response) => {
  try {
    const { page, limit, skip } = getPagination(req);
    const search = req.query.search as string;
    const status = req.query.status as string;
    
    const where: any = {};
    if (search) where.title = { contains: search as string, mode: 'insensitive' };
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      prisma.course.findMany({
        where, skip, take: limit,
        include: { 
          instructor: { select: { displayName: true } },
          modules: {
            include: { lessons: { orderBy: { sortOrder: 'asc' } } },
            orderBy: { sortOrder: 'asc' }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.course.count({ where })
    ]);

    res.json({ success: true, data: { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message || 'Server error' } });
  }
};

export const getCourseById = async (req: Request, res: Response) => {
  try {
    const course = await prisma.course.findUnique({
      where: { id: (req.params.id as string) },
      include: { 
        instructor: true,
        modules: {
          include: { lessons: { orderBy: { sortOrder: 'asc' } } },
          orderBy: { sortOrder: 'asc' }
        }
      }
    });
    if (!course) return res.status(404).json({ success: false, error: { message: 'Course not found' } });
    res.json({ success: true, data: course });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message || 'Server error' } });
  }
};

export const createCourse = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const { youtubeUrl, ...courseData } = data;
    
    // Auto-generate slug if not provided
    if (!courseData.slug) {
      courseData.slug = courseData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    }
    
    const course = await prisma.course.create({ data: courseData });

    // Handle Youtube link shortcut
    if (youtubeUrl) {
      const videoId = extractYouTubeId(youtubeUrl);

      await prisma.courseModule.create({
        data: {
          courseId: course.id,
          title: 'Main Content',
          sortOrder: 1,
          lessons: {
            create: {
              title: course.title,
              youtubeVideoId: videoId,
              sortOrder: 1,
              isRequired: true,
              isPublished: true
            }
          }
        }
      });
    }

    await logAdminAction((req as any).user.id, 'CREATE_COURSE', 'Course', course.id, { title: course.title }, req);
    if (course.status === 'PUBLISHED') {
      sendNewCourseSuggestionEmail(course.id).catch(err => console.error('Failed to trigger course recommendation emails:', err));
    }
    res.json({ success: true, data: course });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message || 'Server error' } });
  }
};

export const updateCourse = async (req: Request, res: Response) => {
  try {
    const { youtubeUrl, ...updateData } = req.body;
    const courseId = req.params.id as string;

    const course = await prisma.course.update({
      where: { id: courseId },
      data: updateData
    });

    if (youtubeUrl !== undefined && youtubeUrl !== null) {
      const trimmed = String(youtubeUrl).trim();
      if (trimmed) {
        const videoId = extractYouTubeId(trimmed);

        const firstModule = await prisma.courseModule.findFirst({
          where: { courseId },
          include: { lessons: { orderBy: { sortOrder: 'asc' } } },
          orderBy: { sortOrder: 'asc' }
        });

        if (firstModule) {
          if (firstModule.lessons.length > 0) {
            await prisma.lesson.update({
              where: { id: firstModule.lessons[0].id },
              data: { youtubeVideoId: videoId }
            });
          } else {
            await prisma.lesson.create({
              data: {
                moduleId: firstModule.id,
                title: course.title,
                youtubeVideoId: videoId,
                sortOrder: 1,
                isRequired: true,
                isPublished: true
              }
            });
          }
        } else {
          await prisma.courseModule.create({
            data: {
              courseId,
              title: 'Main Content',
              sortOrder: 1,
              lessons: {
                create: {
                  title: course.title,
                  youtubeVideoId: videoId,
                  sortOrder: 1,
                  isRequired: true,
                  isPublished: true
                }
              }
            }
          });
        }
      }
    }

    await logAdminAction((req as any).user.id, 'UPDATE_COURSE', 'Course', course.id, null, req);
    res.json({ success: true, data: course });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message || 'Server error' } });
  }
};

export const deleteCourse = async (req: Request, res: Response) => {
  try {
    // Check if course has enrollments or payments
    const enrollmentsCount = await prisma.enrollment.count({ where: { courseId: (req.params.id as string) } });
    if (enrollmentsCount > 0) {
      return res.status(400).json({ success: false, error: { message: 'Cannot delete course with active enrollments. Archive it instead.' } });
    }
    
    await prisma.course.delete({ where: { id: (req.params.id as string) } });
    await logAdminAction((req as any).user.id, 'DELETE_COURSE', 'Course', (req.params.id as string), null, req);
    res.json({ success: true, data: { message: 'Course deleted successfully' } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message || 'Server error' } });
  }
};

export const publishCourse = async (req: Request, res: Response) => {
  try {
    const course = await prisma.course.update({
      where: { id: (req.params.id as string) },
      data: { status: 'PUBLISHED', publishedAt: new Date() }
    });
    await logAdminAction((req as any).user.id, 'PUBLISH_COURSE', 'Course', course.id, null, req);
    sendNewCourseSuggestionEmail(course.id).catch(err => console.error('Failed to trigger course recommendation emails:', err));
    res.json({ success: true, data: course });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message || 'Server error' } });
  }
};

export const unpublishCourse = async (req: Request, res: Response) => {
  try {
    const course = await prisma.course.update({
      where: { id: (req.params.id as string) },
      data: { status: 'DRAFT' }
    });
    await logAdminAction((req as any).user.id, 'UNPUBLISH_COURSE', 'Course', course.id, null, req);
    res.json({ success: true, data: course });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message || 'Server error' } });
  }
};

// --- Modules & Lessons ---
export const createModule = async (req: Request, res: Response) => {
  try {
    const module = await prisma.courseModule.create({ data: req.body });
    await logAdminAction((req as any).user.id, 'CREATE_MODULE', 'CourseModule', module.id, { courseId: module.courseId }, req);
    res.json({ success: true, data: module });
  } catch (err: any) { res.status(500).json({ success: false, error: { message: err.message } }); }
};

export const updateModule = async (req: Request, res: Response) => {
  try {
    const module = await prisma.courseModule.update({ where: { id: (req.params.id as string) }, data: req.body });
    await logAdminAction((req as any).user.id, 'UPDATE_MODULE', 'CourseModule', module.id, null, req);
    res.json({ success: true, data: module });
  } catch (err: any) { res.status(500).json({ success: false, error: { message: err.message } }); }
};

export const deleteModule = async (req: Request, res: Response) => {
  try {
    await prisma.courseModule.delete({ where: { id: (req.params.id as string) } });
    await logAdminAction((req as any).user.id, 'DELETE_MODULE', 'CourseModule', (req.params.id as string), null, req);
    res.json({ success: true, data: { message: 'Deleted' } });
  } catch (err: any) { res.status(500).json({ success: false, error: { message: err.message } }); }
};

export const createLesson = async (req: Request, res: Response) => {
  try {
    const data = { ...req.body };
    if (data.youtubeVideoId) data.youtubeVideoId = extractYouTubeId(data.youtubeVideoId);
    
    const lesson = await prisma.lesson.create({ data });
    await logAdminAction((req as any).user.id, 'CREATE_LESSON', 'Lesson', lesson.id, { moduleId: lesson.moduleId }, req);
    res.json({ success: true, data: lesson });
  } catch (err: any) { res.status(500).json({ success: false, error: { message: err.message } }); }
};

export const updateLesson = async (req: Request, res: Response) => {
  try {
    const data = { ...req.body };
    if (data.youtubeVideoId) data.youtubeVideoId = extractYouTubeId(data.youtubeVideoId);
    
    const lesson = await prisma.lesson.update({ where: { id: (req.params.id as string) }, data });
    await logAdminAction((req as any).user.id, 'UPDATE_LESSON', 'Lesson', lesson.id, null, req);
    res.json({ success: true, data: lesson });
  } catch (err: any) { res.status(500).json({ success: false, error: { message: err.message } }); }
};

export const deleteLesson = async (req: Request, res: Response) => {
  try {
    await prisma.lesson.delete({ where: { id: (req.params.id as string) } });
    await logAdminAction((req as any).user.id, 'DELETE_LESSON', 'Lesson', (req.params.id as string), null, req);
    res.json({ success: true, data: { message: 'Deleted' } });
  } catch (err: any) { res.status(500).json({ success: false, error: { message: err.message } }); }
};

// --- Enrollments ---
export const getEnrollments = async (req: Request, res: Response) => {
  try {
    const { page, limit, skip } = getPagination(req);
    const status = req.query.status as string;
    const courseId = req.query.courseId as string;
    const userId = req.query.userId as string;
    
    const where: any = {};
    if (status) where.status = status;
    if (courseId) where.courseId = courseId;
    if (userId) where.userId = userId;

    const [items, total] = await Promise.all([
      prisma.enrollment.findMany({
        where, skip, take: limit,
        include: { 
          user: { select: { name: true, email: true } },
          course: { select: { title: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.enrollment.count({ where })
    ]);
    res.json({ success: true, data: { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } } });
  } catch (err: any) { res.status(500).json({ success: false, error: { message: err.message } }); }
};

export const getEnrollmentById = async (req: Request, res: Response) => {
  try {
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: (req.params.id as string) },
      include: { user: true, course: true, payment: true }
    });
    res.json({ success: true, data: enrollment });
  } catch (err: any) { res.status(500).json({ success: false, error: { message: err.message } }); }
};

// --- Payments ---
export const getPayments = async (req: Request, res: Response) => {
  try {
    const { page, limit, skip } = getPagination(req);
    const status = req.query.status as string;
    const merchantOrderId = req.query.merchantOrderId as string;
    
    const where: any = {};
    if (status) where.status = status;
    if (merchantOrderId) where.merchantOrderId = { contains: merchantOrderId as string, mode: 'insensitive' };

    const [items, total] = await Promise.all([
      prisma.payment.findMany({
        where, skip, take: limit,
        include: { 
          user: { select: { name: true, email: true } },
          course: { select: { title: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.payment.count({ where })
    ]);
    res.json({ success: true, data: { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } } });
  } catch (err: any) { res.status(500).json({ success: false, error: { message: err.message } }); }
};

export const getPaymentById = async (req: Request, res: Response) => {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: (req.params.id as string) },
      include: { user: true, course: true }
    });
    res.json({ success: true, data: payment });
  } catch (err: any) { res.status(500).json({ success: false, error: { message: err.message } }); }
};

export const refundPayment = async (req: Request, res: Response) => {
  try {
    // Basic refund implementation wrapper
    // In production, integrate with PhonePe refund API here
    const payment = await prisma.payment.update({
      where: { id: (req.params.id as string) },
      data: { status: 'REFUNDED' }
    });
    await logAdminAction((req as any).user.id, 'REFUND_PAYMENT', 'Payment', payment.id, null, req);
    res.json({ success: true, data: payment });
  } catch (err: any) { res.status(500).json({ success: false, error: { message: err.message } }); }
};

// --- Certificates ---
export const getCertificates = async (req: Request, res: Response) => {
  try {
    const { page, limit, skip } = getPagination(req);
    const [items, total] = await Promise.all([
      prisma.certificate.findMany({
        skip, take: limit,
        include: { user: { select: { name: true, email: true } }, course: { select: { title: true } } },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.certificate.count()
    ]);
    res.json({ success: true, data: { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } } });
  } catch (err: any) { res.status(500).json({ success: false, error: { message: err.message } }); }
};

export const getCertificateById = async (req: Request, res: Response) => {
  try {
    const cert = await prisma.certificate.findUnique({ where: { id: (req.params.id as string) }, include: { user: true, course: true } });
    res.json({ success: true, data: cert });
  } catch (err: any) { res.status(500).json({ success: false, error: { message: err.message } }); }
};

export const revokeCertificate = async (req: Request, res: Response) => {
  try {
    const cert = await prisma.certificate.update({
      where: { id: (req.params.id as string) },
      data: { status: 'REVOKED' }
    });
    await logAdminAction((req as any).user.id, 'REVOKE_CERTIFICATE', 'Certificate', cert.id, null, req);
    res.json({ success: true, data: cert });
  } catch (err: any) { res.status(500).json({ success: false, error: { message: err.message } }); }
};

// --- Enquiries ---
export const getEnquiries = async (req: Request, res: Response) => {
  try {
    const { page, limit, skip } = getPagination(req);
    const [items, total] = await Promise.all([
      prisma.enquiry.findMany({ skip, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.enquiry.count()
    ]);
    res.json({ success: true, data: { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } } });
  } catch (err: any) { res.status(500).json({ success: false, error: { message: err.message } }); }
};

export const getEnquiryById = async (req: Request, res: Response) => {
  try {
    const enquiry = await prisma.enquiry.findUnique({ where: { id: (req.params.id as string) } });
    res.json({ success: true, data: enquiry });
  } catch (err: any) { res.status(500).json({ success: false, error: { message: err.message } }); }
};

export const updateEnquiryStatus = async (req: Request, res: Response) => {
  try {
    const enquiry = await prisma.enquiry.update({ where: { id: (req.params.id as string) }, data: { status: req.body.status } });
    res.json({ success: true, data: enquiry });
  } catch (err: any) { res.status(500).json({ success: false, error: { message: err.message } }); }
};

export const deleteEnquiry = async (req: Request, res: Response) => {
  try {
    await prisma.enquiry.delete({ where: { id: (req.params.id as string) } });
    res.json({ success: true, message: 'Enquiry deleted successfully' });
  } catch (err: any) { res.status(500).json({ success: false, error: { message: err.message } }); }
};

/**
 * Public endpoint to submit contact / enquiry form
 */
export const submitPublicEnquiry = async (req: Request, res: Response) => {
  try {
    const { name, mobile, email, category, type, courseTitle, location, message } = req.body;

    if (!name || !mobile) {
      return res.status(400).json({ success: false, error: { message: 'Name and mobile number are required.' } });
    }

    // Determine readable type label
    let typeLabel = 'General Enquiry';
    if (type === 'ONLINE_CLASS') typeLabel = 'Online Class';
    else if (type === 'OFFLINE_CLASS') typeLabel = 'Offline Direct Class';
    else if (type === 'VARMA_TREATMENT') typeLabel = 'Varma Treatment';

    // Build subject line
    let subject = `[${typeLabel}]`;
    if (courseTitle) subject += ` ${courseTitle}`;
    if (location) subject += ` (${location})`;

    // Store in DB
    const enquiry = await prisma.enquiry.create({
      data: {
        name: name.trim(),
        email: email ? email.trim() : 'no-email@jadmaa.com',
        phone: mobile.trim(),
        subject,
        message: message ? message.trim() : `Enquiry for ${typeLabel}`,
        status: 'NEW',
      },
    });

    // Send email alert to admin(s) via Brevo asynchronously
    sendEnquiryAdminNotificationEmail({
      name: name.trim(),
      phone: mobile.trim(),
      email: email ? email.trim() : undefined,
      category: category === 'TREATMENT' ? 'TREATMENT' : 'CLASS',
      type: type || (category === 'TREATMENT' ? 'VARMA_TREATMENT' : 'OFFLINE_CLASS'),
      typeLabel,
      courseTitle: courseTitle ? courseTitle.trim() : undefined,
      location: location ? location.trim() : undefined,
      message: message ? message.trim() : undefined,
    }).catch((err) => {
      console.error('[EnquiryController] Error sending admin notification email:', err);
    });

    // If user provided an email, sync to Brevo Marketing List & send customer confirmation
    if (email && email.trim().includes('@')) {
      const cleanEmail = email.trim();
      const cleanName = name.trim();

      // 1. Sync contact to Brevo Contacts / Marketing list
      BrevoService.addContactToMarketingList(cleanEmail, cleanName).catch((err) => {
        console.warn('[EnquiryController] Warning syncing lead to Brevo list:', err);
      });

      // 2. Send instant acknowledgement email to the user
      sendEnquiryUserAcknowledgementEmail({
        name: cleanName,
        email: cleanEmail,
        phone: mobile.trim(),
        typeLabel,
        courseTitle: courseTitle ? courseTitle.trim() : undefined,
        location: location ? location.trim() : undefined,
      }).catch((err) => {
        console.warn('[EnquiryController] Warning sending customer confirmation email:', err);
      });
    }

    res.status(201).json({
      success: true,
      message: 'Enquiry submitted successfully. Our team will contact you shortly.',
      data: enquiry,
    });
  } catch (err: any) {
    console.error('[EnquiryController] submitPublicEnquiry error:', err);
    res.status(500).json({ success: false, error: { message: err.message || 'Server error while submitting enquiry.' } });
  }
};

// --- Administrators (Super Admin) ---
export const getAdministrators = async (req: Request, res: Response) => {
  try {
    const { page, limit, skip } = getPagination(req);
    const where = { role: { in: ['ADMIN', 'SUPER_ADMIN'] as any } };
    const [items, total] = await Promise.all([
      prisma.user.findMany({ where, skip, take: limit, select: { id: true, name: true, email: true, role: true, isActive: true, lastLoginAt: true }, orderBy: { createdAt: 'desc' } }),
      prisma.user.count({ where })
    ]);
    res.json({ success: true, data: { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } } });
  } catch (err: any) { res.status(500).json({ success: false, error: { message: err.message } }); }
};

export const createAdministrator = async (req: Request, res: Response) => {
  try {
    const { email, password, name, role } = req.body;
    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') throw new Error('Invalid role');
    const passwordHash = await bcrypt.hash(password || 'Admin@123', 10);
    const admin = await prisma.user.create({ data: { name, email, passwordHash, role } });
    await logAdminAction((req as any).user.id, 'CREATE_ADMIN', 'User', admin.id, { role }, req);
    res.json({ success: true, data: { id: admin.id, name: admin.name, email: admin.email, role: admin.role } });
  } catch (err: any) { res.status(500).json({ success: false, error: { message: err.message } }); }
};

export const updateAdministrator = async (req: Request, res: Response) => {
  try {
    const { role } = req.body;
    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') throw new Error('Invalid role');
    const admin = await prisma.user.update({ where: { id: (req.params.id as string) }, data: { role } });
    await logAdminAction((req as any).user.id, 'UPDATE_ADMIN_ROLE', 'User', admin.id, { role }, req);
    res.json({ success: true, data: { id: admin.id, role: admin.role } });
  } catch (err: any) { res.status(500).json({ success: false, error: { message: err.message } }); }
};

export const updateAdministratorStatus = async (req: Request, res: Response) => {
  try {
    const admin = await prisma.user.update({ where: { id: (req.params.id as string) }, data: { isActive: req.body.isActive } });
    await logAdminAction((req as any).user.id, 'UPDATE_ADMIN_STATUS', 'User', admin.id, { isActive: req.body.isActive }, req);
    res.json({ success: true, data: { id: admin.id, isActive: admin.isActive } });
  } catch (err: any) { res.status(500).json({ success: false, error: { message: err.message } }); }
};

export const getAuditLogs = async (req: Request, res: Response) => {
  try {
    const { page, limit, skip } = getPagination(req);
    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({ skip, take: limit, include: { actor: { select: { email: true } } }, orderBy: { createdAt: 'desc' } }),
      prisma.auditLog.count()
    ]);
    res.json({ success: true, data: { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } } });
  } catch (err: any) { res.status(500).json({ success: false, error: { message: err.message } }); }
};

// --- Settings ---
export const getSettings = async (req: Request, res: Response) => {
  try {
    const settings = await prisma.systemSetting.findMany();
    res.json({ success: true, data: settings });
  } catch (err: any) { res.status(500).json({ success: false, error: { message: err.message } }); }
};

export const updateSettings = async (req: Request, res: Response) => {
  try {
    const { key, value, description } = req.body;
    const setting = await prisma.systemSetting.upsert({
      where: { key },
      update: { value, description },
      create: { key, value, description }
    });
    await logAdminAction((req as any).user.id, 'UPDATE_SETTING', 'SystemSetting', setting.id, { key }, req);
    res.json({ success: true, data: setting });
  } catch (err: any) { res.status(500).json({ success: false, error: { message: err.message } }); }
};
