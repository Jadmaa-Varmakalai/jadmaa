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

import defaultBlogsData from '../../data/jadmaa_blogs.json';

let memoryBlogsCache: BlogPost[] | null = null;
const blogSlugCache = new Map<string, BlogPost>();

const defaultBlogs: BlogPost[] = defaultBlogsData as unknown as BlogPost[];

const normalizeSlug = (s: string) =>
  decodeURIComponent(s || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const mergeWithDefaults = (posts: BlogPost[]): BlogPost[] => {
  const map = new Map<string, BlogPost>();
  for (const def of defaultBlogs) {
    map.set(def.slug, def);
  }
  for (const p of posts) {
    if (p && p.slug) {
      map.set(p.slug, {
        ...(map.get(p.slug) || {}),
        ...p,
      });
    }
  }
  return Array.from(map.values());
};

export const blogApi = {
  getCachedBlogs: (): BlogPost[] => {
    if (memoryBlogsCache && memoryBlogsCache.length > 0) {
      return memoryBlogsCache;
    }
    try {
      const cached = sessionStorage.getItem('jadmaa_blogs_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const merged = mergeWithDefaults(parsed);
          memoryBlogsCache = merged;
          return merged;
        }
      }
    } catch (_) {}
    return defaultBlogs;
  },

  getBlogs: async (all?: boolean): Promise<BlogPost[]> => {
    try {
      const res = await fetchApi(all ? '/blogs?all=true' : '/blogs');
      if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
        const merged = mergeWithDefaults(res.data);
        if (!all) {
          memoryBlogsCache = merged;
          try {
            sessionStorage.setItem('jadmaa_blogs_cache', JSON.stringify(merged));
          } catch (_) {}
        }
        return merged;
      }
    } catch (_) {}

    return blogApi.getCachedBlogs();
  },

  getBlogBySlug: async (slug: string): Promise<BlogPost> => {
    const rawSlug = slug;
    const norm = normalizeSlug(slug);

    if (blogSlugCache.has(rawSlug)) {
      return blogSlugCache.get(rawSlug)!;
    }
    if (blogSlugCache.has(norm)) {
      return blogSlugCache.get(norm)!;
    }

    const cachedList = blogApi.getCachedBlogs();
    const existing = cachedList.find(
      b => b.slug === rawSlug ||
           b.id === rawSlug ||
           normalizeSlug(b.slug) === norm ||
           normalizeSlug(b.id) === norm ||
           normalizeSlug(b.title) === norm
    );

    if (existing && existing.content) {
      blogSlugCache.set(rawSlug, existing);
      blogSlugCache.set(norm, existing);
      fetchApi(`/blogs/${encodeURIComponent(slug)}`).then(res => {
        if (res?.data) {
          blogSlugCache.set(rawSlug, res.data);
          blogSlugCache.set(norm, res.data);
        }
      }).catch(() => {});
      return existing;
    }

    try {
      const res = await fetchApi(`/blogs/${encodeURIComponent(slug)}`);
      if (res?.data) {
        blogSlugCache.set(rawSlug, res.data);
        blogSlugCache.set(norm, res.data);
        return res.data;
      }
    } catch (_) {}

    const defaultMatch = defaultBlogs.find(
      b => b.slug === rawSlug ||
           b.id === rawSlug ||
           normalizeSlug(b.slug) === norm ||
           normalizeSlug(b.id) === norm ||
           normalizeSlug(b.title) === norm
    );

    if (defaultMatch) {
      blogSlugCache.set(rawSlug, defaultMatch);
      blogSlugCache.set(norm, defaultMatch);
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
