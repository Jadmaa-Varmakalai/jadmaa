import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

interface ImageJob {
  src: string;
  isTransparent?: boolean;
  widths: number[];
  sizes?: { name: string; width: number; height?: number }[];
}

const JOBS: ImageJob[] = [
  // Homepage Hero
  {
    src: 'public/images/hero-kick-action-transparent.png',
    isTransparent: true,
    widths: [360, 480, 650],
  },
  // Homepage Wellness (Photo - converted to AVIF & WebP for huge savings)
  {
    src: 'public/images/wellness-682x1024.png',
    isTransparent: false,
    widths: [360, 480, 682, 1024],
  },
  // Homepage Training Stance
  {
    src: 'public/images/training-stance.png',
    isTransparent: true,
    widths: [360, 480, 576],
  },
  // Pose Dab
  {
    src: 'public/images/pose-dab-red-e1785095608624-653x1024.jpg',
    isTransparent: false,
    widths: [360, 480, 653],
  },
  // Hero kick action JPG
  {
    src: 'public/images/hero-kick-action-386x1024.jpg',
    isTransparent: false,
    widths: [360, 386],
  },
  // Careers / About Photo
  {
    src: 'public/images/file_000000008884820b9a3c789a8c0be531-1024x683.png',
    isTransparent: false,
    widths: [360, 480, 768, 1024],
  },
  // Founder WebP
  {
    src: 'public/images/founder.webp',
    isTransparent: false,
    widths: [360, 480, 720],
  },
  // Logo
  {
    src: 'public/images/logo-1.png',
    isTransparent: true,
    widths: [80, 160, 320, 601],
  },
  {
    src: 'public/logo.png',
    isTransparent: true,
    widths: [80, 160, 320, 601],
  },
  // Course Images
  {
    src: 'public/images/course-basic.jpg',
    isTransparent: false,
    widths: [360, 480, 768, 900],
  },
  {
    src: 'public/images/course-intermediate.jpg',
    isTransparent: false,
    widths: [360, 480, 768, 900],
  },
  {
    src: 'public/images/course-kids.jpg',
    isTransparent: false,
    widths: [360, 480, 768, 900],
  },
  {
    src: 'public/images/course-selfdefence-all.jpg',
    isTransparent: false,
    widths: [360, 480, 768, 900],
  },
  {
    src: 'public/images/course-weightloss-career.jpg',
    isTransparent: false,
    widths: [360, 480, 768, 1200],
  },
  {
    src: 'public/images/course-womens.jpg',
    isTransparent: false,
    widths: [360, 480, 768, 900],
  },
];

async function processImage(job: ImageJob) {
  const { src, isTransparent, widths } = job;
  if (!fs.existsSync(src)) {
    console.warn(`File not found: ${src}`);
    return;
  }

  const parsed = path.parse(src);
  const outDir = path.join(parsed.dir, 'optimized');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const metadata = await sharp(src).metadata();
  const originalWidth = metadata.width || 1000;
  const originalHeight = metadata.height || 1000;

  console.log(`Processing ${parsed.base} (${originalWidth}x${originalHeight}, ${parsed.ext})...`);

  for (const targetWidth of widths) {
    if (targetWidth > originalWidth && widths.length > 1) {
      continue; // Don't upscale
    }

    const targetHeight = Math.round((originalHeight / originalWidth) * targetWidth);

    const basePipeline = sharp(src)
      .resize(targetWidth, targetHeight, {
        fit: 'inside',
        withoutEnlargement: true,
      });

    // 1. Generate AVIF (modern ultra-high compression)
    const avifOut = path.join(outDir, `${parsed.name}-${targetWidth}w.avif`);
    await basePipeline
      .clone()
      .avif({ quality: 75, effort: 4 })
      .toFile(avifOut);

    // 2. Generate WebP (broad modern support)
    const webpOut = path.join(outDir, `${parsed.name}-${targetWidth}w.webp`);
    await basePipeline
      .clone()
      .webp({ quality: isTransparent ? 82 : 80, effort: 4 })
      .toFile(webpOut);

    // 3. Generate Optimized Fallback (JPEG or PNG)
    if (isTransparent) {
      const pngOut = path.join(outDir, `${parsed.name}-${targetWidth}w.png`);
      await basePipeline
        .clone()
        .png({ compressionLevel: 8, palette: true, quality: 85 })
        .toFile(pngOut);
    } else {
      const jpgOut = path.join(outDir, `${parsed.name}-${targetWidth}w.jpg`);
      await basePipeline
        .clone()
        .jpeg({ quality: 80, progressive: true, mozjpeg: true })
        .toFile(jpgOut);
    }
  }

  // Also generate 1:1 default modern format at full size
  const fullAvif = path.join(outDir, `${parsed.name}.avif`);
  const fullWebp = path.join(outDir, `${parsed.name}.webp`);

  await sharp(src)
    .avif({ quality: 78, effort: 4 })
    .toFile(fullAvif);

  await sharp(src)
    .webp({ quality: isTransparent ? 85 : 82, effort: 4 })
    .toFile(fullWebp);
}

// Generate dedicated blog thumbnails
async function generateBlogThumbnails() {
  const blogDir = 'public/images/blog';
  if (!fs.existsSync(blogDir)) {
    fs.mkdirSync(blogDir, { recursive: true });
  }

  const blogCovers = [
    {
      slug: 'varmakalai-beginners-first-3-months-cover',
      source: 'public/images/course-basic.jpg'
    },
    {
      slug: 'womens-self-defence-varmakalai-cover',
      source: 'public/images/course-womens.jpg'
    },
    {
      slug: 'varma-therapy-explained-cover',
      source: 'public/images/wellness-682x1024.png'
    },
    {
      slug: 'varmakalai-benefits-kids-cover',
      source: 'public/images/course-kids.jpg'
    },
    {
      slug: 'varmakalai-history-origins-cover',
      source: 'public/images/pose-dab-red-e1785095608624-653x1024.jpg'
    }
  ];

  for (const b of blogCovers) {
    if (!fs.existsSync(b.source)) continue;
    console.log(`Generating dedicated blog cover for ${b.slug}...`);
    
    // Blog card aspect ratio is 16:9 / cover
    const base = sharp(b.source).resize(600, 400, { fit: 'cover', position: 'top' });

    await base.clone().webp({ quality: 80 }).toFile(path.join(blogDir, `${b.slug}.webp`));
    await base.clone().avif({ quality: 75 }).toFile(path.join(blogDir, `${b.slug}.avif`));
    await base.clone().jpeg({ quality: 80, progressive: true }).toFile(path.join(blogDir, `${b.slug}.jpg`));
  }
}

async function run() {
  console.log('Starting image optimization with Sharp...');
  const start = Date.now();
  for (const job of JOBS) {
    await processImage(job);
  }
  await generateBlogThumbnails();
  console.log(`Optimization completed in ${((Date.now() - start) / 1000).toFixed(2)}s`);
}

run().catch(console.error);

