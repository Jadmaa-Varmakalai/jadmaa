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

interface CachedImageEntry {
  buffer: Buffer;
  contentType: string;
}
const memoryImageCache = new Map<string, CachedImageEntry>();
const MAX_MEMORY_CACHE_ITEMS = 100;

export function resolveLocalImagePath(rawUrl: string): string | null {
  if (!rawUrl) return null;
  let cleanUrl = rawUrl.split('?')[0].trim();
  // Strip protocol and hostname if URL points to jadmaa.com, server IP, or localhost
  cleanUrl = cleanUrl.replace(/^https?:\/\/(?:www\.)?(?:jadmaa\.com|jadmaavarmakalai\.com|129\.121\.147\.213(?::\d+)?|localhost(?::\d+)?|127\.0\.0\.1(?::\d+)?)/i, '');
  const cleanPath = cleanUrl.replace(/^\//, '');
  const candidates: string[] = [];

  if (cleanUrl.startsWith('/uploads/') || cleanUrl.startsWith('uploads/')) {
    const filename = cleanUrl.replace(/^\/?uploads\//, '');
    if (process.env.UPLOADS_DIR) candidates.push(path.join(process.env.UPLOADS_DIR, filename));
    candidates.push(path.join('/opt/jadmaa/uploads', filename));
    candidates.push(path.join(process.cwd(), 'public', 'uploads', filename));
    candidates.push(path.join(process.cwd(), 'uploads', filename));
  } else if (cleanUrl.startsWith('/images/') || cleanUrl.startsWith('images/')) {
    const filename = cleanUrl.replace(/^\/?images\//, '');
    candidates.push(path.join('/var/www/jadmaa/frontend/images', filename));
    candidates.push(path.join(process.cwd(), 'public', 'images', filename));
    candidates.push(path.join(process.cwd(), 'dist', 'images', filename));
  }

  candidates.push(path.join('/var/www/jadmaa/frontend', cleanPath));
  candidates.push(path.join(process.cwd(), 'public', cleanPath));
  candidates.push(path.join(process.cwd(), 'dist', cleanPath));
  candidates.push(path.join(process.cwd(), cleanPath));

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return null;
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
    const contentType = `image/${targetFormat}`;

    const hash = crypto
      .createHash('sha256')
      .update(`${rawUrl}__w${width}__h${height || 'auto'}__f${targetFormat}__q${quality}`)
      .digest('hex')
      .slice(0, 32);

    // 1. In-memory fast cache check (0ms response)
    const memCached = memoryImageCache.get(hash);
    if (memCached) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, s-maxage=31536000, immutable');
      res.setHeader('Content-Type', memCached.contentType);
      return res.send(memCached.buffer);
    }

    // 2. Disk cache check
    const cacheDir = path.join(os.tmpdir(), 'jadmaa_image_cache');
    try {
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }
    } catch {
      // Safe ignore if filesystem is read-only
    }

    const cachedFilePath = path.join(cacheDir, `${hash}.${targetFormat}`);

    try {
      if (fs.existsSync(cachedFilePath)) {
        const fileBuf = await fs.promises.readFile(cachedFilePath);
        if (memoryImageCache.size >= MAX_MEMORY_CACHE_ITEMS) {
          const firstKey = memoryImageCache.keys().next().value;
          if (firstKey) memoryImageCache.delete(firstKey);
        }
        memoryImageCache.set(hash, { buffer: fileBuf, contentType });

        res.setHeader('Cache-Control', 'public, max-age=31536000, s-maxage=31536000, immutable');
        res.setHeader('Content-Type', contentType);
        return res.send(fileBuf);
      }
    } catch {
      // Fallback to on-demand processing if cache file check fails
    }

    let inputBuffer: Buffer;
    let resolvedLocalPath: string | null = null;
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
      resolvedLocalPath = resolveLocalImagePath(rawUrl);
      if (!resolvedLocalPath) {
        throw new Error(`Local file not found for path: ${rawUrl}`);
      }
      inputBuffer = await fs.promises.readFile(resolvedLocalPath);
    }

    let pipeline = sharp(inputBuffer).resize(width, height, {
      fit: 'cover',
      withoutEnlargement: true
    });

    if (targetFormat === 'webp') {
      pipeline = pipeline.webp({ quality, effort: 3 });
    } else if (targetFormat === 'avif') {
      pipeline = pipeline.avif({ quality, effort: 3 });
    } else {
      pipeline = pipeline.jpeg({ quality, progressive: true });
    }

    const outputBuffer = await pipeline.toBuffer();

    // Cache to disk asynchronously
    try {
      fs.promises.writeFile(cachedFilePath, outputBuffer).catch(() => {});
    } catch {
      // Ignore cache write errors on ephemeral disk
    }

    // Cache to memory
    if (memoryImageCache.size >= MAX_MEMORY_CACHE_ITEMS) {
      const firstKey = memoryImageCache.keys().next().value;
      if (firstKey) memoryImageCache.delete(firstKey);
    }
    memoryImageCache.set(hash, { buffer: outputBuffer, contentType });

    res.setHeader('Cache-Control', 'public, max-age=31536000, s-maxage=31536000, immutable');
    res.setHeader('Content-Type', contentType);
    return res.send(outputBuffer);
  } catch (err: any) {
    console.warn('[ImageOptimizer] Error optimizing image:', err?.message);
    const rawUrl = (req.query.url as string || '').trim();
    if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
      return res.redirect(302, rawUrl);
    }
    const resolvedFallback = resolveLocalImagePath(rawUrl);
    if (resolvedFallback) {
      return res.sendFile(resolvedFallback);
    }
    if (rawUrl.startsWith('/')) {
      return res.redirect(302, rawUrl);
    }
    return res.status(404).send('Image not found');
  }
};

