/**
 * Image optimization utilities for JADMAA LMS.
 * Maps original asset paths to modern responsive derivatives (AVIF, WebP, optimized JPEG/PNG).
 */

export interface ImageDerivativeConfig {
  baseName: string;
  widths: number[];
  aspectRatio?: string;
  defaultWidth: number;
  defaultHeight: number;
}

export const OPTIMIZED_IMAGE_MAP: Record<string, ImageDerivativeConfig> = {
  'hero-kick-action-transparent': {
    baseName: 'hero-kick-action-transparent',
    widths: [360, 386],
    defaultWidth: 386,
    defaultHeight: 1024,
    aspectRatio: '386/1024',
  },
  'wellness-682x1024': {
    baseName: 'wellness-682x1024',
    widths: [360, 480, 682, 1024],
    defaultWidth: 1024,
    defaultHeight: 1536,
    aspectRatio: '2/3',
  },
  'training-stance': {
    baseName: 'training-stance',
    widths: [360, 480, 576],
    defaultWidth: 576,
    defaultHeight: 1024,
    aspectRatio: '576/1024',
  },
  'pose-dab-red-e1785095608624-653x1024': {
    baseName: 'pose-dab-red-e1785095608624-653x1024',
    widths: [360, 480, 653],
    defaultWidth: 653,
    defaultHeight: 1024,
    aspectRatio: '653/1024',
  },
  'hero-kick-action-386x1024': {
    baseName: 'hero-kick-action-386x1024',
    widths: [360, 386],
    defaultWidth: 386,
    defaultHeight: 1024,
    aspectRatio: '386/1024',
  },
  'file_000000008884820b9a3c789a8c0be531-1024x683': {
    baseName: 'file_000000008884820b9a3c789a8c0be531-1024x683',
    widths: [360, 480, 768, 1024],
    defaultWidth: 1024,
    defaultHeight: 683,
    aspectRatio: '1024/683',
  },
  'founder': {
    baseName: 'founder',
    widths: [360, 480, 720],
    defaultWidth: 720,
    defaultHeight: 540,
    aspectRatio: '4/3',
  },
  'logo-1': {
    baseName: 'logo-1',
    widths: [80, 160, 320, 601],
    defaultWidth: 601,
    defaultHeight: 601,
    aspectRatio: '1/1',
  },
  'logo': {
    baseName: 'logo',
    widths: [80, 160, 320, 601],
    defaultWidth: 601,
    defaultHeight: 601,
    aspectRatio: '1/1',
  },
  'course-basic': {
    baseName: 'course-basic',
    widths: [360, 480, 768, 900],
    defaultWidth: 900,
    defaultHeight: 900,
    aspectRatio: '1/1',
  },
  'course-intermediate': {
    baseName: 'course-intermediate',
    widths: [360, 480, 768, 900],
    defaultWidth: 900,
    defaultHeight: 900,
    aspectRatio: '1/1',
  },
  'course-kids': {
    baseName: 'course-kids',
    widths: [360, 480, 768, 900],
    defaultWidth: 900,
    defaultHeight: 900,
    aspectRatio: '1/1',
  },
  'course-selfdefence-all': {
    baseName: 'course-selfdefence-all',
    widths: [360, 480, 768, 900],
    defaultWidth: 900,
    defaultHeight: 900,
    aspectRatio: '1/1',
  },
  'course-weightloss-career': {
    baseName: 'course-weightloss-career',
    widths: [360, 480, 768, 1200],
    defaultWidth: 1254,
    defaultHeight: 1254,
    aspectRatio: '1/1',
  },
  'course-womens': {
    baseName: 'course-womens',
    widths: [360, 480, 768, 900],
    defaultWidth: 900,
    defaultHeight: 1075,
    aspectRatio: '900/1075',
  },
};

/**
 * Normalizes an image path and checks if an optimized configuration exists.
 */
export function getOptimizedConfig(src: string): ImageDerivativeConfig | null {
  if (!src) return null;

  // Handle blog thumbnails
  if (src.includes('varmakalai-beginners-first-3-months') || src.includes('varmakalai-benefits-kids') ||
      src.includes('varmakalai-history-origins') || src.includes('womens-self-defence') ||
      src.includes('varma-therapy-explained')) {
    return null; // Handled directly in blog thumbnail resolver
  }

  // Extract base filename without extension
  const clean = src.split('?')[0].split('#')[0];
  const filename = clean.substring(clean.lastIndexOf('/') + 1);
  const baseName = filename.replace(/\.[^/.]+$/, '');

  return OPTIMIZED_IMAGE_MAP[baseName] || null;
}

/**
 * Resolves a blog thumbnail to its optimized local asset.
 */
export function getOptimizedBlogThumbnail(slugOrUrl: string): { avif: string; webp: string; jpg: string } | null {
  if (!slugOrUrl) return null;

  const key = slugOrUrl.toLowerCase();
  let baseName = '';

  if (key.includes('beginners') || key.includes('first-3-months')) {
    baseName = 'varmakalai-beginners-first-3-months-cover';
  } else if (key.includes('women') || key.includes('self-defence')) {
    baseName = 'womens-self-defence-varmakalai-cover';
  } else if (key.includes('therapy') || key.includes('varma-therapy')) {
    baseName = 'varma-therapy-explained-cover';
  } else if (key.includes('kids') || key.includes('benefits-kids')) {
    baseName = 'varmakalai-benefits-kids-cover';
  } else if (key.includes('history') || key.includes('origins')) {
    baseName = 'varmakalai-history-origins-cover';
  }

  if (!baseName) return null;

  return {
    avif: `/images/blog/${baseName}.avif`,
    webp: `/images/blog/${baseName}.webp`,
    jpg: `/images/blog/${baseName}.jpg`,
  };
}

/**
 * Generates responsive srcset strings for AVIF, WebP, and original format.
 */
export function buildSrcSet(baseName: string, widths: number[], format: 'avif' | 'webp' | 'jpg' | 'png'): string {
  return widths
    .map(w => `/images/optimized/${baseName}-${w}w.${format} ${w}w`)
    .join(', ');
}
