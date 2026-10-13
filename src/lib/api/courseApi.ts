import { fetchApi } from './apiClient';
import type { Course } from '../../types';

let memoryCoursesCache: Course[] | null = null;
const slugCache = new Map<string, Course>();

export const courseApi = {
  /**
   * Synchronously get cached courses if available (for instant initial state)
   */
  getCachedCourses: (): Course[] => {
    if (memoryCoursesCache && memoryCoursesCache.length > 0) {
      return memoryCoursesCache;
    }
    try {
      const cached = sessionStorage.getItem('jadmaa_courses_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          memoryCoursesCache = parsed;
          return parsed;
        }
      }
    } catch (_) {}
    return [];
  },

  clearCache: () => {
    memoryCoursesCache = null;
    slugCache.clear();
    try {
      sessionStorage.removeItem('jadmaa_courses_cache');
    } catch (_) {}
  },

  getCourses: async (forceRefresh = false): Promise<Course[]> => {
    try {
      const res = await fetchApi('/courses');
      if (res?.data && Array.isArray(res.data)) {
        memoryCoursesCache = res.data;
        try {
          sessionStorage.setItem('jadmaa_courses_cache', JSON.stringify(res.data));
        } catch (_) {}
        return res.data;
      }
    } catch (err) {
      console.warn('Failed to fetch fresh courses, using cached data if available', err);
    }
    return courseApi.getCachedCourses();
  },

  getCourseBySlug: async (slug: string): Promise<Course> => {
    if (slugCache.has(slug)) {
      return slugCache.get(slug)!;
    }

    // Check if course already exists in cached list
    const cachedList = courseApi.getCachedCourses();
    const existing = cachedList.find(c => c.slug === slug || c.id === slug);
    if (existing && existing.modules && existing.modules.length > 0) {
      slugCache.set(slug, existing);
      // Revalidate in background
      fetchApi(`/courses/${slug}`).then(res => {
        if (res?.data) {
          slugCache.set(slug, res.data);
        }
      }).catch(() => {});
      return existing;
    }

    const res = await fetchApi(`/courses/${slug}`);
    if (res?.data) {
      slugCache.set(slug, res.data);
    }
    return res.data;
  }
};
