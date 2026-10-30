import { Router } from 'express';
import { register, login, getMe, refresh, logout, updateProfile, checkInstructorStatus } from './auth.controller.js';
import { forgotPassword, resetPassword, changePassword } from './password.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import {
  loginLimiter,
  registerLimiter,
  forgotPasswordLimiter,
  resetPasswordLimiter,
} from '../../middleware/rateLimiter.js';

const router = Router();

router.post('/register', registerLimiter, register);
router.post('/login', loginLimiter, login);
router.get('/check-instructor', checkInstructorStatus);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', authenticate, getMe);
router.put('/update-profile', authenticate, updateProfile);

router.post('/forgot-password', forgotPasswordLimiter, forgotPassword);
router.post('/reset-password', resetPasswordLimiter, resetPassword);
router.post('/change-password', authenticate, resetPasswordLimiter, changePassword);

export default router;
