import { Router } from 'express';
import { getBlogs, getBlogBySlug, createBlog, updateBlog, deleteBlog } from './blog.controller.js';
import { authenticate, requireAdmin } from '../../middleware/auth.middleware.js';

const router = Router();

router.get('/', getBlogs);
router.get('/:slug', getBlogBySlug);
router.post('/', authenticate, requireAdmin, createBlog);
router.put('/:id', authenticate, requireAdmin, updateBlog);
router.delete('/:id', authenticate, requireAdmin, deleteBlog);

export default router;
