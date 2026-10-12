import { Router } from 'express';
import { uploadImage } from './upload.controller.js';

const router = Router();

// Allow image uploads (used across admin, courses, blog, user profiles)
router.post('/', uploadImage);

export default router;
