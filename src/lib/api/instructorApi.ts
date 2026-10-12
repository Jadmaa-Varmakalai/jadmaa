import { fetchApi } from './apiClient';

export interface InstructorCoursePayload {
  title: string;
  subtitle?: string;
  description: string;
  longDescription?: string;
  category?: string;
  level?: string;
  duration?: string;
  price: number;
  isFree?: boolean;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  thumbnailUrl?: string;
  youtubeUrl?: string;
  certificateEnabled?: boolean;
}

export const instructorApi = {
  getDashboard: () => fetchApi('/instructor/dashboard'),
  getCourses: (search?: string) => {
    const params = search ? `?search=${encodeURIComponent(search)}` : '';
    return fetchApi(`/instructor/courses${params}`);
  },
  createCourse: (data: InstructorCoursePayload) =>
    fetchApi('/instructor/courses', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateCourse: (id: string, data: Partial<InstructorCoursePayload>) =>
    fetchApi(`/instructor/courses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteCourse: (id: string) =>
    fetchApi(`/instructor/courses/${id}`, {
      method: 'DELETE',
    }),
  getStudents: (courseId?: string, search?: string) => {
    const query = new URLSearchParams();
    if (courseId) query.append('courseId', courseId);
    if (search) query.append('search', search);
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return fetchApi(`/instructor/students${queryString}`);
  },
  updateStudentStatus: (enrollmentId: string, status: 'ACTIVE' | 'REVOKED' | 'COMPLETED') =>
    fetchApi(`/instructor/students/${enrollmentId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
};
