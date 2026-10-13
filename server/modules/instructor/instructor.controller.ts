import { Request, Response } from 'express';
import { prisma } from '../../db.js';
import { sendNewCourseSuggestionEmail } from '../../services/email/email.service.js';
import { invalidateCoursesCache } from '../courses/course.controller.js';

// Helper to resolve or create instructor record for the authenticated user
const getOrCreateInstructorForUser = async (user: any) => {
  let instructor = await prisma.instructor.findUnique({
    where: { userId: user.id }
  });

  if (!instructor) {
    instructor = await prisma.instructor.create({
      data: {
        userId: user.id,
        displayName: user.name || 'Instructor',
        title: 'Varmakalai Instructor',
        avatarUrl: user.avatarUrl || null,
        isActive: true
      }
    });
  }

  return instructor;
};

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

/**
 * Get instructor dashboard metrics & recent items
 */
export const getInstructorDashboard = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const instructor = await getOrCreateInstructorForUser(user);

    const [coursesCount, publishedCoursesCount, draftCoursesCount, courses] = await Promise.all([
      prisma.course.count({ where: { instructorId: instructor.id } }),
      prisma.course.count({ where: { instructorId: instructor.id, status: 'PUBLISHED' } }),
      prisma.course.count({ where: { instructorId: instructor.id, status: 'DRAFT' } }),
      prisma.course.findMany({
        where: { instructorId: instructor.id },
        select: { id: true }
      })
    ]);

    const courseIds = courses.map(c => c.id);

    const [totalStudents, activeEnrollments] = await Promise.all([
      prisma.enrollment.groupBy({
        by: ['userId'],
        where: { courseId: { in: courseIds } }
      }).then(res => res.length),
      prisma.enrollment.count({
        where: { courseId: { in: courseIds }, status: 'ACTIVE' }
      })
    ]);

    res.json({
      success: true,
      data: {
        instructor,
        coursesCount,
        publishedCoursesCount,
        draftCoursesCount,
        totalStudents,
        activeEnrollments
      }
    });
  } catch (err: any) {
    console.error('getInstructorDashboard error:', err);
    res.status(500).json({ success: false, error: { message: err.message || 'Server error' } });
  }
};

/**
 * Get courses created by this instructor
 */
