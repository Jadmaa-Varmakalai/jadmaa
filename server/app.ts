import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

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
import { initCourseAvailability } from './services/courseAvailability.service.js';
import path from 'path';

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

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

import { prisma } from './db.js';

let settingsCache: any = null;
let settingsCacheTime = 0;
const SETTINGS_CACHE_TTL = 1000 * 60 * 10; // 10 minutes

app.get('/api/v1/settings', async (req, res) => {
  try {
    // Edge & browser cache: 60s browser, 5m CDN, stale-while-revalidate 10m
    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600');
    
    if (settingsCache && Date.now() - settingsCacheTime < SETTINGS_CACHE_TTL) {
      return res.json({ success: true, data: settingsCache });
    }

    const settings = await prisma.systemSetting.findMany();
    settingsCache = settings;
    settingsCacheTime = Date.now();
    res.json({ success: true, data: settings });
  } catch (err: any) {
    console.error('[Settings] Error fetching settings:', err);
    if (settingsCache) {
      return res.json({ success: true, data: settingsCache });
    }
    res.status(500).json({ success: false, error: { message: 'Server error' } });
  }
});

app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));

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

export default app;
