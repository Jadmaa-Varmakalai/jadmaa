/**
 * Centralized SEO Slug Generation & Collision Engine
 * Sanitizes titles into keyword-rich, canonical kebab-case slugs,
 * supports Tamil/Indic transliteration, and resolves duplicates safely.
 */

// Common Tamil-to-English martial arts & healing transliterations
const TAMIL_TRANSLITERATION_MAP: Record<string, string> = {
  'வர்மக்கலை': 'varmakalai',
  'வர்மம்': 'varmam',
  'வர்ம': 'varma',
  'சிகிச்சை': 'chikitsai-treatment',
  'ஆசான்': 'aasan',
  'வர்மாணி': 'varmani',
  'அடிமுறை': 'adimurai',
  'சிலம்பம்': 'silambam',
  'தற்காப்பு': 'self-defence',
  'மருத்துவம்': 'traditional-medicine',
  'பயிற்சி': 'training',
  'விளக்கம்': 'explanation-guide',
  'முறைகள்': 'techniques-methods',
  'புள்ளிகள்': 'points-vital-nodes',
  'என்றால்': 'meaning-explained',
  'என்ன': 'what-is',
  'யார்': 'who-is',
};

/**
 * Transliterates Tamil text if present, otherwise normalizes latin text
 */
export function transliterateTamil(text: string): string {
  let result = text;
  for (const [tamil, english] of Object.entries(TAMIL_TRANSLITERATION_MAP)) {
    result = result.replace(new RegExp(tamil, 'g'), ` ${english} `);
  }
  return result;
}

export interface SlugifyOptions {
  intentKeywords?: string[];
  maxLength?: number;
  allowUnicode?: boolean;
}

/**
 * Generates an SEO-optimized kebab-case slug from any title.
 */
export function generateSeoSlug(title: string, options: SlugifyOptions = {}): string {
  if (!title || !title.trim()) {
    return `item-${Date.now()}`;
  }

  const { intentKeywords = [], maxLength = 100, allowUnicode = false } = options;

  let processed = transliterateTamil(title.trim().toLowerCase());

  // Remove common symbols and punctuation
  processed = processed
    .normalize('NFKD')
    .replace(/[^\w\s\u0B80-\u0BFF-]/g, '') // preserve alphanumeric, tamil block, spaces & hyphens
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-');

  // If unicode is not requested, convert any leftover non-ascii characters or strip them
  if (!allowUnicode) {
    processed = processed
      .replace(/[^\w-]/g, '')
      .replace(/-+/g, '-');
  }

  // Strip leading and trailing hyphens
  let slug = processed.replace(/^-+|-+$/g, '');

  if (!slug) {
    slug = `jadmaa-item-${Date.now()}`;
  }

  // If high-value intent keywords are supplied, ensure at least one primary keyword is incorporated
  if (intentKeywords.length > 0) {
    const slugLower = slug.toLowerCase();
    const hasAnyKeyword = intentKeywords.some((kw) => slugLower.includes(kw.toLowerCase()));
    if (!hasAnyKeyword) {
      const primaryKeyword = intentKeywords[0].toLowerCase().replace(/\s+/g, '-');
      slug = `${slug}-${primaryKeyword}`;
    }
  }

  // Truncate to maximum length safely without cutting in the middle of a word
  if (slug.length > maxLength) {
    const truncated = slug.substring(0, maxLength);
    const lastHyphen = truncated.lastIndexOf('-');
    slug = lastHyphen > 20 ? truncated.substring(0, lastHyphen) : truncated;
  }

  return slug.replace(/^-+|-+$/g, '');
}

/**
 * Checks database model to ensure slug uniqueness. If collision exists, appends numeric suffixes.
 */
export async function getUniqueSlug(
  modelDelegate: { findFirst: (args: any) => Promise<any> },
  baseSlug: string,
  excludeId?: string
): Promise<string> {
  let candidate = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await modelDelegate.findFirst({
      where: {
        slug: candidate,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      select: { id: true },
    });

    if (!existing) {
      return candidate;
    }

    candidate = `${baseSlug}-${counter}`;
    counter += 1;
  }
}

