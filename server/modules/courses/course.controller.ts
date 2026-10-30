import { Request, Response } from 'express';
import { prisma } from '../../db.js';
import { isCourseAvailable } from '../../services/courseAvailability.service.js';

let coursesCache: any = null;
let lastCacheTime = 0;
const CACHE_TTL = 1000 * 60 * 5; // 5 minutes
const publicSlugCache: Record<string, { data: any; time: number }> = {};

// Clear public course caches (called after admin/instructor edit a course)
export const invalidateCoursesCache = () => {
  coursesCache = null;
  lastCacheTime = 0;
  Object.keys(publicSlugCache).forEach((k) => delete publicSlugCache[k]);
};

/**
 * Helper to determine if a user has full authorized access to paid course videos.
 */
export const canAccessFullCourse = (user: any, course: any): boolean => {
  if (!course) return false;
  // Free courses are viewable by anyone
  if (course.isFree || course.price === 0) return true;
  if (!user) return false;

  // Administrators have full access
  if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' || user.isAdmin) return true;

  // Course instructor has full access to their course
  if (
    user.role === 'INSTRUCTOR' &&
    (course.instructorId === user.instructorProfile?.id ||
      course.instructorId === user.id)
  ) {
    return true;
  }

  // Active enrolled students have full access
  if (user.enrollments && Array.isArray(user.enrollments)) {
    return user.enrollments.some(
      (e: any) =>
        e.courseId === course.id &&
        (e.status === 'ACTIVE' || e.status === 'COMPLETED' || e.status === undefined)
    );
  }

  return false;
};

export const getCourses = async (req: Request, res: Response) => {
  try {
    res.setHeader('Cache-Control', 'no-cache, private');

    // Return cached public catalog if fresh
    if (coursesCache && Date.now() - lastCacheTime < CACHE_TTL) {
      return res.json({ success: true, data: coursesCache });
    }

    const courses = await prisma.course.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { price: 'asc' },
      include: {
        instructor: { select: { displayName: true, title: true, avatarUrl: true, bio: true } },
        modules: {
          include: { lessons: true }
        }
      }
    });

    // Format for catalog: strictly exclude paid video URLs from public catalog
    const formatted = courses.map((c) => ({
      id: c.id,
      slug: c.slug,
      title: c.title,
      subtitle: c.subtitle,
      description: c.description,
      longDescription: c.longDescription,
      thumbnail: c.thumbnailUrl,
      category: c.category,
      level: c.level,
      duration: c.duration,
      totalLessons: c.modules.reduce((acc, m) => acc + m.lessons.length, 0),
      instructor: {
        name: c.instructor?.displayName || 'JADMAA Master',
        title: c.instructor?.title || '',
        avatar: c.instructor?.avatarUrl || '',
        bio: c.instructor?.bio || ''
      },
      price: c.price,
      isFree: c.isFree,
      isAvailable: isCourseAvailable(c.id),
      status: !isCourseAvailable(c.id) ? 'HOLD' : c.status,
      rating: c.rating || 0,
      reviewCount: c.reviewCount || 0,
      whatYouWillLearn: [],
      requirements: [],
      targetAudience: [],
      modules: c.modules.map((m) => ({
        id: m.id,
        title: m.title,
        description: m.description,
        lessons: m.lessons.map((l) => ({
          id: l.id,
          title: l.title,
          duration: `${Math.floor(l.durationSeconds / 60)} min`,
          isFreePreview: l.isPreview,
          // VULN-01 Defense: Only explicitly marked free preview lessons expose their videoUrl publicly
          videoUrl: (c.isFree || l.isPreview) ? l.youtubeVideoId : null
        }))
      }))
    }));

    coursesCache = formatted;
    lastCacheTime = Date.now();

    res.json({ success: true, data: formatted });
  } catch (err: any) {
    console.warn('getCourses error:', err);
    if (coursesCache) {
      return res.json({ success: true, data: coursesCache });
    }
    res.status(500).json({ success: false, error: { message: 'Server error fetching courses' } });
  }
};

export const getCourseBySlug = async (req: Request, res: Response) => {
  try {
    const slug = req.params.slug as string;
    const user = (req as any).user;

    const isUUID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(slug);
    const course = await prisma.course.findUnique({
      where: isUUID ? { id: slug } : { slug: slug },
      include: {
        instructor: { select: { displayName: true, title: true, avatarUrl: true, bio: true } },
        modules: {
          include: { lessons: { orderBy: { sortOrder: 'asc' } } },
          orderBy: { sortOrder: 'asc' }
        }
      }
    });

    if (!course) {
      return res.status(404).json({ success: false, error: { message: 'Course not found' } });
    }

    // Determine access permissions for this request
    const hasFullAccess = canAccessFullCourse(user, course);

    // Cache handling: Only public responses (without full access) use the shared public cache
    if (!hasFullAccess) {
      res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600');
      if (publicSlugCache[slug] && Date.now() - publicSlugCache[slug].time < CACHE_TTL) {
        return res.json({ success: true, data: publicSlugCache[slug].data });
      }
    } else {
      // User is authenticated and authorized: do not allow intermediate CDN caches to store personalized video tokens
      res.setHeader('Cache-Control', 'no-store, private');
    }

    const formatted = {
      id: course.id,
      slug: course.slug,
      title: course.title,
      subtitle: course.subtitle,
      description: course.description,
      longDescription: course.longDescription,
      thumbnail: course.thumbnailUrl,
      category: course.category,
      level: course.level,
      duration: course.duration,
      totalLessons: course.modules.reduce((acc, m) => acc + m.lessons.length, 0),
      instructor: {
        name: course.instructor?.displayName || 'JADMAA Master',
        title: course.instructor?.title || '',
        avatar: course.instructor?.avatarUrl || '',
        bio: course.instructor?.bio || ''
      },
      price: course.price,
      isFree: course.isFree,
      isAvailable: isCourseAvailable(course.id),
      status: !isCourseAvailable(course.id) ? 'HOLD' : course.status,
      rating: course.rating || 0,
      reviewCount: course.reviewCount || 0,
      whatYouWillLearn: [],
      requirements: [],
      targetAudience: [],
      hasFullAccess,
      modules: course.modules.map((m) => ({
        id: m.id,
        title: m.title,
        description: m.description,
        lessons: m.lessons.map((l) => ({
          id: l.id,
          title: l.title,
          duration: `${Math.floor(l.durationSeconds / 60)} min`,
          isFreePreview: l.isPreview,
          // VULN-01 Fix: Video ID is only provided if user has verified full access or lesson is free preview
          videoUrl: (hasFullAccess || l.isPreview) ? l.youtubeVideoId : null
        }))
      }))
    };

    if (!hasFullAccess) {
      publicSlugCache[slug] = { data: formatted, time: Date.now() };
    }

    res.json({ success: true, data: formatted });
  } catch (err: any) {
    console.warn('getCourseBySlug error:', err);
    res.status(500).json({ success: false, error: { message: 'Server error' } });
  }
};
