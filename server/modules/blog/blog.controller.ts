import { Request, Response } from 'express';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import os from 'os';
import sharp from 'sharp';
import { prisma } from '../../db.js';
import defaultBlogsData from '../../../src/data/jadmaa_blogs.js';
import { generateSeoSlug, getUniqueSlug, transliterateTamilToEnglish } from '../../utils/slugify.js';

let blogsCache: any = null;
let blogsCacheTime = 0;
const BLOGS_CACHE_TTL = 1000 * 60 * 5; // 5 minutes

const defaultBlogs: any[] = defaultBlogsData as unknown as any[];

function formatBlogResponse(b: any) {
  if (!b) return b;
  let topic = b.topic;
  let content = b.content || '';
  const match = content.match(/^<!--topic:(.*?)-->\s*/);
  if (match) {
    topic = topic || match[1];
  }

  let insideImageUrl: string | null = (b as any).insideImageUrl || null;
  const insideMatch = content.match(/<!--insideImage:(.*?)-->/);
  if (insideMatch) {
    insideImageUrl = insideMatch[1].trim();
  }

  // Graceful thumbnail fallback if empty
  let thumbnailUrl = b.thumbnailUrl || '';
  if (!thumbnailUrl || thumbnailUrl.trim() === '') {
    const matchedDefault = defaultBlogs.find((d: any) => d.slug === b.slug || d.id === b.id);
    if (matchedDefault?.thumbnailUrl) {
      thumbnailUrl = matchedDefault.thumbnailUrl;
    } else {
      thumbnailUrl = '/images/course-basic.jpg';
    }
  }

  return {
    ...b,
    topic: topic || b.topic,
    thumbnailUrl,
    insideImageUrl
  };
}

/**
 * High-performance on-demand image optimization and caching.
 * Transforms remote and local images to modern responsive WebP/AVIF formats,
 * resizes to exact device requirements, and caches them with 1-year immutable headers.
 */
