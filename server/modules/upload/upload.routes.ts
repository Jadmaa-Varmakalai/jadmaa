import { Router } from 'express';
import { uploadImage } from './upload.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = Router();

// Protected image uploads (requires authenticated session)
router.post('/', authenticate, uploadImage);

export default router;
