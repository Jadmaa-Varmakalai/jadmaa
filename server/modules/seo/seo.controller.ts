import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../db.js';
import fs from 'fs';
import path from 'path';

const BASE_URL = process.env.FRONTEND_URL || 'https://jadmaa.com';

const BOT_USER_AGENTS = /googlebot|bingbot|yandex|baiduspider|twitterbot|facebookexternalhit|rogerbot|linkedinbot|embedly|quora link preview|showyoubot|outbrain|pinterest\/0\.|pinterestbot|slackbot|vkshare|w3c_validator|whatsapp|telegrambot|duckduckbot/i;

/**
 * Escapes XML special characters for sitemap validity
 */
function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
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
 * Pre-renders SEO meta tags into index.html when search engine crawlers or social preview bots request pages
 */
export const botPrerenderMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const userAgent = req.headers['user-agent'] || '';
  if (!BOT_USER_AGENTS.test(userAgent)) {
    return next();
  }

  // Only handle GET requests for HTML pages
  if (req.method !== 'GET' || req.path.startsWith('/api/') || req.path.includes('.')) {
    return next();
  }

  try {
    const urlPath = req.path;
    let pageTitle = 'JADMAA Varmakalai | Authentic Varmam Training & Traditional Medicine';
    let pageDesc = 'Learn authentic Varmakalai, traditional Tamil martial arts, and Siddha healing from certified lineage masters in Thanjavur, Kumbakonam & Ariyalur.';
    let pageImage = `${BASE_URL}/images/logo-1.png`;
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
        pageDesc = course.metaDesc || course.subtitle || course.description.slice(0, 160);
        if (course.thumbnailUrl) pageImage = course.thumbnailUrl.startsWith('http') ? course.thumbnailUrl : `${BASE_URL}${course.thumbnailUrl}`;
        pageType = 'article';
        schemaJson = {
          '@context': 'https://schema.org',
          '@type': 'Course',
          name: course.title,
          description: pageDesc,
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
      const decodedSlug = decodeURIComponent(rawSlug);
      const blog = await prisma.blogPost.findFirst({
        where: { OR: [{ slug: rawSlug }, { slug: decodedSlug }, { id: rawSlug }] },
        include: { author: true }
      });

      if (blog) {
        pageTitle = blog.metaTitle || `${blog.title} | JADMAA Varmakalai`;
        pageDesc = blog.metaDesc || blog.excerpt || blog.content.replace(/<[^>]+>/g, '').slice(0, 160);
        if (blog.thumbnailUrl) pageImage = blog.thumbnailUrl.startsWith('http') ? blog.thumbnailUrl : `${BASE_URL}${blog.thumbnailUrl}`;
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
        pageDesc = offer.metaDesc || offer.shortDescription || offer.description.slice(0, 160);
        if (offer.bannerImageUrl) pageImage = offer.bannerImageUrl.startsWith('http') ? offer.bannerImageUrl : `${BASE_URL}${offer.bannerImageUrl}`;
        pageType = 'website';
      }
    }

    // Try reading built index.html or fallback to root index.html
    const distHtml = path.resolve(process.cwd(), 'dist', 'index.html');
    const rootHtml = path.resolve(process.cwd(), 'index.html');
    const htmlPath = fs.existsSync(distHtml) ? distHtml : rootHtml;

    if (!fs.existsSync(htmlPath)) {
      return next();
    }

    let html = fs.readFileSync(htmlPath, 'utf8');

    // Inject meta tags
    const metaTags = `
    <title>${escapeXml(pageTitle)}</title>
    <meta name="description" content="${escapeXml(pageDesc)}" />
    <link rel="canonical" href="${escapeXml(`${BASE_URL}${urlPath}`)}" />
    <meta property="og:type" content="${pageType}" />
    <meta property="og:title" content="${escapeXml(pageTitle)}" />
    <meta property="og:description" content="${escapeXml(pageDesc)}" />
    <meta property="og:image" content="${escapeXml(pageImage)}" />
    <meta property="og:url" content="${escapeXml(`${BASE_URL}${urlPath}`)}" />
    <meta property="og:site_name" content="JADMAA Varmakalai" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeXml(pageTitle)}" />
    <meta name="twitter:description" content="${escapeXml(pageDesc)}" />
    <meta name="twitter:image" content="${escapeXml(pageImage)}" />
    ${schemaJson ? `<script type="application/ld+json">${JSON.stringify(schemaJson)}</script>` : ''}
    `;

    html = html.replace(/<title>.*?<\/title>/i, '');
    html = html.replace(/<meta\s+name="description".*?>/i, '');
    html = html.replace('</head>', `${metaTags}\n  </head>`);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(html);
  } catch (err) {
    console.warn('botPrerenderMiddleware error:', err);
    return next();
  }
};