export const getOptimizedImage = async (req: Request, res: Response) => {
  try {
    const rawUrl = (req.query.url as string || '').trim();
    if (!rawUrl) {
      return res.status(400).send('Missing image url');
    }

    const width = Math.min(1920, Math.max(80, parseInt(req.query.w as string, 10) || 600));
    const height = req.query.h ? Math.min(1920, Math.max(80, parseInt(req.query.h as string, 10))) : undefined;
    const format = (req.query.format as string || 'webp').toLowerCase();
    const quality = Math.min(100, Math.max(40, parseInt(req.query.q as string, 10) || 80));

    const targetFormat: 'webp' | 'avif' | 'jpeg' = format === 'avif' ? 'avif' : format === 'jpeg' || format === 'jpg' ? 'jpeg' : 'webp';

    // Use writable system temp directory on serverless (e.g. /tmp on Vercel/Linux)
    const cacheDir = path.join(os.tmpdir(), 'jadmaa_image_cache');
    try {
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }
    } catch {
      // Safe ignore if filesystem is read-only
    }

    const hash = crypto
      .createHash('sha256')
      .update(`${rawUrl}__w${width}__h${height || 'auto'}__f${targetFormat}__q${quality}`)
      .digest('hex')
      .slice(0, 32);

    const cachedFilePath = path.join(cacheDir, `${hash}.${targetFormat}`);

    try {
      if (fs.existsSync(cachedFilePath)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        res.setHeader('Content-Type', `image/${targetFormat}`);
        return res.sendFile(cachedFilePath);
      }
    } catch {
      // Fallback to on-demand processing if cache file check fails
    }

    let inputBuffer: Buffer;
    if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
      const response = await fetch(rawUrl, {
        headers: { 'User-Agent': 'JADMAA-ImageOptimizer/1.0' },
        signal: AbortSignal.timeout(8000)
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`);
      }
      inputBuffer = Buffer.from(await response.arrayBuffer());
    } else {
      const cleanPath = rawUrl.replace(/^\//, '');
      const localFilePath = path.join(process.cwd(), 'public', cleanPath);
      if (!fs.existsSync(localFilePath)) {
        throw new Error(`Local file not found: ${localFilePath}`);
      }
      inputBuffer = await fs.promises.readFile(localFilePath);
    }

    let pipeline = sharp(inputBuffer).resize(width, height, {
      fit: 'cover',
      withoutEnlargement: true
    });

    if (targetFormat === 'webp') {
      pipeline = pipeline.webp({ quality, effort: 4 });
    } else if (targetFormat === 'avif') {
      pipeline = pipeline.avif({ quality, effort: 4 });
    } else {
      pipeline = pipeline.jpeg({ quality, progressive: true });
    }

    const outputBuffer = await pipeline.toBuffer();

    try {
      fs.promises.writeFile(cachedFilePath, outputBuffer).catch(() => {});
    } catch {
      // Ignore cache write errors on ephemeral disk
    }

    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('Content-Type', `image/${targetFormat}`);
    return res.send(outputBuffer);
  } catch (err: any) {
    console.warn('[ImageOptimizer] Error optimizing image:', err?.message);
    const rawUrl = (req.query.url as string || '').trim();
    if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
      return res.redirect(302, rawUrl);
    }
    const cleanPath = rawUrl.replace(/^\//, '');
    const localFallback = path.join(process.cwd(), 'public', cleanPath);
    if (fs.existsSync(localFallback)) {
      return res.sendFile(localFallback);
    }
    return res.status(500).send('Image optimization failed');
  }
};

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
    let dbSuccess = false;
    try {
      blogs = await prisma.blogPost.findMany({
        where: isAdmin ? undefined : { published: true },
        orderBy: { createdAt: 'desc' },
        include: { author: { select: { name: true, avatarUrl: true } } }
      });
      dbSuccess = true;
    } catch (dbErr) {
      console.warn('Database error in getBlogs, using fallback:', dbErr);
    }

    // Database is the single source of truth.
    // If DB is reachable, return exactly what exists in DB (never re-add deleted posts).
    // Only if DB connection completely failed and threw an error do we use default fallback.
    const result = dbSuccess 
      ? blogs.map(formatBlogResponse) 
      : defaultBlogs.map(formatBlogResponse);

    if (!isAdmin) {
      blogsCache = result;
      blogsCacheTime = Date.now();
    }

    res.json({ success: true, data: result });
  } catch (error) {
    console.warn('getBlogs error:', error);
    res.json({ success: true, data: [] });
  }
};

function safeDecode(str: string): string {
  try {
    return decodeURIComponent(str || '');
  } catch {
    return str || '';
  }
}

export const cleanSlug = (s: string) => {
  return safeDecode(s)
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{M}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '');
};

export const getBlogBySlug = async (req: Request, res: Response) => {
  const rawParam = (req.params.slug as string || '').trim();
  const decoded = safeDecode(rawParam).trim();
  const transliterated = transliterateTamilToEnglish(decoded).toLowerCase().replace(/[\s_-]+/g, '-');
  const unicodeSlug = cleanSlug(rawParam);

  try {
    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600');
    let blog: any = null;

    const conditions: any[] = [];
    if (rawParam) {
      conditions.push({ slug: rawParam }, { id: rawParam });
    }
    if (decoded && decoded !== rawParam) {
      conditions.push({ slug: decoded }, { id: decoded });
    }
    if (transliterated && transliterated !== rawParam && transliterated !== decoded) {
      conditions.push({ slug: transliterated });
    }
    if (unicodeSlug && unicodeSlug !== rawParam && unicodeSlug !== decoded) {
      conditions.push({ slug: unicodeSlug });
    }

    // Specific backward-compatible mappings for legacy Tamil slugs
    if (decoded.includes('சிகிச்சை') || decoded.includes('sikissai') || rawParam.includes('%E0%AE%9A%E0%AE%BF%E0%AE%9A%E0%AF%8D%E0%AE%9A%E0%AF%88')) {
      conditions.push({ slug: 'varma-sikissai-enraal-enna-alikkappatum-muraikal' });
    }
    if (decoded.includes('யார்') || decoded.includes('ஆசான்') || decoded.includes('aasaan') || rawParam.includes('%E0%AE%AF%E0%AE%BE%E0%AE%B0%E0%AF%8D')) {
      conditions.push({ slug: 'yaar-varma-aasaan-yaar-varmaani-virivaana-vilakkam' });
    }

    let dbQueried = false;
    try {
      if (conditions.length > 0) {
        blog = await prisma.blogPost.findFirst({
          where: { OR: conditions },
          include: { author: { select: { name: true, avatarUrl: true } } }
        });
      }
      dbQueried = true;
    } catch (dbErr) {
      console.warn('Database error in getBlogBySlug:', dbErr);
    }

    if (!blog) {
      if (!dbQueried) {
        const matched = defaultBlogs.find((b: any) => 
          b.slug === rawParam ||
          b.slug === decoded ||
          (unicodeSlug && b.slug === unicodeSlug) ||
          b.id === rawParam ||
          b.id === decoded ||
          (b.title && b.title.toLowerCase().trim() === decoded.toLowerCase().trim())
        );
        if (matched) {
          return res.json({ success: true, data: formatBlogResponse(matched) });
        }
      }
      return res.status(404).json({ success: false, error: { message: 'Blog not found' } });
    }

    res.json({ success: true, data: formatBlogResponse(blog) });
  } catch (error) {
    console.warn('getBlogBySlug error:', error);
    const matched = defaultBlogs.find((b: any) => 
      b.slug === rawParam ||
      b.slug === decoded ||
      (unicodeSlug && b.slug === unicodeSlug) ||
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
    const { title, slug, content, excerpt, thumbnailUrl, published, topic, metaTitle, metaDesc, keywords } = req.body;
    
    const trimmedTitle = (title || 'Untitled Post').trim();
    const generatedSlug = generateSeoSlug(trimmedTitle, slug, { intentKeywords: ['varmakalai', 'traditional-healing'] });
    const cleanSlugVal = await getUniqueSlug(prisma.blogPost, generatedSlug);

    let finalContent = content || '';
    if (topic && topic.trim()) {
      finalContent = finalContent.replace(/^<!--topic:.*?-->\s*/, '');
      finalContent = `<!--topic:${topic.trim()}-->\n` + finalContent;
    }

    const blog = await prisma.blogPost.create({
      data: {
        title: trimmedTitle,
        slug: cleanSlugVal,
        content: finalContent,
        excerpt: excerpt || null,
        thumbnailUrl: thumbnailUrl || null,
        metaTitle: metaTitle || `${trimmedTitle} | JADMAA Varmakalai Blog`,
        metaDesc: metaDesc || excerpt || finalContent.replace(/<[^>]+>/g, '').slice(0, 160),
        keywords: keywords || 'varmakalai, varma therapy, traditional tamil healing',
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
    
    const unicodeSlug = cleanSlug(idOrSlug);
    const conditions: any[] = [];
    if (idOrSlug) conditions.push({ id: idOrSlug }, { slug: idOrSlug });
    if (decoded && decoded !== idOrSlug) conditions.push({ id: decoded }, { slug: decoded });
    if (unicodeSlug && unicodeSlug !== idOrSlug && unicodeSlug !== decoded) conditions.push({ slug: unicodeSlug });

    let existing = await prisma.blogPost.findFirst({
      where: { OR: conditions }
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
      let updatedSlug = existing.slug;
      if (slug && slug !== existing.slug) {
        const base = generateSeoSlug(title ?? existing.title, slug);
        updatedSlug = await getUniqueSlug(prisma.blogPost, base, existing.id);
      } else if (!slug && title && title !== existing.title) {
        // If title changed and slug wasn't explicitly customized, keep current slug or update
        // We preserve existing slug to prevent breaking links unless admin explicitly overrides
      }

      blog = await prisma.blogPost.update({
        where: { id: existing.id },
        data: {
          title: title ?? existing.title,
          slug: updatedSlug,
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

export const updateBlogThumbnail = async (req: Request, res: Response) => {
  try {
    const idOrSlug = req.params.id as string;
    const decoded = decodeURIComponent(idOrSlug).trim();
    const unicodeSlug = cleanSlug(idOrSlug);
    const { thumbnailUrl, insideOnly, resetCrop } = req.body;

    if (!resetCrop && (!thumbnailUrl || typeof thumbnailUrl !== 'string')) {
      return res.status(400).json({ success: false, error: { message: 'thumbnailUrl is required' } });
    }

    let finalThumbnailUrl = thumbnailUrl || '';

    // If it's a base64 data URL from client cropper, save permanently as WebP
    if (finalThumbnailUrl.startsWith('data:image/')) {
      const match = finalThumbnailUrl.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
      if (match) {
        const buffer = Buffer.from(match[2], 'base64');
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }
        const fileName = `blog_crop_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.webp`;
        const filePath = path.join(uploadsDir, fileName);

        await sharp(buffer)
          .webp({ quality: 90, effort: 4 })
          .toFile(filePath);

        finalThumbnailUrl = `/uploads/${fileName}`;
      }
    }

    // Find the blog post by id or slug
    const conditions: any[] = [];
    if (idOrSlug) conditions.push({ id: idOrSlug }, { slug: idOrSlug });
    if (decoded && decoded !== idOrSlug) conditions.push({ id: decoded }, { slug: decoded });
    if (unicodeSlug && unicodeSlug !== idOrSlug && unicodeSlug !== decoded) conditions.push({ slug: unicodeSlug });
    const hyphenated = idOrSlug.replace(/\s+/g, '-').toLowerCase();
    if (hyphenated !== idOrSlug) conditions.push({ slug: hyphenated });
    const decodedHyphenated = decoded.replace(/\s+/g, '-').toLowerCase();
    if (decodedHyphenated !== decoded) conditions.push({ slug: decodedHyphenated });

    let existing = await prisma.blogPost.findFirst({
      where: { OR: conditions }
    });

    if (!existing) {
      const allPosts = await prisma.blogPost.findMany();
      existing = allPosts.find((b: any) => 
        b.id === idOrSlug ||
        b.slug === idOrSlug ||
        b.slug === decoded ||
        b.slug === unicodeSlug ||
        b.slug === hyphenated ||
        cleanSlug(b.slug) === unicodeSlug ||
        cleanSlug(b.title) === unicodeSlug
      ) || null;
    }

    let updatedBlog;
    if (existing) {
      if (insideOnly) {
        // Crop affects ONLY the inside blog image, NOT the blog card thumbnail
        let newContent = (existing.content || '').replace(/<!--insideImage:.*?-->\s*/g, '');
        if (!resetCrop && finalThumbnailUrl) {
          newContent = `<!--insideImage:${finalThumbnailUrl}-->\n` + newContent;
        }
        updatedBlog = await prisma.blogPost.update({
          where: { id: existing.id },
          data: { content: newContent }
        });
      } else {
        updatedBlog = await prisma.blogPost.update({
          where: { id: existing.id },
          data: { thumbnailUrl: finalThumbnailUrl }
        });
      }
    } else {
      const defaultMatch = defaultBlogs.find((b: any) =>
        b.slug === idOrSlug || b.slug === decoded || b.id === idOrSlug
      );
      if (defaultMatch) {
        let initialContent = defaultMatch.content || '';
        if (insideOnly && finalThumbnailUrl && !resetCrop) {
          initialContent = `<!--insideImage:${finalThumbnailUrl}-->\n` + initialContent;
        }
        updatedBlog = await prisma.blogPost.create({
          data: {
            title: defaultMatch.title || 'Untitled Article',
            slug: defaultMatch.slug || idOrSlug,
            content: initialContent,
            excerpt: defaultMatch.excerpt || null,
            thumbnailUrl: insideOnly ? (defaultMatch.thumbnailUrl || '/images/course-basic.jpg') : finalThumbnailUrl,
            published: true,
          }
        });
      } else {
        return res.status(404).json({ success: false, error: { message: 'Blog post not found' } });
      }
    }

    blogsCache = null;
    blogsCacheTime = 0;

    return res.json({
      success: true,
      data: formatBlogResponse(updatedBlog),
      thumbnailUrl: finalThumbnailUrl,
    });
  } catch (error: any) {
    console.error('Error in updateBlogThumbnail:', error);
    return res.status(500).json({ success: false, error: { message: error.message || 'Error updating blog thumbnail' } });
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