export const getInstructorCourses = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const instructor = await getOrCreateInstructorForUser(user);

    const search = req.query.search as string;
    const where: any = { instructorId: instructor.id };

    if (search) {
      where.title = { contains: search, mode: 'insensitive' };
    }

    const courses = await prisma.course.findMany({
      where,
      include: {
        modules: {
          include: { lessons: { orderBy: { sortOrder: 'asc' } } },
          orderBy: { sortOrder: 'asc' }
        },
        _count: {
          select: { enrollments: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: courses });
  } catch (err: any) {
    console.error('getInstructorCourses error:', err);
    res.status(500).json({ success: false, error: { message: err.message || 'Server error' } });
  }
};

/**
 * Create a new course as instructor (directly published or draft as chosen)
 */
export const createInstructorCourse = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const instructor = await getOrCreateInstructorForUser(user);
    const { youtubeUrl, ...courseData } = req.body;

    if (!courseData.title) {
      return res.status(400).json({ success: false, error: { message: 'Course title is required' } });
    }

    // Auto-generate unique slug
    let baseSlug = courseData.slug || courseData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    let slug = baseSlug;
    let counter = 1;
    while (await prisma.course.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const isFree = courseData.price === 0 || courseData.isFree === true;

    const course = await prisma.course.create({
      data: {
        title: courseData.title,
        slug,
        subtitle: courseData.subtitle || null,
        description: courseData.description || courseData.title,
        longDescription: courseData.longDescription || null,
        category: courseData.category || 'Varmakalai',
        level: courseData.level || 'Beginner',
        duration: courseData.duration || '4 Weeks',
        price: Number(courseData.price) || 0,
        isFree,
        isAvailable: courseData.isAvailable !== false,
        certificateEnabled: courseData.certificateEnabled !== false,
        status: courseData.status || 'DRAFT',
        thumbnailUrl: courseData.thumbnailUrl || null,
        instructorId: instructor.id,
        publishedAt: courseData.status === 'PUBLISHED' ? new Date() : null
      } as any
    });

    // Handle Youtube link shortcut
    if (youtubeUrl) {
      const videoId = extractYouTubeId(youtubeUrl);

      await prisma.courseModule.create({
        data: {
          courseId: course.id,
          title: 'Main Course Material',
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

    if (course.status === 'PUBLISHED') {
      invalidateCoursesCache();
      sendNewCourseSuggestionEmail(course.id).catch(err => console.error('Failed to trigger course recommendation emails:', err));
    }

    res.json({ success: true, data: course });
  } catch (err: any) {
    console.error('createInstructorCourse error:', err);
    res.status(500).json({ success: false, error: { message: err.message || 'Server error' } });
  }
};

/**
 * Update an existing course (must be owned by instructor)
 */
export const updateInstructorCourse = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const instructor = await getOrCreateInstructorForUser(user);
    const courseId = req.params.id as string;

    const existing = await prisma.course.findUnique({
      where: { id: courseId },
      include: { modules: { include: { lessons: true } } }
    });

    if (!existing) {
      return res.status(404).json({ success: false, error: { message: 'Course not found' } });
    }

    if (existing.instructorId !== instructor.id && !user.isAdmin) {
      return res.status(403).json({ success: false, error: { message: 'You do not have permission to edit this course' } });
    }

    const { youtubeUrl, ...updateData } = req.body;
    const isFree = updateData.price !== undefined ? (Number(updateData.price) === 0 || updateData.isFree === true) : existing.isFree;

    const course = await prisma.course.update({
      where: { id: courseId },
      data: {
        ...updateData,
        price: updateData.price !== undefined ? Number(updateData.price) : undefined,
        isFree,
        publishedAt: updateData.status === 'PUBLISHED' && !existing.publishedAt ? new Date() : undefined
      }
    });

    // Update or add youtube lesson if provided
    if (youtubeUrl) {
      const videoId = extractYouTubeId(youtubeUrl);

      const firstModule = existing.modules[0];
      if (firstModule && firstModule.lessons[0]) {
        await prisma.lesson.update({
          where: { id: firstModule.lessons[0].id },
          data: { youtubeVideoId: videoId }
        });
      } else if (firstModule) {
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
      } else {
        await prisma.courseModule.create({
          data: {
            courseId: course.id,
            title: 'Main Course Material',
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

    invalidateCoursesCache();
    res.json({ success: true, data: course });
  } catch (err: any) {
    console.error('updateInstructorCourse error:', err);
    res.status(500).json({ success: false, error: { message: err.message || 'Server error' } });
  }
};

/**
 * Delete a course owned by instructor
 */
export const deleteInstructorCourse = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const instructor = await getOrCreateInstructorForUser(user);
    const courseId = req.params.id as string;

    const existing = await prisma.course.findUnique({
      where: { id: courseId }
    });

    if (!existing) {
      return res.status(404).json({ success: false, error: { message: 'Course not found' } });
    }

    if (existing.instructorId !== instructor.id && !user.isAdmin) {
      return res.status(403).json({ success: false, error: { message: 'You do not have permission to delete this course' } });
    }

    await prisma.course.delete({ where: { id: courseId } });
    invalidateCoursesCache();
    res.json({ success: true, message: 'Course deleted successfully' });
  } catch (err: any) {
    console.error('deleteInstructorCourse error:', err);
    res.status(500).json({ success: false, error: { message: err.message || 'Server error' } });
  }
};

/**
 * Get enrolled students for courses owned by the instructor
 */
export const getInstructorStudents = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const instructor = await getOrCreateInstructorForUser(user);

    const courseId = req.query.courseId as string;
    const search = req.query.search as string;

    // Instructor can only view students enrolled in their own courses
    const instructorCourses = await prisma.course.findMany({
      where: { instructorId: instructor.id },
      select: { id: true, title: true }
    });

    const instructorCourseIds = instructorCourses.map(c => c.id);

    const where: any = {
      courseId: courseId ? courseId : { in: instructorCourseIds }
    };

    if (courseId && !instructorCourseIds.includes(courseId) && !user.isAdmin) {
      return res.status(403).json({ success: false, error: { message: 'Unauthorized course access' } });
    }

    if (search) {
      where.user = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } }
        ]
      };
    }

    const enrollments = await prisma.enrollment.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatarUrl: true,
            createdAt: true,
            isActive: true
          }
        },
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            thumbnailUrl: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Also compute progress for each enrolled student
    const enrollmentsWithProgress = await Promise.all(
      enrollments.map(async (enr) => {
        const totalLessons = await prisma.lesson.count({
          where: { module: { courseId: enr.courseId } }
        });

        const completedLessons = await prisma.lessonProgress.count({
          where: {
            userId: enr.userId,
            completed: true,
            lesson: { module: { courseId: enr.courseId } }
          }
        });

        const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

        return {
          ...enr,
          progress: progressPercent,
          completedLessons,
          totalLessons
        };
      })
    );

    res.json({
      success: true,
      data: {
        courses: instructorCourses,
        enrollments: enrollmentsWithProgress
      }
    });
  } catch (err: any) {
    console.error('getInstructorStudents error:', err);
    res.status(500).json({ success: false, error: { message: err.message || 'Server error' } });
  }
};

/**
 * Update an enrollment status for a student in this instructor's course
 */
export const updateInstructorStudentStatus = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const instructor = await getOrCreateInstructorForUser(user);
    const enrollmentId = req.params.id as string;
    const { status } = req.body;

    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: { course: true }
    });

    if (!enrollment) {
      return res.status(404).json({ success: false, error: { message: 'Enrollment not found' } });
    }

    if (enrollment.course.instructorId !== instructor.id && !user.isAdmin) {
      return res.status(403).json({ success: false, error: { message: 'Unauthorized access to enrollment' } });
    }

    const updated = await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { status }
    });

    res.json({ success: true, data: updated });
  } catch (err: any) {
    console.error('updateInstructorStudentStatus error:', err);
    res.status(500).json({ success: false, error: { message: err.message || 'Server error' } });
  }
};
