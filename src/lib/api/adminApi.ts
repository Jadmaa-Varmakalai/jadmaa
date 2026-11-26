import { fetchApi } from './apiClient';

export const adminApi = {
  getDashboardStats: () => fetchApi('/admin/dashboard/stats'),
  getAnalytics: () => fetchApi('/admin/analytics'),
  
  // Students
  getStudents: (params = {}) => {
    const qs = new URLSearchParams(params as any).toString();
    return fetchApi(`/admin/students${qs ? '?' + qs : ''}`);
  },
  getStudentById: (id: string) => fetchApi(`/admin/students/${id}`),
  updateStudentStatus: (id: string, isActive: boolean) => fetchApi(`/admin/students/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ isActive })
  }),
  
  // Instructors
  getInstructors: (params = {}) => {
    const qs = new URLSearchParams(params as any).toString();
    return fetchApi(`/admin/instructors${qs ? '?' + qs : ''}`);
  },
  createInstructor: (data: any) => fetchApi('/admin/instructors', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  updateInstructor: (id: string, data: any) => fetchApi(`/admin/instructors/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  }),
  updateInstructorStatus: (id: string, isActive: boolean) => fetchApi(`/admin/instructors/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ isActive })
  }),
  getInstructorApplications: () => fetchApi('/admin/instructors/applications'),
  approveInstructorApplication: (userId: string) => fetchApi('/admin/instructors/applications/approve', {
    method: 'POST',
    body: JSON.stringify({ userId })
  }),
  rejectInstructorApplication: (userId: string) => fetchApi('/admin/instructors/applications/reject', {
    method: 'POST',
    body: JSON.stringify({ userId })
  }),
  updateInstructorCommission: (id: string, commissionRate: number) => fetchApi(`/admin/instructors/${id}/commission`, {
    method: 'PATCH',
    body: JSON.stringify({ commissionRate })
  }),
  getInstructorFinancials: (id: string) => fetchApi(`/admin/instructors/${id}/financials`),
  removeInstructor: (id: string) => fetchApi(`/admin/instructors/${id}`, {
    method: 'DELETE'
  }),
  
  // Courses
  getCourses: (params = {}) => {
    const qs = new URLSearchParams(params as any).toString();
    return fetchApi(`/admin/courses${qs ? '?' + qs : ''}`);
  },
  getCourseById: (id: string) => fetchApi(`/admin/courses/${id}`),
  createCourse: (data: any) => fetchApi('/admin/courses', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  updateCourse: (id: string, data: any) => fetchApi(`/admin/courses/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  }),
  updateCourseAvailability: (id: string, isAvailable: boolean) => fetchApi(`/admin/courses/${id}/availability`, {
    method: 'PATCH',
    body: JSON.stringify({ isAvailable })
  }),
  deleteCourse: (id: string, force = false) => fetchApi(`/admin/courses/${id}${force ? '?force=true' : ''}`, { method: 'DELETE' }),

  // Curriculum & Video Lessons (Modules & Lessons)
  saveCourseCurriculum: (courseId: string, modules: any[]) => fetchApi(`/admin/courses/${courseId}/curriculum`, {
    method: 'PUT',
    body: JSON.stringify({ modules })
  }),
  createModule: (data: { courseId: string; title: string; description?: string; sortOrder?: number }) => fetchApi('/admin/modules', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  updateModule: (id: string, data: { title?: string; description?: string; sortOrder?: number }) => fetchApi(`/admin/modules/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  }),
  deleteModule: (id: string) => fetchApi(`/admin/modules/${id}`, { method: 'DELETE' }),
  createLesson: (data: { moduleId: string; title: string; description?: string; youtubeVideoId?: string; videoUrl?: string; durationMinutes?: number; durationSeconds?: number; isPreview?: boolean; sortOrder?: number }) => fetchApi('/admin/lessons', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  updateLesson: (id: string, data: { title?: string; description?: string; youtubeVideoId?: string; videoUrl?: string; durationMinutes?: number; durationSeconds?: number; isPreview?: boolean; sortOrder?: number }) => fetchApi(`/admin/lessons/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  }),
  deleteLesson: (id: string) => fetchApi(`/admin/lessons/${id}`, { method: 'DELETE' }),
  
  // Enrollments
  getEnrollments: (params = {}) => {
    const qs = new URLSearchParams(params as any).toString();
    return fetchApi(`/admin/enrollments${qs ? '?' + qs : ''}`);
  },
  
  // Payments
  getPayments: (params = {}) => {
    const qs = new URLSearchParams(params as any).toString();
    return fetchApi(`/admin/payments${qs ? '?' + qs : ''}`);
  },
  refundPayment: (id: string) => fetchApi(`/admin/payments/${id}/refund`, { method: 'POST' }),

  // Logs
  getAuditLogs: (params = {}) => {
    const qs = new URLSearchParams(params as any).toString();
    return fetchApi(`/admin/audit-logs${qs ? '?' + qs : ''}`);
  },

  // Settings (Website Content Editor)
  getSettings: () => fetchApi('/admin/settings'),
  updateSetting: (key: string, value: string, description?: string) => fetchApi('/admin/settings', {
    method: 'PATCH',
    body: JSON.stringify({ key, value, description })
  }),

  // Enquiries
  getEnquiries: (params = {}) => {
    const qs = new URLSearchParams(params as any).toString();
    return fetchApi(`/admin/enquiries${qs ? '?' + qs : ''}`);
  },
  updateEnquiryStatus: (id: string, status: string) => fetchApi(`/admin/enquiries/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  }),
  deleteEnquiry: (id: string) => fetchApi(`/admin/enquiries/${id}`, { method: 'DELETE' }),
  submitEnquiry: (data: any) => fetchApi('/admin/enquiries/public', {
    method: 'POST',
    body: JSON.stringify(data)
  })
};
