import { Request, Response } from 'express';
import { prisma } from '../../db.js';
let coursesCache: any = null;
let lastCacheTime = 0;
const CACHE_TTL = 1000 * 60 * 5; // 5 minutes
const slugCache: Record<string, {data: any, time: number}> = {};

// Clear public course caches (called after admin/instructor edit a course)
export const invalidateCoursesCache = () => {
  coursesCache = null;
  lastCacheTime = 0;
  Object.keys(slugCache).forEach((k) => delete slugCache[k]);
};

export const getCourses = async (req: Request, res: Response) => {
  try {
    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600');

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

    // Format for frontend
    const formatted = courses.map(c => ({
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
        name: c.instructor.displayName,
        title: c.instructor.title || '',
        avatar: c.instructor.avatarUrl || '',
        bio: c.instructor.bio || ''
      },
      price: c.price,
      isFree: c.isFree,
      isAvailable: (c as any).isAvailable !== false,
      rating: c.rating || 0,
      reviewCount: c.reviewCount || 0,
      whatYouWillLearn: [], // Need to add to DB or keep empty
      requirements: [], // Need to add to DB or keep empty
      targetAudience: [], // Need to add to DB or keep empty
      modules: c.modules.map(m => ({
        id: m.id,
        title: m.title,
        description: m.description,
        lessons: m.lessons.map(l => ({
          id: l.id,
          title: l.title,
          duration: `${Math.floor(l.durationSeconds / 60)} min`,
          isFreePreview: l.isPreview,
          videoUrl: l.youtubeVideoId
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
    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600');

    const slug = req.params.slug as string;
    if (slugCache[slug] && Date.now() - slugCache[slug].time < CACHE_TTL) {
      return res.json({ success: true, data: slugCache[slug].data });
    }

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
        name: course.instructor.displayName,
        title: course.instructor.title || '',
        avatar: course.instructor.avatarUrl || '',
        bio: course.instructor.bio || ''
      },
      price: course.price,
      isFree: course.isFree,
      isAvailable: (course as any).isAvailable !== false,
      rating: course.rating || 0,
      reviewCount: course.reviewCount || 0,
      whatYouWillLearn: [],
      requirements: [],
      targetAudience: [],
      modules: course.modules.map(m => ({
        id: m.id,
        title: m.title,
        description: m.description,
        lessons: m.lessons.map(l => ({
          id: l.id,
          title: l.title,
          duration: `${Math.floor(l.durationSeconds / 60)} min`,
          isFreePreview: l.isPreview,
          videoUrl: l.youtubeVideoId
        }))
      }))
    };


    slugCache[slug] = { data: formatted, time: Date.now() };
    res.json({ success: true, data: formatted });

  } catch (err: any) {
    console.warn('getCourseBySlug error:', err);
    res.status(500).json({ success: false, error: { message: 'Server error' } });
  }
};
