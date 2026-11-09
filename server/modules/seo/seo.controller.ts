import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../db.js';
import { transliterateTamilToEnglish } from '../../utils/slugify.js';
import fs from 'fs';
import path from 'path';

const BASE_URL = process.env.FRONTEND_URL || 'https://jadmaa.com';

const BOT_USER_AGENTS = /googlebot|bingbot|yandex|baiduspider|twitterbot|facebookexternalhit|facebot|rogerbot|linkedinbot|embedly|quora link preview|quora|showyoubot|outbrain|pinterest|slackbot|vkshare|w3c_validator|whatsapp|telegrambot|duckduckbot|discordbot|applebot/i;

function safeDecode(str: string): string {
  try {
    return decodeURIComponent(str || '');
  } catch {
    return str || '';
  }
}

/**
 * Escapes XML/HTML special characters for valid tag attributes
 */
function escapeXml(unsafe: string): string {
  return (unsafe || '').replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

/**
 * Ensures an image URL is fully qualified with domain (required by WhatsApp/Facebook)
 */
function getAbsoluteImageUrl(imgUrl?: string | null): string {
  if (!imgUrl || !imgUrl.trim()) {
    return `${BASE_URL}/images/blog/varmakalai-history-origins-cover.jpg`;
  }
  const trimmed = imgUrl.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  const clean = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${BASE_URL}${clean}`;
}

/**
 * Determines OpenGraph image mime type
 */
function getImageMimeType(url: string): string {
  if (/\.png($|\?)/i.test(url)) return 'image/png';
  if (/\.webp($|\?)/i.test(url)) return 'image/webp';
  if (/\.gif($|\?)/i.test(url)) return 'image/gif';
  return 'image/jpeg';
}

/**
 * Generates dynamic sitemap.xml with all published courses, blogs, products, offers, and static routes
 */
export const getSitemapXml = async (_req: Request, res: Response) => {
  try {
    const [courses, blogs, products, offers] = await Promise.all([
      prisma.course.findMany({
        where: { status: 'PUBLISHED' },
        select: { slug: true, updatedAt: true },
        orderBy: { updatedAt: 'desc' }
      }),
      prisma.blogPost.findMany({
        where: { published: true },
        select: { slug: true, updatedAt: true },
        orderBy: { updatedAt: 'desc' }
      }),
      prisma.product.findMany({
        where: { isActive: true },
        select: { slug: true, updatedAt: true },
        orderBy: { updatedAt: 'desc' }
      }),
      prisma.courseOffer.findMany({
        where: { status: 'PUBLISHED', isEnabled: true },
        select: { slug: true, updatedAt: true },
        orderBy: { updatedAt: 'desc' }
      })
    ]);

    const staticRoutes = [
      { url: '/', changefreq: 'daily', priority: '1.0' },
      { url: '/courses', changefreq: 'daily', priority: '0.9' },
      { url: '/blog', changefreq: 'daily', priority: '0.8' },
      { url: '/shop', changefreq: 'daily', priority: '0.8' },
      { url: '/about', changefreq: 'weekly', priority: '0.7' },
      { url: '/contact', changefreq: 'weekly', priority: '0.7' },
      { url: '/privacy-policy', changefreq: 'monthly', priority: '0.3' },
      { url: '/terms-and-conditions', changefreq: 'monthly', priority: '0.3' },
      { url: '/refund-policy', changefreq: 'monthly', priority: '0.3' }
    ];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n`;
    xml += `        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n`;

    // Static pages
    const today = new Date().toISOString().split('T')[0];
    for (const route of staticRoutes) {
      xml += `  <url>\n`;
      xml += `    <loc>${escapeXml(`${BASE_URL}${route.url}`)}</loc>\n`;
      xml += `    <lastmod>${today}</lastmod>\n`;
      xml += `    <changefreq>${route.changefreq}</changefreq>\n`;
      xml += `    <priority>${route.priority}</priority>\n`;
      xml += `  </url>\n`;
    }

    // Courses
    for (const course of courses) {
      const lastmod = (course.updatedAt || new Date()).toISOString().split('T')[0];
      xml += `  <url>\n`;
      xml += `    <loc>${escapeXml(`${BASE_URL}/courses/${course.slug}`)}</loc>\n`;
      xml += `    <lastmod>${lastmod}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.9</priority>\n`;
      xml += `  </url>\n`;
    }

    // Blogs
    for (const blog of blogs) {
      const lastmod = (blog.updatedAt || new Date()).toISOString().split('T')[0];
      xml += `  <url>\n`;
      xml += `    <loc>${escapeXml(`${BASE_URL}/blog/${encodeURIComponent(blog.slug)}`)}</loc>\n`;
      xml += `    <lastmod>${lastmod}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.8</priority>\n`;
      xml += `  </url>\n`;
    }

    // Products
    for (const prod of products) {
      const lastmod = (prod.updatedAt || new Date()).toISOString().split('T')[0];
      xml += `  <url>\n`;
      xml += `    <loc>${escapeXml(`${BASE_URL}/shop/product/${prod.slug}`)}</loc>\n`;
      xml += `    <lastmod>${lastmod}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.8</priority>\n`;
      xml += `  </url>\n`;
    }

    // Offers / Campaigns
    for (const offer of offers) {
      const lastmod = (offer.updatedAt || new Date()).toISOString().split('T')[0];
      xml += `  <url>\n`;
      xml += `    <loc>${escapeXml(`${BASE_URL}/offers/${offer.slug}`)}</loc>\n`;
      xml += `    <lastmod>${lastmod}</lastmod>\n`;
      xml += `    <changefreq>daily</changefreq>\n`;
      xml += `    <priority>0.85</priority>\n`;
      xml += `  </url>\n`;
    }

    xml += `</urlset>\n`;

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=14400');
    return res.send(xml);
  } catch (err: any) {
    console.error('getSitemapXml error:', err);
    res.status(500).send('Error generating sitemap');
  }
};

