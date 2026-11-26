import { Router } from 'express';
import {
  getReviews,
  getItemReviews,
  upsertItemReview,
  deleteItemReview,
  getBlogComments,
  createBlogComment,
  deleteBlogComment,
} from './reviews.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = Router();

// Google Places testimonials (public)
router.get('/', getReviews);

// Item reviews & ratings (COURSE | PRODUCT | BLOG)
router.get('/item/:targetType/:targetId', getItemReviews);
router.post('/item/:targetType/:targetId', authenticate, upsertItemReview);
router.delete('/item/:reviewId', authenticate, deleteItemReview);

// Blog comments
router.get('/blog-comments/:blogPostId', getBlogComments);
router.post('/blog-comments/:blogPostId', authenticate, createBlogComment);
router.delete('/blog-comments/:commentId', authenticate, deleteBlogComment);

export default router;
