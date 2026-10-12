import { Router } from 'express';
import { authenticate, requireInstructor } from '../../middleware/auth.middleware.js';
import * as instructorController from './instructor.controller.js';

const router = Router();

// Instructor Dashboard stats
router.get('/dashboard', authenticate, requireInstructor, instructorController.getInstructorDashboard);

// Instructor Courses (CRUD)
router.get('/courses', authenticate, requireInstructor, instructorController.getInstructorCourses);
router.post('/courses', authenticate, requireInstructor, instructorController.createInstructorCourse);
router.put('/courses/:id', authenticate, requireInstructor, instructorController.updateInstructorCourse);
router.patch('/courses/:id', authenticate, requireInstructor, instructorController.updateInstructorCourse);
router.delete('/courses/:id', authenticate, requireInstructor, instructorController.deleteInstructorCourse);

// Instructor Student Management
router.get('/students', authenticate, requireInstructor, instructorController.getInstructorStudents);
router.patch('/students/:id/status', authenticate, requireInstructor, instructorController.updateInstructorStudentStatus);

export default router;
