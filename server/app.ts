import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { validateSecurityConfiguration } from './config/security.js';

// Validate cryptographic secrets upon application initialization
validateSecurityConfiguration();

import authRoutes from './modules/auth/auth.routes.js';
import courseRoutes from './modules/courses/course.routes.js';
import paymentRoutes from './modules/payments/payment.routes.js';
import enrollmentRoutes from './modules/enrollments/enrollment.routes.js';
import progressRoutes from './modules/progress/progress.routes.js';
import blogRoutes from './modules/blog/blog.routes.js';
import adminRoutes from './modules/admin/admin.routes.js';
import dbRoutes from './modules/admin/db.routes.js';
import reviewsRoutes from './modules/reviews/reviews.routes.js';
import uploadRoutes from './modules/upload/upload.routes.js';
import instructorRoutes from './modules/instructor/instructor.routes.js';
import productRoutes from './modules/products/product.routes.js';
import orderRoutes from './modules/orders/order.routes.js';
import offerRoutes, { adminRouter as offerAdminRoutes } from './modules/offers/offer.routes.js';
import certificateRoutes from './modules/certificates/certificate.routes.js';
import { getSitemapXml, getRobotsTxt, botPrerenderMiddleware } from './modules/seo/seo.controller.js';
import { getOptimizedImage } from './modules/blog/blog.controller.js';
import { initCourseAvailability } from './services/courseAvailability.service.js';
import path from 'path';
import fs from 'fs';

// Warm course availability cache from DB
initCourseAvailability().catch(() => {});

const app = express();

app.use(express.json({
  limit: '20mb',
  verify: (req: any, _res, buf) => {
    req.rawBody = buf?.toString();
  }
}));
app.use(express.urlencoded({ limit: '20mb', extended: true }));
app.use(cookieParser());
app.use(cors());
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginResourcePolicy: false,
}));

app.get(['/api/health', '/api/v1/health'], (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

import { prisma } from './db.js';

let settingsCache: any = null;
let settingsCacheTime = 0;
const SETTINGS_CACHE_TTL = 1000 * 60 * 10; // 10 minutes

// Explicit allowlist of approved public setting keys and prefixes for frontend CMS & display
const APPROVED_PUBLIC_SETTING_PREFIXES = [
  'site.',
  'home.',
  'about.',
  'shop.',
  'contact.',
  'courses.',
  'legal.',
];

const APPROVED_PUBLIC_SETTING_EXACT = [
  'offer_popup_enabled',
  'offer_popup_delay_seconds',
  'unavailable_course_ids',
];

app.get('/api/v1/settings', async (req, res) => {
  try {
    // Edge & browser cache: 60s browser, 5m CDN, stale-while-revalidate 10m
    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600');
    
    if (settingsCache && Date.now() - settingsCacheTime < SETTINGS_CACHE_TTL) {
      return res.json({ success: true, data: settingsCache });
    }

    // Security Hardening: Never expose internal configs, credentials, or instructor applications (PII)
    const settings = await prisma.systemSetting.findMany({
      where: {
        OR: [
          ...APPROVED_PUBLIC_SETTING_PREFIXES.map((prefix) => ({ key: { startsWith: prefix } })),
          { key: { in: APPROVED_PUBLIC_SETTING_EXACT } },
        ],
      },
      select: {
        id: true,
        key: true,
        value: true,
        description: true,
        updatedAt: true,
      },
    });

    const mappedSettings = settings.map((s) => {
      if (s.key === 'home.hero.cta2' && (s.value === 'Book Demo Class' || !s.value)) {
        return { ...s, value: 'Book Demo' };
      }
      return s;
    });

    settingsCache = mappedSettings;
    settingsCacheTime = Date.now();
    res.json({ success: true, data: mappedSettings });
  } catch (err: any) {
    console.error('[Settings] Error fetching settings:', err);
    if (settingsCache) {
      return res.json({ success: true, data: settingsCache });
    }
    res.status(500).json({ success: false, error: { message: 'Server error' } });
  }
});

const uploadsDirectory = process.env.UPLOADS_DIR && fs.existsSync(process.env.UPLOADS_DIR)
  ? process.env.UPLOADS_DIR
  : fs.existsSync('/opt/jadmaa/uploads')
    ? '/opt/jadmaa/uploads'
    : path.join(process.cwd(), 'public', 'uploads');

app.use('/uploads', express.static(uploadsDirectory, {
  maxAge: '30d',
  setHeaders: (res, filePath) => {
    if (/\.(webp|avif|png|jpe?g|svg)$/i.test(filePath)) {
      res.setHeader('Cache-Control', 'public, max-age=2592000, stale-while-revalidate=86400');
    }
  }
}));

app.use('/images', express.static(path.join(process.cwd(), 'public', 'images'), {
  maxAge: '30d',
  setHeaders: (res, filePath) => {
    if (filePath.includes('optimized') || filePath.includes('blog')) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    } else if (/\.(webp|avif|png|jpe?g|svg)$/i.test(filePath)) {
      res.setHeader('Cache-Control', 'public, max-age=2592000, stale-while-revalidate=86400');
    }
  }
}));

// SEO: Dynamic sitemap.xml & robots.txt
app.get('/sitemap.xml', getSitemapXml);
app.get('/robots.txt', getRobotsTxt);

// Bot Pre-render Middleware for Social & Search Crawlers
app.use(botPrerenderMiddleware);

// Global high-performance image optimization endpoint
app.get('/api/v1/optimized-image', getOptimizedImage);

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/courses', courseRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/enrollments', enrollmentRoutes);
app.use('/api/v1/me', progressRoutes);
app.use('/api/v1/blogs', blogRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/db-admin', dbRoutes);
app.use('/api/v1/reviews', reviewsRoutes);
app.use('/api/v1/upload', uploadRoutes);
app.use('/api/v1/instructor', instructorRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/offers', offerRoutes);
app.use('/api/v1/admin/offers', offerAdminRoutes);
app.use('/api/v1/certificates', certificateRoutes);

// Fallback handler for non-API routes (SPA index.html)
// Only in production / serverless environments (in local dev, Vite middlewares handle SPA and modules)
if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
  app.use((req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/api/') || req.path.includes('.')) return next();
    const distHtml = path.resolve(process.cwd(), 'dist', 'index.html');
    const vpsHtml = '/var/www/jadmaa/frontend/index.html';
    const rootHtml = path.resolve(process.cwd(), 'index.html');
    const htmlPath = fs.existsSync(distHtml) ? distHtml : fs.existsSync(vpsHtml) ? vpsHtml : rootHtml;
    if (fs.existsSync(htmlPath)) {
      return res.sendFile(htmlPath);
    }
    return res.status(404).send('Page not found');
  });
}

export default app;
