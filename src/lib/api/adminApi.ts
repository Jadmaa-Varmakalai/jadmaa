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
  deleteCourse: (id: string) => fetchApi(`/admin/courses/${id}`, { method: 'DELETE' }),
  
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
