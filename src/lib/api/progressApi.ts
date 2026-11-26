import { fetchApi } from './apiClient';

let memoryEnrollmentsCache: any[] | null = null;
let memoryDashboardCache: any = null;

export const progressApi = {
  clearCache: () => {
    memoryEnrollmentsCache = null;
    memoryDashboardCache = null;
    try {
      sessionStorage.removeItem('jadmaa_enrollments_cache');
      sessionStorage.removeItem('jadmaa_dashboard_cache');
    } catch (_) {}
  },
  
  getCachedEnrollments: (): any[] => {
    if (memoryEnrollmentsCache && memoryEnrollmentsCache.length > 0) {
      return memoryEnrollmentsCache;
    }
    try {
      const cached = sessionStorage.getItem('jadmaa_enrollments_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          memoryEnrollmentsCache = parsed;
          return parsed;
        }
      }
    } catch (_) {}
    return [];
  },

  getMyEnrollments: async (forceRefresh = false) => {
    if (forceRefresh) {
      memoryEnrollmentsCache = null;
      try {
        sessionStorage.removeItem('jadmaa_enrollments_cache');
      } catch (_) {}
    } else {
      const cached = progressApi.getCachedEnrollments();
      if (cached.length > 0) {
        // Revalidate in background
        fetchApi('/me/enrollments').then(res => {
          if (res?.success && Array.isArray(res.data)) {
            memoryEnrollmentsCache = res.data;
            try {
              sessionStorage.setItem('jadmaa_enrollments_cache', JSON.stringify(res.data));
            } catch (_) {}
          }
        }).catch(() => {});
        return { success: true, data: cached };
      }
    }

    const res = await fetchApi('/me/enrollments');
    if (res?.success && Array.isArray(res.data)) {
      memoryEnrollmentsCache = res.data;
      try {
        sessionStorage.setItem('jadmaa_enrollments_cache', JSON.stringify(res.data));
      } catch (_) {}
    }
    return res;
  },

  getCachedDashboard: (): any => {
    if (memoryDashboardCache) return memoryDashboardCache;
    try {
      const cached = sessionStorage.getItem('jadmaa_dashboard_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed) {
          memoryDashboardCache = parsed;
          return parsed;
        }
      }
    } catch (_) {}
    return null;
  },

  getDashboard: async (forceRefresh = false) => {
    if (!forceRefresh) {
      const cached = progressApi.getCachedDashboard();
      if (cached) {
        fetchApi('/me/dashboard').then(res => {
          if (res?.success && res.data) {
            memoryDashboardCache = res.data;
            try {
              sessionStorage.setItem('jadmaa_dashboard_cache', JSON.stringify(res.data));
            } catch (_) {}
          }
        }).catch(() => {});
        return { success: true, data: cached };
      }
    }

    const res = await fetchApi('/me/dashboard');
    if (res?.success && res.data) {
      memoryDashboardCache = res.data;
      try {
        sessionStorage.setItem('jadmaa_dashboard_cache', JSON.stringify(res.data));
      } catch (_) {}
    }
    return res;
  },

  getCertificates: async () => {
    return fetchApi('/me/certificates');
  },
  getCourseProgress: async (courseId: string) => {
    return fetchApi(`/me/courses/${courseId}/progress`);
  },
  updateLessonProgress: async (lessonId: string, watchedSeconds: number, completed: boolean) => {
    return fetchApi(`/me/lessons/${lessonId}/progress`, {
      method: 'POST',
      body: JSON.stringify({ watchedSeconds, completed }),
    });
  }
};