let cachedTamilFontBase64: string | null = null;
function getEmbeddedTamilFontBase64(): string {
  if (cachedTamilFontBase64 !== null) return cachedTamilFontBase64;
  const candidates = [
    path.join(process.cwd(), 'public', 'fonts', 'NotoSansTamil-Bold.ttf'),
    path.join('/opt/jadmaa/backend', 'public', 'fonts', 'NotoSansTamil-Bold.ttf'),
    path.join('/var/www/jadmaa/frontend', 'fonts', 'NotoSansTamil-Bold.ttf'),
    path.join(__dirname, '..', '..', '..', 'public', 'fonts', 'NotoSansTamil-Bold.ttf'),
    path.resolve(process.cwd(), '..', 'public', 'fonts', 'NotoSansTamil-Bold.ttf')
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      try {
        cachedTamilFontBase64 = fs.readFileSync(p).toString('base64');
        return cachedTamilFontBase64;
      } catch (e) {
        console.warn('Failed reading Tamil font from', p, e);
      }
    }
  }
  cachedTamilFontBase64 = '';
  return cachedTamilFontBase64;
}

function wrapBlogTitle(text: string, maxCharsPerLine = 20, maxLines = 3): string[] {
  const words = (text || '').trim().split(/\s+/);
  if (!words.length || !words[0]) return ['JADMAA Blog'];
  const lines: string[] = [];
  let currentLine = '';

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    if (lines.length === maxLines - 1) {
      // Last allowed line, join all remaining words
      const rest = words.slice(i).join(' ');
      currentLine = currentLine ? `${currentLine} ${rest}` : rest;
      break;
    }
    if (!currentLine) {
      currentLine = word;
    } else if ((currentLine + ' ' + word).length <= maxCharsPerLine) {
      currentLine += ' ' + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine && lines.length < maxLines) {
    lines.push(currentLine);
  }
  return lines;
}

/**
 * Dynamic OpenGraph / Social Link Preview Image for Blogs.
 * Composes a landscape 1.91:1 (1200x630) image matching WhatsApp's large banner card:
 * - Left 50% (600x630): Full-bleed grayscale/monochrome blog cover photo.
 * - Right 50% (600x630): Crisp white panel (#FFFFFF) with 1px vertical divider (#E8DDD0):
 *     - Top half: Centered Tamil/English blog title in bold dark charcoal (#2B2825).
 *     - Bottom half: Centered JADMAA emblem logo, bold brand wordmark (JADMAA VARMAKALAI),
 *       and tagline (ANCIENT POWER. MODERN TRAINING.).
 */
