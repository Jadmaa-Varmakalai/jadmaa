import { Request, Response } from 'express';
import { prisma } from '../../db.js';
import { invalidateCoursesCache } from '../courses/course.controller.js';

let reviewsCache: any = null;
let reviewsCacheTime = 0;
const REVIEWS_CACHE_TTL = 1000 * 60 * 30; // 30 minutes

const VALID_TARGET_TYPES = new Set(['COURSE', 'PRODUCT', 'BLOG']);

async function syncCourseRatingStats(courseId: string) {
  const agg = await prisma.itemReview.aggregate({
    where: { targetType: 'COURSE', targetId: courseId },
    _avg: { rating: true },
    _count: { rating: true },
  });
  const avg = agg._avg.rating ? Number(agg._avg.rating.toFixed(1)) : 0;
  const count = agg._count.rating || 0;
  await prisma.course.update({
    where: { id: courseId },
    data: { rating: avg, reviewCount: count },
  });
  invalidateCoursesCache();
  return { averageRating: avg, totalRatings: count };
}

export const getReviews = async (req: Request, res: Response) => {
  try {
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=600, stale-while-revalidate=1200');

    if (reviewsCache && Date.now() - reviewsCacheTime < REVIEWS_CACHE_TTL) {
      return res.json({ success: true, data: reviewsCache });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    const placeId = 'ChIJjTIYIgC5qjsRcL6Q-fCDunM'; // Thanjavur branch

    if (!apiKey) {
      return res.json({ success: true, data: [] });
    }

    const response = await fetch(
      `https://places.googleapis.com/v1/places/${placeId}?fields=id,displayName,reviews`,
      {
        method: 'GET',
        headers: {
          'X-Goog-Api-Key': apiKey,
        },
      }
    );

    if (!response.ok) {
      const errTxt = await response.text();
      console.warn('Google Places API error (falling back to cache/empty):', response.status, errTxt);
      if (reviewsCache) {
        return res.json({ success: true, data: reviewsCache });
      }
      return res.json({ success: true, data: [] });
    }

    const data = await response.json();

    const testimonials = (data.reviews || []).map((r: any) => ({
      id: r.name,
      name: r.authorAttribution?.displayName || 'Unknown',
      role: 'Student',
      content: r.text?.text || r.originalText?.text || 'No content provided.',
      rating: r.rating || 5,
      avatar: r.authorAttribution?.photoUri || '',
      publishTime: r.publishTime,
    }));

    testimonials.sort(
      (a: any, b: any) => new Date(b.publishTime).getTime() - new Date(a.publishTime).getTime()
    );

    reviewsCache = testimonials;
    reviewsCacheTime = Date.now();

    res.json({ success: true, data: testimonials });
  } catch (err: any) {
    console.warn('getReviews error, falling back to empty reviews list:', err);
    res.json({ success: true, data: [] });
  }
};

export const getItemReviews = async (req: Request, res: Response) => {
  try {
    const targetType = String(req.params.targetType || '').toUpperCase();
    const targetId = String(req.params.targetId || '');

    if (!VALID_TARGET_TYPES.has(targetType) || !targetId) {
      return res.status(400).json({ success: false, error: { message: 'Invalid review target' } });
    }

    const reviews = await prisma.itemReview.findMany({
      where: { targetType: targetType as any, targetId },
      include: {
        user: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalRatings = reviews.length;
    const averageRating =
      totalRatings > 0
        ? Number((reviews.reduce((sum, r) => sum + r.rating, 0) / totalRatings).toFixed(1))
        : 0;

    res.json({
      success: true,
      data: {
        averageRating,
        totalRatings,
        reviews,
      },
    });
  } catch (err: any) {
    console.error('getItemReviews error:', err);
    res.status(500).json({ success: false, error: { message: 'Failed to load reviews' } });
  }
};

export const upsertItemReview = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user?.id) {
      return res.status(401).json({ success: false, error: { message: 'Authentication required' } });
    }

    const targetType = String(req.params.targetType || '').toUpperCase();
    const targetId = String(req.params.targetId || '');
    const ratingNum = Number(req.body?.rating);
    const comment = typeof req.body?.comment === 'string' ? req.body.comment.trim() : null;

    if (!VALID_TARGET_TYPES.has(targetType) || !targetId) {
      return res.status(400).json({ success: false, error: { message: 'Invalid review target' } });
    }
    if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return res
        .status(400)
        .json({ success: false, error: { message: 'Rating must be an integer between 1 and 5' } });
    }

    const review = await prisma.itemReview.upsert({
      where: {
        userId_targetType_targetId: {
          userId: user.id,
          targetType: targetType as any,
          targetId,
        },
      },
      update: {
        rating: ratingNum,
        comment: comment || null,
      },
      create: {
        targetType: targetType as any,
        targetId,
        userId: user.id,
        rating: ratingNum,
        comment: comment || null,
      },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    let stats: { averageRating: number; totalRatings: number };
    if (targetType === 'COURSE') {
      stats = await syncCourseRatingStats(targetId);
    } else {
      const agg = await prisma.itemReview.aggregate({
        where: { targetType: targetType as any, targetId },
        _avg: { rating: true },
        _count: { rating: true },
      });
      stats = {
        averageRating: agg._avg.rating ? Number(agg._avg.rating.toFixed(1)) : 0,
        totalRatings: agg._count.rating || 0,
      };
    }

    res.json({
      success: true,
      data: {
        review,
        ...stats,
      },
    });
  } catch (err: any) {
    console.error('upsertItemReview error:', err);
    res.status(500).json({ success: false, error: { message: 'Failed to submit review' } });
  }
};

export const deleteItemReview = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const reviewId = String(req.params.reviewId || '');
    const existing = await prisma.itemReview.findUnique({ where: { id: reviewId } });
    if (!existing) {
      return res.status(404).json({ success: false, error: { message: 'Review not found' } });
    }

    const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || Boolean(user?.isAdmin);
    if (existing.userId !== user?.id && !isAdmin) {
      return res.status(403).json({ success: false, error: { message: 'Not authorized to delete this review' } });
    }

    await prisma.itemReview.delete({ where: { id: reviewId } });

    if (existing.targetType === 'COURSE') {
      await syncCourseRatingStats(existing.targetId);
    }

    res.json({ success: true, data: { deleted: true } });
  } catch (err: any) {
    console.error('deleteItemReview error:', err);
    res.status(500).json({ success: false, error: { message: 'Failed to delete review' } });
  }
};

