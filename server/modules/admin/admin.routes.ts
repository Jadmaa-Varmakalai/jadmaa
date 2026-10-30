import { Router } from 'express';
import { authenticate, requireAdmin, requireSuperAdmin } from '../../middleware/auth.middleware.js';
import { publicEnquiryLimiter } from '../../middleware/rateLimiter.js';
import * as adminController from './admin.controller.js';

const router = Router();

// Dashboard
router.get('/dashboard/stats', authenticate, requireAdmin, adminController.getDashboardStats);
router.get('/analytics', authenticate, requireAdmin, adminController.getAnalytics);

// Students
router.get('/students', authenticate, requireAdmin, adminController.getStudents);
router.get('/students/:id', authenticate, requireAdmin, adminController.getStudentById);
router.patch('/students/:id/status', authenticate, requireAdmin, adminController.updateStudentStatus);

// Instructors
router.get('/instructors', authenticate, requireAdmin, adminController.getInstructors);
router.post('/instructors', authenticate, requireAdmin, adminController.createInstructor);
router.get('/instructors/applications', authenticate, requireAdmin, adminController.getInstructorApplications);
router.post('/instructors/applications/approve', authenticate, requireAdmin, adminController.approveInstructorApplication);
router.post('/instructors/applications/reject', authenticate, requireAdmin, adminController.rejectInstructorApplication);
router.get('/instructors/:id', authenticate, requireAdmin, adminController.getInstructorById);
router.patch('/instructors/:id', authenticate, requireAdmin, adminController.updateInstructor);
router.patch('/instructors/:id/status', authenticate, requireAdmin, adminController.updateInstructorStatus);

// Courses
router.get('/courses', authenticate, requireAdmin, adminController.getCourses);
router.post('/courses', authenticate, requireAdmin, adminController.createCourse);
router.get('/courses/:id', authenticate, requireAdmin, adminController.getCourseById);
router.patch('/courses/:id', authenticate, requireAdmin, adminController.updateCourse);
router.delete('/courses/:id', authenticate, requireAdmin, adminController.deleteCourse);
router.post('/courses/:id/publish', authenticate, requireAdmin, adminController.publishCourse);
router.post('/courses/:id/unpublish', authenticate, requireAdmin, adminController.unpublishCourse);
router.patch('/courses/:id/availability', authenticate, requireAdmin, adminController.updateCourseAvailability);

// Course Modules & Lessons (Managed under course or separate? Under course makes sense but let's just make direct module/lesson routes as needed, or handle inside get/update course). Let's do simple CRUDs on modules/lessons
router.post('/modules', authenticate, requireAdmin, adminController.createModule);
router.patch('/modules/:id', authenticate, requireAdmin, adminController.updateModule);
router.delete('/modules/:id', authenticate, requireAdmin, adminController.deleteModule);

router.post('/lessons', authenticate, requireAdmin, adminController.createLesson);
router.patch('/lessons/:id', authenticate, requireAdmin, adminController.updateLesson);
router.delete('/lessons/:id', authenticate, requireAdmin, adminController.deleteLesson);

// Enrollments
router.get('/enrollments', authenticate, requireAdmin, adminController.getEnrollments);
router.get('/enrollments/:id', authenticate, requireAdmin, adminController.getEnrollmentById);

// Payments & Refunds
router.get('/payments', authenticate, requireAdmin, adminController.getPayments);
router.get('/payments/:id', authenticate, requireAdmin, adminController.getPaymentById);
router.post('/payments/:id/refund', authenticate, requireAdmin, adminController.refundPayment);

// Certificates
router.get('/certificates', authenticate, requireAdmin, adminController.getCertificates);
router.get('/certificates/:id', authenticate, requireAdmin, adminController.getCertificateById);
router.post('/certificates/:id/revoke', authenticate, requireAdmin, adminController.revokeCertificate);

// Enquiries
router.post('/enquiries/public', publicEnquiryLimiter, adminController.submitPublicEnquiry);
router.get('/enquiries', authenticate, requireAdmin, adminController.getEnquiries);
router.get('/enquiries/:id', authenticate, requireAdmin, adminController.getEnquiryById);
router.patch('/enquiries/:id/status', authenticate, requireAdmin, adminController.updateEnquiryStatus);
router.delete('/enquiries/:id', authenticate, requireAdmin, adminController.deleteEnquiry);

// Administrators & Audit Logs (Super Admin only)
router.get('/administrators', authenticate, requireSuperAdmin, adminController.getAdministrators);
router.post('/administrators', authenticate, requireSuperAdmin, adminController.createAdministrator);
router.patch('/administrators/:id', authenticate, requireSuperAdmin, adminController.updateAdministrator);
router.patch('/administrators/:id/status', authenticate, requireSuperAdmin, adminController.updateAdministratorStatus);

router.get('/audit-logs', authenticate, requireSuperAdmin, adminController.getAuditLogs);

// Settings
router.get('/settings', authenticate, requireAdmin, adminController.getSettings);
router.patch('/settings', authenticate, requireAdmin, adminController.updateSettings);

export default router;
