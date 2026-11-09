import { Router } from 'express';
import { getBlogs, getBlogBySlug, createBlog, updateBlog, deleteBlog, getOptimizedImage, updateBlogThumbnail } from './blog.controller.js';
import { authenticate, requireAdmin } from '../../middleware/auth.middleware.js';

const router = Router();

// High-performance image optimization endpoint (must come before /:slug)
router.get('/optimized-image', getOptimizedImage);

router.get('/', getBlogs);
router.get('/:slug', getBlogBySlug);
router.put('/:id/thumbnail', updateBlogThumbnail);
router.patch('/:id/thumbnail', updateBlogThumbnail);
router.post('/', authenticate, requireAdmin, createBlog);
router.put('/:id', authenticate, requireAdmin, updateBlog);
router.delete('/:id', authenticate, requireAdmin, deleteBlog);

export default router;
