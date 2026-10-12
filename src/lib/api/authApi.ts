import { fetchApi } from './apiClient';

export const authApi = {
  login: async (credentials: any) => {
    return fetchApi('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },
  register: async (data: any) => {
    return fetchApi('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  checkInstructor: async (email: string) => {
    return fetchApi(`/auth/check-instructor?email=${encodeURIComponent(email)}`);
  },
  logout: async () => {
    return fetchApi('/auth/logout', {
      method: 'POST',
    });
  },
  getMe: async () => {
    return fetchApi('/auth/me');
  },
  forgotPassword: async (email: string) => {
    return fetchApi('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },
  resetPassword: async (data: any) => {
    return fetchApi('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  changePassword: async (data: any) => {
    return fetchApi('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};
