import { Request, Response } from 'express';
import { prisma } from '../../db.js';
import fs from 'fs';
import path from 'path';

let blogsCache: any = null;
let blogsCacheTime = 0;
const BLOGS_CACHE_TTL = 1000 * 60 * 5; // 5 minutes

// Safely load default blogs from json for fallback
const getDefaultBlogs = (): any[] => {
  try {
    const jsonPath = path.join(process.cwd(), 'src', 'data', 'jadmaa_blogs.json');
    if (fs.existsSync(jsonPath)) {
      const data = fs.readFileSync(jsonPath, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.warn('Could not read jadmaa_blogs.json:', err);
  }
  return [];
};

export const getBlogs = async (req: Request, res: Response) => {
  const defaultBlogs = getDefaultBlogs();
  try {
    const isAdmin = req.query.all === 'true';

    if (!isAdmin) {
      res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600');
      if (blogsCache && Date.now() - blogsCacheTime < BLOGS_CACHE_TTL) {
        return res.json({ success: true, data: blogsCache });
      }
    }

    let blogs: any[] = [];
    try {
      blogs = await prisma.blogPost.findMany({
        where: isAdmin ? undefined : { published: true },
        orderBy: { createdAt: 'desc' },
        include: { author: { select: { name: true, avatarUrl: true } } }
      });
    } catch (dbErr) {
      console.warn('Database error in getBlogs, using fallback:', dbErr);
    }

    if (!blogs || blogs.length === 0) {
      blogs = defaultBlogs;
    }

    if (!isAdmin) {
      blogsCache = blogs;
      blogsCacheTime = Date.now();
    }

    res.json({ success: true, data: blogs });
  } catch (error) {
    console.warn('getBlogs error:', error);
    if (blogsCache && req.query.all !== 'true') {
      return res.json({ success: true, data: blogsCache });
    }
    const fallback = defaultBlogs.length > 0 ? defaultBlogs : [];
    res.json({ success: true, data: fallback });
  }
};

export const getBlogBySlug = async (req: Request, res: Response) => {
  const slugParam = req.params.slug as string;
  const defaultBlogs = getDefaultBlogs();
  try {
    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600');
    let blog: any = null;

    try {
      blog = await prisma.blogPost.findFirst({
        where: {
          OR: [
            { slug: slugParam },
            { id: slugParam }
          ]
        },
        include: { author: { select: { name: true, avatarUrl: true } } }
      });
    } catch (dbErr) {
      console.warn('Database error in getBlogBySlug, checking default blogs:', dbErr);
    }

    if (!blog) {
      const matched = defaultBlogs.find((b: any) => b.slug === slugParam || b.id === slugParam);
      if (matched) {
        return res.json({ success: true, data: matched });
      }
      return res.status(404).json({ success: false, error: { message: 'Blog not found' } });
    }

    res.json({ success: true, data: blog });
  } catch (error) {
    console.warn('getBlogBySlug error:', error);
    const matched = defaultBlogs.find((b: any) => b.slug === slugParam || b.id === slugParam);
    if (matched) {
      return res.json({ success: true, data: matched });
    }
    res.status(500).json({ success: false, error: { message: 'Server error fetching blog' } });
  }
};

export const createBlog = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId || (req as any).user?.id;
    const { title, slug, content, excerpt, thumbnailUrl, published } = req.body;
    
    const blog = await prisma.blogPost.create({
      data: {
        title,
        slug: slug || title?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        content,
        excerpt,
        thumbnailUrl,
        published: published ?? false,
        authorId: userId
      }
    });

    blogsCache = null;
    blogsCacheTime = 0;
    res.status(201).json({ success: true, data: blog });
  } catch (error: any) {
    res.status(400).json({ success: false, error: { message: error.message || 'Error creating blog' } });
  }
};

export const updateBlog = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId || (req as any).user?.id;
    const idOrSlug = req.params.id as string;
    const { title, slug, content, excerpt, thumbnailUrl, published } = req.body;
    
    // Check if existing post exists by id or slug
    let existing = await prisma.blogPost.findFirst({
      where: {
        OR: [
          { id: idOrSlug },
          { slug: idOrSlug }
        ]
      }
    });

    let blog;
    if (existing) {
      blog = await prisma.blogPost.update({
        where: { id: existing.id },
        data: {
          title,
          slug,
          content,
          excerpt,
          thumbnailUrl,
          published
        }
      });
    } else {
      // Upsert / create in DB if this post was loaded from default JSON
      blog = await prisma.blogPost.create({
        data: {
          title: title || 'Untitled Article',
          slug: slug || idOrSlug,
          content: content || '',
          excerpt: excerpt || '',
          thumbnailUrl: thumbnailUrl || null,
          published: published ?? true,
          authorId: userId
        }
      });
    }

    blogsCache = null;
    blogsCacheTime = 0;
    res.json({ success: true, data: blog });
  } catch (error: any) {
    res.status(400).json({ success: false, error: { message: error.message || 'Error updating blog' } });
  }
};

export const deleteBlog = async (req: Request, res: Response) => {
  try {
    const idOrSlug = req.params.id as string;
    const existing = await prisma.blogPost.findFirst({
      where: {
        OR: [
          { id: idOrSlug },
          { slug: idOrSlug }
        ]
      }
    });

    if (existing) {
      await prisma.blogPost.delete({
        where: { id: existing.id }
      });
    }

    blogsCache = null;
    blogsCacheTime = 0;
    res.json({ success: true, data: null });
  } catch (error: any) {
    res.status(400).json({ success: false, error: { message: error.message || 'Error deleting blog' } });
  }
};
