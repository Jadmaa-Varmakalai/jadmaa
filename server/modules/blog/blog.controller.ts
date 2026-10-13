import { Request, Response } from 'express';
import { prisma } from '../../db.js';
import defaultBlogsData from '../../../src/data/jadmaa_blogs.json' with { type: 'json' };

let blogsCache: any = null;
let blogsCacheTime = 0;
const BLOGS_CACHE_TTL = 1000 * 60 * 5; // 5 minutes

const defaultBlogs: any[] = defaultBlogsData as any[];

function formatBlogResponse(b: any) {
  if (!b) return b;
  let topic = b.topic;
  let content = b.content || '';
  const match = content.match(/^<!--topic:(.*?)-->\s*/);
  if (match) {
    topic = topic || match[1];
  }
  return {
    ...b,
    topic: topic || b.topic
  };
}

export const getBlogs = async (req: Request, res: Response) => {
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

    // Merge database blogs with default blogs so pre-seeded articles always appear
    const dbSlugs = new Set(blogs.map(b => b.slug.toLowerCase().trim()));
    const merged = [...blogs.map(formatBlogResponse)];
    for (const def of defaultBlogs) {
      if (!dbSlugs.has(def.slug.toLowerCase().trim())) {
        merged.push(def);
      }
    }

    if (!isAdmin) {
      blogsCache = merged;
      blogsCacheTime = Date.now();
    }

    res.json({ success: true, data: merged });
  } catch (error) {
    console.warn('getBlogs error:', error);
    res.json({ success: true, data: defaultBlogs });
  }
};

export const getBlogBySlug = async (req: Request, res: Response) => {
  const rawParam = req.params.slug as string;
  const decoded = decodeURIComponent(rawParam).trim();
  const normalized = decoded.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  try {
    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600');
    let blog: any = null;

    try {
      blog = await prisma.blogPost.findFirst({
        where: {
          OR: [
            { slug: rawParam },
            { slug: decoded },
            { slug: normalized },
            { id: rawParam },
            { id: decoded }
          ]
        },
        include: { author: { select: { name: true, avatarUrl: true } } }
      });
    } catch (dbErr) {
      console.warn('Database error in getBlogBySlug:', dbErr);
    }

    if (!blog) {
      const matched = defaultBlogs.find((b: any) => 
        b.slug === rawParam ||
        b.slug === decoded ||
        b.slug === normalized ||
        b.id === rawParam ||
        b.id === decoded ||
        (b.title && b.title.toLowerCase().trim() === decoded.toLowerCase().trim())
      );
      if (matched) {
        return res.json({ success: true, data: matched });
      }
      return res.status(404).json({ success: false, error: { message: 'Blog not found' } });
    }

    res.json({ success: true, data: formatBlogResponse(blog) });
  } catch (error) {
    console.warn('getBlogBySlug error:', error);
    const matched = defaultBlogs.find((b: any) => 
      b.slug === rawParam ||
      b.slug === decoded ||
      b.slug === normalized ||
      b.id === rawParam
    );
    if (matched) {
      return res.json({ success: true, data: matched });
    }
    res.status(500).json({ success: false, error: { message: 'Server error fetching blog' } });
  }
};

export const createBlog = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId || (req as any).user?.id;
    const { title, slug, content, excerpt, thumbnailUrl, published, topic } = req.body;
    
    const cleanSlug = (slug || title?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `post-${Date.now()}`).trim();

    let finalContent = content || '';
    if (topic && topic.trim()) {
      finalContent = finalContent.replace(/^<!--topic:.*?-->\s*/, '');
      finalContent = `<!--topic:${topic.trim()}-->\n` + finalContent;
    }

    const blog = await prisma.blogPost.create({
      data: {
        title: title || 'Untitled Post',
        slug: cleanSlug,
        content: finalContent,
        excerpt: excerpt || null,
        thumbnailUrl: thumbnailUrl || null,
        published: published ?? true,
        authorId: userId
      }
    });

    blogsCache = null;
    blogsCacheTime = 0;
    res.status(201).json({ success: true, data: formatBlogResponse({ ...blog, topic }) });
  } catch (error: any) {
    res.status(400).json({ success: false, error: { message: error.message || 'Error creating blog' } });
  }
};

export const updateBlog = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId || (req as any).user?.id;
    const idOrSlug = req.params.id as string;
    const decoded = decodeURIComponent(idOrSlug).trim();
    const normalized = decoded.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const { title, slug, content, excerpt, thumbnailUrl, published, topic } = req.body;
    
    let existing = await prisma.blogPost.findFirst({
      where: {
        OR: [
          { id: idOrSlug },
          { id: decoded },
          { slug: idOrSlug },
          { slug: decoded },
          { slug: normalized }
        ]
      }
    });

    let finalContent = content !== undefined ? content : (existing?.content || '');
    if (topic !== undefined) {
      finalContent = finalContent.replace(/^<!--topic:.*?-->\s*/, '');
      if (topic && topic.trim()) {
        finalContent = `<!--topic:${topic.trim()}-->\n` + finalContent;
      }
    }

    let blog;
    if (existing) {
      blog = await prisma.blogPost.update({
        where: { id: existing.id },
        data: {
          title: title ?? existing.title,
          slug: slug ?? existing.slug,
          content: finalContent,
          excerpt: excerpt !== undefined ? excerpt : existing.excerpt,
          thumbnailUrl: thumbnailUrl !== undefined ? thumbnailUrl : existing.thumbnailUrl,
          published: published !== undefined ? published : existing.published
        }
      });
    } else {
      const defaultMatch = defaultBlogs.find((b: any) => 
        b.slug === idOrSlug || b.slug === decoded || b.slug === normalized || b.id === idOrSlug
      );

      blog = await prisma.blogPost.create({
        data: {
          title: title || defaultMatch?.title || 'Untitled Article',
          slug: slug || defaultMatch?.slug || normalized,
          content: finalContent || defaultMatch?.content || '',
          excerpt: excerpt !== undefined ? excerpt : (defaultMatch?.excerpt || null),
          thumbnailUrl: thumbnailUrl !== undefined ? thumbnailUrl : (defaultMatch?.thumbnailUrl || null),
          published: published !== undefined ? published : true,
          authorId: userId
        }
      });
    }

    blogsCache = null;
    blogsCacheTime = 0;
    res.json({ success: true, data: formatBlogResponse({ ...blog, topic }) });
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
