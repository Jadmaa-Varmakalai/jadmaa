import { Router } from 'express';
import { getCourses, getCourseBySlug } from './course.controller.js';
import { optionalAuthenticate } from '../../middleware/auth.middleware.js';

const router = Router();

router.get('/', optionalAuthenticate, getCourses);
router.get('/:slug', optionalAuthenticate, getCourseBySlug);

export default router;
