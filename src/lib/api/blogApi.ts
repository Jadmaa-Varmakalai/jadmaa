import { fetchApi } from './apiClient';

export interface BlogPost {
  id: string;
  title: string;
  topic?: string;
  slug: string;
  content: string;
  excerpt: string | null;
  thumbnailUrl: string | null;
  authorId: string;
  author?: {
    name: string;
    avatarUrl: string | null;
  };
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

import defaultBlogsData from '../../data/jadmaa_blogs';

let memoryBlogsCache: BlogPost[] | null = null;
const blogSlugCache = new Map<string, BlogPost>();

const defaultBlogs: BlogPost[] = defaultBlogsData as unknown as BlogPost[];

export const cleanSlug = (s: string) =>
  decodeURIComponent(s || '')
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{M}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '');

const normalizeSlug = cleanSlug;

export const blogApi = {
  getCachedBlogs: (): BlogPost[] => {
    if (memoryBlogsCache && memoryBlogsCache.length > 0) {
      return memoryBlogsCache;
    }
    try {
      const cached = sessionStorage.getItem('jadmaa_blogs_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          memoryBlogsCache = parsed;
          return parsed;
        }
      }
    } catch (_) {}
    return [];
  },

  getBlogs: async (all?: boolean): Promise<BlogPost[]> => {
    try {
      const res = await fetchApi(all ? '/blogs?all=true' : '/blogs');
      if (res?.data && Array.isArray(res.data)) {
        memoryBlogsCache = res.data;
        try {
          sessionStorage.setItem('jadmaa_blogs_cache', JSON.stringify(res.data));
        } catch (_) {}
        return res.data;
      }
    } catch (_) {}

    return blogApi.getCachedBlogs();
  },

  getBlogBySlug: async (slug: string): Promise<BlogPost> => {
    const rawSlug = (slug || '').trim();
    const decodedSlug = decodeURIComponent(rawSlug).trim();
    const clean = cleanSlug(rawSlug);

    if (rawSlug && blogSlugCache.has(rawSlug)) {
      return blogSlugCache.get(rawSlug)!;
    }
    if (decodedSlug && blogSlugCache.has(decodedSlug)) {
      return blogSlugCache.get(decodedSlug)!;
    }
    if (clean && clean.length > 0 && blogSlugCache.has(clean)) {
      return blogSlugCache.get(clean)!;
    }

    const cachedList = blogApi.getCachedBlogs();
    const existing = cachedList.find(b => {
      if (rawSlug && (b.id === rawSlug || b.slug === rawSlug)) return true;
      if (decodedSlug && (b.id === decodedSlug || b.slug === decodedSlug)) return true;
      const bClean = cleanSlug(b.slug);
      if (clean && bClean && bClean === clean) return true;
      const bTitleClean = cleanSlug(b.title);
      if (clean && bTitleClean && bTitleClean === clean) return true;
      return false;
    });

    if (existing && existing.content) {
      if (rawSlug) blogSlugCache.set(rawSlug, existing);
      if (decodedSlug) blogSlugCache.set(decodedSlug, existing);
      if (clean) blogSlugCache.set(clean, existing);
      fetchApi(`/blogs/${encodeURIComponent(clean || rawSlug)}`).then(res => {
        if (res?.data) {
          if (rawSlug) blogSlugCache.set(rawSlug, res.data);
          if (decodedSlug) blogSlugCache.set(decodedSlug, res.data);
          if (clean) blogSlugCache.set(clean, res.data);
        }
      }).catch(() => {});
      return existing;
    }

    try {
      const res = await fetchApi(`/blogs/${encodeURIComponent(clean || rawSlug)}`);
      if (res?.data) {
        if (rawSlug) blogSlugCache.set(rawSlug, res.data);
        if (decodedSlug) blogSlugCache.set(decodedSlug, res.data);
        if (clean) blogSlugCache.set(clean, res.data);
        return res.data;
      }
    } catch (_) {}

    const defaultMatch = defaultBlogs.find(b => {
      if (rawSlug && (b.id === rawSlug || b.slug === rawSlug)) return true;
      if (decodedSlug && (b.id === decodedSlug || b.slug === decodedSlug)) return true;
      const bClean = cleanSlug(b.slug);
      if (clean && bClean && bClean === clean) return true;
      const bTitleClean = cleanSlug(b.title);
      if (clean && bTitleClean && bTitleClean === clean) return true;
      return false;
    });

    if (defaultMatch) {
      if (rawSlug) blogSlugCache.set(rawSlug, defaultMatch);
      if (decodedSlug) blogSlugCache.set(decodedSlug, defaultMatch);
      if (clean) blogSlugCache.set(clean, defaultMatch);
      return defaultMatch;
    }

    throw new Error('Article not found');
  },
  createBlog: async (data: Partial<BlogPost>): Promise<BlogPost> => {
    const res = await fetchApi('/blogs', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    // Invalidate caches
    memoryBlogsCache = null;
    try { sessionStorage.removeItem('jadmaa_blogs_cache'); } catch (_) {}
    return res.data;
  },
  updateBlog: async (id: string, data: Partial<BlogPost>): Promise<BlogPost> => {
    const res = await fetchApi(`/blogs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    // Invalidate caches
    memoryBlogsCache = null;
    blogSlugCache.clear();
    try { sessionStorage.removeItem('jadmaa_blogs_cache'); } catch (_) {}
    return res.data;
  },
  deleteBlog: async (id: string): Promise<void> => {
    await fetchApi(`/blogs/${id}`, {
      method: 'DELETE'
    });
    memoryBlogsCache = null;
    blogSlugCache.clear();
    try { sessionStorage.removeItem('jadmaa_blogs_cache'); } catch (_) {}
  }
};