export const getBlogOgImage = async (req: Request, res: Response) => {
  try {
    const rawParam = (req.params.slug || '').trim();
    if (!rawParam) {
      return res.status(400).send('Missing blog slug');
    }

    const isPng = rawParam.toLowerCase().endsWith('.png');
    const rawSlug = rawParam.replace(/\.(png|jpe?g|webp)$/i, '');
    const decodedSlug = decodeURIComponent(rawSlug).trim();
    const transliterated = transliterateTamilToEnglish(decodedSlug).toLowerCase().replace(/[\s_-]+/g, '-');

    let blog = await prisma.blogPost.findFirst({
      where: {
        OR: [
          { slug: rawSlug },
          { slug: decodedSlug },
          { slug: transliterated },
          { id: rawSlug },
          ...(decodedSlug.includes('வர்ம-சிகிச்சை') || rawSlug.includes('%E0%AE%B5%E0%AE%B0%E0%AF%8D%E0%AE%AE')
            ? [{ slug: 'varma-sikissai-enraal-enna-alikkappatum-muraikal' }]
            : []),
          ...(decodedSlug.includes('யார்-வர்ம') || rawSlug.includes('%E0%AE%AF%E0%AE%BE%E0%AE%B0%E0%AF%8D')
            ? [{ slug: 'yaar-varma-aasaan-yaar-varmaani-virivaana-vilakkam' }]
            : [])
        ]
      },
      select: {
        id: true,
        title: true,
        thumbnailUrl: true,
        createdAt: true,
        updatedAt: true,
        author: { select: { name: true } }
      }
    });

    if (!blog) {
      const defaultMatch = defaultBlogs.find((d: any) =>
        d.slug === rawSlug ||
        d.slug === decodedSlug ||
        d.slug === transliterated ||
        d.id === rawSlug
      );
      if (defaultMatch) {
        blog = {
          id: defaultMatch.id,
          title: defaultMatch.title,
          thumbnailUrl: defaultMatch.thumbnailUrl,
          createdAt: new Date('2026-10-20'),
          updatedAt: new Date(),
          author: { name: 'Varma Aasan Mr. Bojagarajan' }
        } as any;
      }
    }

    if (!blog) {
      return res.status(404).send('Blog not found');
    }

    const outputFormat = isPng ? 'png' : 'jpeg';
    const contentType = isPng ? 'image/png' : 'image/jpeg';
    const cacheKey = `og_blog_v4_${blog.id}_${outputFormat}`;
    const memCached = memoryImageCache.get(cacheKey);
    if (memCached) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, s-maxage=31536000, immutable');
      res.setHeader('Content-Type', contentType);
      return res.send(memCached.buffer);
    }

    // High-resolution 1200 x 800 dimensions (ideal wide banner ratio for WhatsApp Channels & Mobile Previews)
    const width = 1200;
    const height = 800;
    const leftWidth = 600;
    const rightWidth = 600;

    // 1. Process thumbnail on left side: full-bleed grayscale monochrome cover photo
    let thumbBuf: Buffer;
    const rawThumb = (blog.thumbnailUrl || '').trim();
    const localThumbPath = resolveLocalImagePath(rawThumb);

    if (localThumbPath && fs.existsSync(localThumbPath)) {
      thumbBuf = await sharp(localThumbPath)
        .grayscale()
        .resize(leftWidth, height, { fit: 'cover' })
        .toBuffer();
    } else if (rawThumb.startsWith('http://') || rawThumb.startsWith('https://')) {
      const isPrivateOrLocal = /^(https?:\/\/)?(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.|::1)/i.test(rawThumb);
      if (!isPrivateOrLocal) {
        try {
          const resp = await fetch(rawThumb, {
            headers: { 'User-Agent': 'JADMAA-OGImage-Bot/1.0' },
            signal: AbortSignal.timeout(6000)
          });
          if (resp.ok) {
            const arr = await resp.arrayBuffer();
            thumbBuf = await sharp(Buffer.from(arr))
              .grayscale()
              .resize(leftWidth, height, { fit: 'cover' })
              .toBuffer();
          } else {
            throw new Error('Remote thumb failed');
          }
        } catch {
          const fallback = resolveLocalImagePath('/images/course-basic.jpg') || path.join(process.cwd(), 'public', 'images', 'course-basic.jpg');
          thumbBuf = await sharp(fallback)
            .grayscale()
            .resize(leftWidth, height, { fit: 'cover' })
            .toBuffer();
        }
      } else {
        const fallback = resolveLocalImagePath('/images/course-basic.jpg') || path.join(process.cwd(), 'public', 'images', 'course-basic.jpg');
        thumbBuf = await sharp(fallback)
          .grayscale()
          .resize(leftWidth, height, { fit: 'cover' })
          .toBuffer();
      }
    } else {
      const fallback = resolveLocalImagePath('/images/course-basic.jpg') || path.join(process.cwd(), 'public', 'images', 'course-basic.jpg');
      thumbBuf = await sharp(fallback)
        .grayscale()
        .resize(leftWidth, height, { fit: 'cover' })
        .toBuffer();
    }

    // 2. Load JADMAA logo
    let logoBuf: Buffer | null = null;
    const logoSize = 130;
    const logoCandidates = [
      path.join(process.cwd(), 'public', 'logo.png'),
      path.join(process.cwd(), 'public', 'images', 'logo-1.png'),
      '/var/www/jadmaa/frontend/logo.png',
      '/var/www/jadmaa/frontend/images/logo-1.png',
      resolveLocalImagePath('/images/logo-1.png') || ''
    ];
    for (const lp of logoCandidates) {
      if (lp && fs.existsSync(lp)) {
        try {
          logoBuf = await sharp(lp)
            .resize(logoSize, logoSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
            .toBuffer();
          break;
        } catch {}
      }
    }

    // 3. Prepare Right Panel Typography
    const rawTitle = (blog.title || '').trim();
    const lines = wrapBlogTitle(rawTitle, 22, 4);
    const fontSize = lines.length <= 2 ? 38 : 32;
    const lineHeight = Math.round(fontSize * 1.45);
    const totalTextHeight = lines.length * lineHeight;
    const startY = Math.round(210 - totalTextHeight / 2 + fontSize * 0.85);

    const tspanLines = lines.map((line, idx) => {
      const escaped = line.replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '\'': '&apos;', '"': '&quot;' }[c] || c));
      return `<tspan x="300" y="${startY + idx * lineHeight}">${escaped}</tspan>`;
    }).join('\n');

    const fontBase64 = getEmbeddedTamilFontBase64();
    const fontFaceCss = fontBase64 ? `
      @font-face {
        font-family: 'Noto Sans Tamil Embedded';
        src: url('data:font/truetype;charset=utf-8;base64,${fontBase64}') format('truetype');
        font-weight: bold;
        font-style: normal;
      }
    ` : '';

    const rightSvg = Buffer.from(`
      <svg width="${rightWidth}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <style>
            ${fontFaceCss}
            .title-text {
              font-family: 'Noto Sans Tamil Embedded', 'Noto Sans Tamil', 'Lohit Tamil', sans-serif;
              font-size: ${fontSize}px;
              font-weight: bold;
              fill: #2B2825;
              text-anchor: middle;
            }
            .brand-jadmaa {
              font-family: 'Noto Sans Tamil Embedded', 'Noto Sans Tamil', sans-serif;
              font-size: 24px;
              font-weight: 800;
              letter-spacing: 3.5px;
              fill: #2B2825;
            }
            .brand-varmakalai {
              font-family: 'Noto Sans Tamil Embedded', 'Noto Sans Tamil', sans-serif;
              font-size: 24px;
              font-weight: 800;
              letter-spacing: 3.5px;
              fill: #B12B2B;
            }
            .tagline {
              font-family: 'Noto Sans Tamil Embedded', 'Noto Sans Tamil', sans-serif;
              font-size: 12px;
              font-weight: 600;
              letter-spacing: 2px;
              fill: #5C5148;
              text-anchor: middle;
            }
          </style>
        </defs>
        <rect width="${rightWidth}" height="${height}" fill="#FFFFFF" />
        <line x1="0" y1="0" x2="0" y2="${height}" stroke="#E8DDD0" stroke-width="1.5" />

        <!-- Top Half: Centered Blog Title -->
        <text class="title-text">
          ${tspanLines}
        </text>

        <!-- Bottom Half: Branding below logo (logo is at y=480, height=130 -> bottom 610) -->
        <text x="300" y="650" text-anchor="middle">
          <tspan class="brand-jadmaa">JADMAA </tspan><tspan dx="8" class="brand-varmakalai">VARMAKALAI</tspan>
        </text>
        <text x="300" y="685" class="tagline">ANCIENT POWER. MODERN TRAINING.</text>
      </svg>
    `);

    const composites: sharp.OverlayOptions[] = [
      { input: thumbBuf, top: 0, left: 0 },
      { input: rightSvg, top: 0, left: leftWidth }
    ];

    if (logoBuf) {
      composites.push({
        input: logoBuf,
        top: 480,
        left: leftWidth + Math.round((rightWidth - logoSize) / 2)
      });
    }

    let outputBuf: Buffer;
    if (isPng) {
      outputBuf = await sharp({
        create: {
          width,
          height,
          channels: 4,
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        }
      })
        .composite(composites)
        .png({ quality: 85, palette: true, compressionLevel: 9 })
        .toBuffer();
    } else {
      outputBuf = await sharp({
        create: {
          width,
          height,
          channels: 3,
          background: { r: 255, g: 255, b: 255 }
        }
      })
        .composite(composites)
        .jpeg({ quality: 85, mozjpeg: true })
        .toBuffer();
    }

    memoryImageCache.set(cacheKey, { buffer: outputBuf, contentType });
    res.setHeader('Cache-Control', 'public, max-age=31536000, s-maxage=31536000, immutable');
    res.setHeader('Content-Type', contentType);
    return res.send(outputBuf);
  } catch (err: any) {
    console.error('getBlogOgImage error:', err);
    res.status(500).send('Error generating OG image');
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
    const generatedSlug = generateSeoSlug(trimmedTitle, slug);
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
        metaTitle: metaTitle?.trim() || `${trimmedTitle} | JADMAA Blog`,
        metaDesc: metaDesc?.trim() || excerpt || finalContent.replace(/<[^>]+>/g, '').slice(0, 160),
        keywords: keywords?.trim() || 'martial arts, wellness, traditional healing',
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
    const { title, slug, content, excerpt, thumbnailUrl, published, topic, metaTitle, metaDesc, keywords } = req.body;
    
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
          metaTitle: metaTitle !== undefined ? (metaTitle ? metaTitle.trim() : null) : existing.metaTitle,
          metaDesc: metaDesc !== undefined ? (metaDesc ? metaDesc.trim() : null) : existing.metaDesc,
          keywords: keywords !== undefined ? (keywords ? keywords.trim() : null) : existing.keywords,
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
          metaTitle: metaTitle !== undefined ? metaTitle : (defaultMatch?.metaTitle || `${title || 'Article'} | JADMAA Blog`),
          metaDesc: metaDesc !== undefined ? metaDesc : (defaultMatch?.metaDesc || null),
          keywords: keywords !== undefined ? keywords : (defaultMatch?.keywords || null),
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

        const authorId = (req as any).user?.userId || (req as any).user?.id;
        let effectiveAuthorId = authorId;
        if (!effectiveAuthorId) {
          const adminUser = await prisma.user.findFirst({
            where: { OR: [{ role: 'SUPER_ADMIN' }, { role: 'ADMIN' }] },
            select: { id: true }
          });
          effectiveAuthorId = adminUser?.id;
        }
        if (!effectiveAuthorId) {
          const anyUser = await prisma.user.findFirst({ select: { id: true } });
          effectiveAuthorId = anyUser?.id;
        }

        updatedBlog = await prisma.blogPost.create({
          data: {
            title: defaultMatch.title || 'Untitled Article',
            slug: defaultMatch.slug || idOrSlug,
            content: initialContent,
            excerpt: defaultMatch.excerpt || null,
            thumbnailUrl: insideOnly ? (defaultMatch.thumbnailUrl || '/images/course-basic.jpg') : finalThumbnailUrl,
            published: true,
            authorId: effectiveAuthorId || 'admin-system',
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