export const getBlogComments = async (req: Request, res: Response) => {
  try {
    const blogPostId = String(req.params.blogPostId || '');
    if (!blogPostId) {
      return res.status(400).json({ success: false, error: { message: 'Blog post ID is required' } });
    }

    const comments = await prisma.blogComment.findMany({
      where: { blogPostId },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: comments });
  } catch (err: any) {
    console.error('getBlogComments error:', err);
    res.status(500).json({ success: false, error: { message: 'Failed to load comments' } });
  }
};

export const createBlogComment = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user?.id) {
      return res.status(401).json({ success: false, error: { message: 'Authentication required' } });
    }

    const blogPostId = String(req.params.blogPostId || '');
    const content = typeof req.body?.content === 'string' ? req.body.content.trim() : '';

    if (!blogPostId || !content) {
      return res.status(400).json({ success: false, error: { message: 'Comment content is required' } });
    }

    const comment = await prisma.blogComment.create({
      data: {
        blogPostId,
        userId: user.id,
        content,
      },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    res.status(201).json({ success: true, data: comment });
  } catch (err: any) {
    console.error('createBlogComment error:', err);
    res.status(500).json({ success: false, error: { message: 'Failed to post comment' } });
  }
};

export const deleteBlogComment = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const commentId = String(req.params.commentId || '');

    const existing = await prisma.blogComment.findUnique({ where: { id: commentId } });
    if (!existing) {
      return res.status(404).json({ success: false, error: { message: 'Comment not found' } });
    }

    const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || Boolean(user?.isAdmin);
    if (existing.userId !== user?.id && !isAdmin) {
      return res.status(403).json({ success: false, error: { message: 'Not authorized to delete this comment' } });
    }

    await prisma.blogComment.delete({ where: { id: commentId } });
    res.json({ success: true, data: { deleted: true } });
  } catch (err: any) {
    console.error('deleteBlogComment error:', err);
    res.status(500).json({ success: false, error: { message: 'Failed to delete comment' } });
  }
};
