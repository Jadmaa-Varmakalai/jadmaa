import { Router } from 'express';
import { register, login, getMe, refresh, logout, updateProfile, checkInstructorStatus } from './auth.controller.js';
import { forgotPassword, resetPassword, changePassword } from './password.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/check-instructor', checkInstructorStatus);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', authenticate, getMe);
router.put('/update-profile', authenticate, updateProfile);


router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/change-password', authenticate, changePassword);



export default router;