/**
 * Serves canonical robots.txt with crawling rules and sitemap reference
 */
export const getRobotsTxt = (_req: Request, res: Response) => {
  const robots = `# JADMAA Varmakalai Robots Configuration
User-agent: *
Allow: /
Allow: /courses/
Allow: /blog/
Allow: /shop/
Allow: /offers/
Allow: /about
Allow: /contact

# Block private user portals, auth endpoints and cart/checkout
Disallow: /admin/
Disallow: /student/
Disallow: /instructor/
Disallow: /api/
Disallow: /reset-password
Disallow: /forgot-password
Disallow: /checkout
Disallow: /cart

Sitemap: ${BASE_URL}/sitemap.xml
`;

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  return res.send(robots);
};

/**
 * Pre-renders rich OpenGraph & Twitter card meta tags into raw HTML
 * when social preview crawlers (WhatsApp, Facebook, Instagram DM, Twitter/X, Telegram, LinkedIn)
 * or search engines request shared pages.
 */
export const botPrerenderMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const userAgent = req.headers['user-agent'] || '';
  const isBot = BOT_USER_AGENTS.test(userAgent);

  // Only handle GET requests for web pages
  if (req.method !== 'GET' || req.path.startsWith('/api/') || req.path.includes('.')) {
    return next();
  }

  const urlPath = req.path;

  // Check backward-compatible 301 redirects for legacy percent-encoded or Tamil blog slugs
  if (urlPath.startsWith('/blog/')) {
    const rawSlug = urlPath.replace('/blog/', '').split('?')[0].trim();
    const decodedSlug = safeDecode(rawSlug).trim();

    // Check if the requested slug contains non-ASCII or percent-encoded characters
    const isLegacySlug = rawSlug.includes('%') || /[^\x00-\x7F]/.test(decodedSlug);

    if (isLegacySlug) {
      try {
        const transliterated = transliterateTamilToEnglish(decodedSlug).toLowerCase().replace(/[\s_-]+/g, '-');
        const blog = await prisma.blogPost.findFirst({
          where: {
            OR: [
              { slug: rawSlug },
              { slug: decodedSlug },
              { slug: transliterated },
              { id: rawSlug },
              // Legacy hardcoded mappings
              ...(decodedSlug.includes('சிகிச்சை') || decodedSlug.includes('sikissai') || rawSlug.includes('%E0%AE%9A%E0%AE%BF%E0%AE%9A%E0%AF%8D%E0%AE%9A%E0%AF%88')
                ? [{ slug: 'varma-sikissai-enraal-enna-alikkappatum-muraikal' }]
                : []),
              ...(decodedSlug.includes('யார்') || decodedSlug.includes('ஆசான்') || decodedSlug.includes('aasaan') || rawSlug.includes('%E0%AE%AF%E0%AE%BE%E0%AE%B0%E0%AF%8D')
                ? [{ slug: 'yaar-varma-aasaan-yaar-varmaani-virivaana-vilakkam' }]
                : [])
            ]
          },
          select: { slug: true }
        });

        if (blog && blog.slug) {
          // If human browser, issue 301 redirect
          if (!isBot && blog.slug !== rawSlug && blog.slug !== decodedSlug) {
            return res.redirect(301, `/blog/${blog.slug}`);
          }
        }
      } catch (err) {
        console.warn('Legacy slug resolution error:', err);
      }
    }
  }

  // If not a bot and not redirected, continue normal client SPA routing
  if (!isBot) {
    return next();
  }

  try {
    let pageTitle = 'JADMAA Varmakalai | Authentic Varmam Training & Traditional Medicine';
    let pageDesc = 'Learn authentic Varmakalai, traditional Tamil martial arts, and Siddha healing from certified lineage masters in Thanjavur, Kumbakonam & Ariyalur.';
    let pageImage = `${BASE_URL}/images/logo-1.png`;
    let pageImageMime = 'image/png';
    let pageCanonical = `${BASE_URL}${urlPath}`;
    let pageType = 'website';
    let schemaJson: any = null;

    // 1. Course page: /courses/:slug
    if (urlPath.startsWith('/courses/')) {
      const slug = urlPath.replace('/courses/', '').split('?')[0].trim();
      const course = await prisma.course.findFirst({
        where: { OR: [{ slug }, { id: slug }] },
        include: { instructor: true }
      });

      if (course) {
        pageTitle = course.metaTitle || `${course.title} | JADMAA Varmakalai Course`;
        pageDesc = course.metaDesc || course.subtitle || course.description.slice(0, 160).trim();
        pageImage = getAbsoluteImageUrl(course.thumbnailUrl);
        pageImageMime = getImageMimeType(pageImage);
        pageCanonical = `${BASE_URL}/courses/${course.slug}`;
        pageType = 'article';
        schemaJson = {
          '@context': 'https://schema.org',
          '@type': 'Course',
          name: course.title,
          description: pageDesc,
          image: pageImage,
          provider: {
            '@type': 'Organization',
            name: 'JADMAA Varmakalai',
            sameAs: 'https://jadmaa.com'
          },
          offers: {
            '@type': 'Offer',
            price: course.price,
            priceCurrency: 'INR',
            category: course.category
          }
        };
      }
    } 
    // 2. Blog post: /blog/:slug
    else if (urlPath.startsWith('/blog/')) {
      const rawSlug = urlPath.replace('/blog/', '').split('?')[0].trim();
      const decodedSlug = decodeURIComponent(rawSlug).trim();
      const transliterated = transliterateTamilToEnglish(decodedSlug).toLowerCase().replace(/[\s_-]+/g, '-');

      const blog = await prisma.blogPost.findFirst({
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
        include: { author: true }
      });

      if (blog) {
        pageTitle = blog.metaTitle || `${blog.title} | JADMAA Varmakalai`;
        pageDesc = blog.metaDesc || blog.excerpt || blog.content.replace(/<[^>]+>/g, '').slice(0, 160).trim();
        pageImage = getAbsoluteImageUrl(blog.thumbnailUrl);
        pageImageMime = getImageMimeType(pageImage);
        pageCanonical = `${BASE_URL}/blog/${blog.slug}`;
        pageType = 'article';
        schemaJson = {
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: blog.title,
          description: pageDesc,
          image: pageImage,
          datePublished: blog.createdAt,
          dateModified: blog.updatedAt,
          author: {
            '@type': 'Person',
            name: blog.author?.name || 'Aasan Bojagarajan'
          },
          publisher: {
            '@type': 'Organization',
            name: 'JADMAA Varmakalai',
            logo: {
              '@type': 'ImageObject',
              url: `${BASE_URL}/images/logo-1.png`
            }
          }
        };
      }
    }
    // 3. Campaign Offer: /offers/:slug
    else if (urlPath.startsWith('/offers/')) {
      const slug = urlPath.replace('/offers/', '').split('?')[0].trim();
      const offer = await prisma.courseOffer.findFirst({
        where: { slug }
      });

      if (offer) {
        pageTitle = offer.metaTitle || `${offer.title} | Special Campaign Offer — JADMAA`;
        pageDesc = offer.metaDesc || offer.shortDescription || offer.description.slice(0, 160).trim();
        pageImage = getAbsoluteImageUrl(offer.bannerImageUrl);
        pageImageMime = getImageMimeType(pageImage);
        pageCanonical = `${BASE_URL}/offers/${offer.slug}`;
        pageType = 'website';
      }
    }
    // 4. Products: /shop/product/:slug or /products/:slug
    else if (urlPath.startsWith('/shop/product/') || urlPath.startsWith('/products/')) {
      const slug = urlPath.replace('/shop/product/', '').replace('/products/', '').split('?')[0].trim();
      const product = await prisma.product.findFirst({
        where: { OR: [{ slug }, { id: slug }] }
      });

      if (product) {
        pageTitle = product.metaTitle || `${product.name} | JADMAA Official Store`;
        pageDesc = product.metaDesc || product.description?.slice(0, 160).trim() || 'Official JADMAA equipment, uniforms and Siddhar literature.';
        const firstImg = product.images && product.images.length > 0 ? product.images[0] : null;
        pageImage = getAbsoluteImageUrl(firstImg);
        pageImageMime = getImageMimeType(pageImage);
        pageCanonical = `${BASE_URL}/shop/product/${product.slug}`;
        pageType = 'product';
      }
    }

    // Build OpenGraph & Twitter Card tags according to exact social platform specs
    const metaTags = `
    <title>${escapeXml(pageTitle)}</title>
    <meta name="description" content="${escapeXml(pageDesc)}" />
    <link rel="canonical" href="${escapeXml(pageCanonical)}" />

    <!-- OpenGraph / Facebook / WhatsApp / Instagram / LinkedIn Rich Link Preview -->
    <meta property="og:type" content="${pageType}" />
    <meta property="og:site_name" content="JADMAA Varmakalai" />
    <meta property="og:title" content="${escapeXml(pageTitle)}" />
    <meta property="og:description" content="${escapeXml(pageDesc)}" />
    <meta property="og:image" content="${escapeXml(pageImage)}" />
    <meta property="og:image:secure_url" content="${escapeXml(pageImage)}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:type" content="${pageImageMime}" />
    <meta property="og:url" content="${escapeXml(pageCanonical)}" />

    <!-- Twitter / X / Social App Large Image Card Preview -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:site" content="@Jadmaavarmakalai" />
    <meta name="twitter:title" content="${escapeXml(pageTitle)}" />
    <meta name="twitter:description" content="${escapeXml(pageDesc)}" />
    <meta name="twitter:image" content="${escapeXml(pageImage)}" />
    ${schemaJson ? `<script type="application/ld+json">${JSON.stringify(schemaJson)}</script>` : ''}
    `;

    // Try reading built index.html or fallback to root index.html
    const distHtml = path.resolve(process.cwd(), 'dist', 'index.html');
    const rootHtml = path.resolve(process.cwd(), 'index.html');
    const htmlPath = fs.existsSync(distHtml) ? distHtml : rootHtml;

    let html = '';
    if (fs.existsSync(htmlPath)) {
      html = fs.readFileSync(htmlPath, 'utf8');
      // Strip default generic tags from index.html template so social scrapers don't see conflicts
      html = html
        .replace(/<title>[\s\S]*?<\/title>/gi, '')
        .replace(/<meta\s+[^>]*?(?:name|property)=["'](?:og:[^"']+|twitter:[^"']+|description)["'][^>]*\/?>/gi, '')
        .replace(/<link\s+[^>]*?rel=["']canonical["'][^>]*\/?>/gi, '');
      html = html.replace(/<head>/i, `<head>\n${metaTags}\n`);
    } else {
      // Fallback HTML shell when static files aren't on serverless disk
      html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" />${metaTags}</head><body><div id="root"></div></body></html>`;
    }

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=3600');
    return res.send(html);
  } catch (err) {
    console.warn('botPrerenderMiddleware error:', err);
    return next();
  }
};
