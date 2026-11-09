/**
 * Centralized SEO Slug Generation & Collision Engine
 * Sanitizes titles into keyword-rich, canonical kebab-case slugs,
 * supports full phonetic Tamil transliteration, and resolves duplicates safely.
 */

// Phonetic mappings for Tamil Unicode characters
export const TAMIL_VOWELS: Record<string, string> = {
  'அ': 'a', 'ஆ': 'aa', 'இ': 'i', 'ஈ': 'ee', 'உ': 'u',
  'ஊ': 'oo', 'எ': 'e', 'ஏ': 'ae', 'ஐ': 'ai', 'ஒ': 'o',
  'ஓ': 'oa', 'ஔ': 'au', 'ஃ': 'ah'
};

export const TAMIL_CONSONANTS: Record<string, string> = {
  'க': 'k', 'ங': 'ng', 'ச': 's', 'ஞ': 'gn', 'ட': 't',
  'ண': 'n', 'த': 'th', 'ந': 'n', 'ப': 'p', 'ம': 'm',
  'ய': 'y', 'ர': 'r', 'ல': 'l', 'வ': 'v', 'ழ': 'zh',
  'ள': 'l', 'ற': 'r', 'ன': 'n', 'ஜ': 'j', 'ஷ': 'sh',
  'ஸ': 's', 'ஹ': 'h'
};

export const TAMIL_VOWEL_SIGNS: Record<string, string> = {
  'ா': 'aa', 'ி': 'i', 'ீ': 'ee', 'ு': 'u', 'ூ': 'oo',
  'ெ': 'e', 'ே': 'ae', 'ை': 'ai', 'ொ': 'o', 'ோ': 'oa',
  'ௌ': 'au', '்': '' // Virama / Pulli removes the inherent 'a'
};

/**
 * Phonetically transliterates Tamil Unicode script to standard readable English (Romanized/Tanglish).
 */
export function transliterateTamilToEnglish(text: string): string {
  if (!text) return '';
  let result = '';
  const chars = Array.from(text);

  for (let i = 0; i < chars.length; i++) {
    const char = chars[i];
    const nextChar = chars[i + 1];

    if (TAMIL_VOWELS[char]) {
      result += TAMIL_VOWELS[char];
    } else if (TAMIL_CONSONANTS[char]) {
      if (nextChar && TAMIL_VOWEL_SIGNS[nextChar] !== undefined) {
        result += TAMIL_CONSONANTS[char] + TAMIL_VOWEL_SIGNS[nextChar];
        i++; // Skip next vowel sign
      } else {
        // Default inherent 'a' sound for unmuted consonants
        result += TAMIL_CONSONANTS[char] + 'a';
      }
    } else {
      // Latin letters, numbers, spaces, punctuation
      result += char;
    }
  }
  return result;
}

export interface SlugifyOptions {
  customSlug?: string;
  intentKeywords?: string[];
  maxLength?: number;
}

/**
 * Generates an SEO-optimized kebab-case slug from any title or custom slug.
 * Always produces clean, lowercase, hyphenated ASCII URLs without percent-encoding.
 */
export function generateSeoSlug(
  title: string,
  customSlugOrOptions?: string | SlugifyOptions,
  maybeOptions?: SlugifyOptions
): string {
  let customSlug: string | undefined;
  let options: SlugifyOptions = {};

  if (typeof customSlugOrOptions === 'string') {
    customSlug = customSlugOrOptions;
    options = maybeOptions || {};
  } else if (customSlugOrOptions && typeof customSlugOrOptions === 'object') {
    options = customSlugOrOptions;
    customSlug = options.customSlug;
  }

  const { intentKeywords = [], maxLength = 100 } = options;
  const source = customSlug && customSlug.trim() ? customSlug : title;

  if (!source || !source.trim()) {
    return `item-${Date.now()}`;
  }

  const transliterated = transliterateTamilToEnglish(source);

  let slug = transliterated
    .toLowerCase()
    .trim()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')    // Remove non-word chars
    .replace(/[\s_-]+/g, '-')     // Convert spaces/underscores to single hyphen
    .replace(/^-+|-+$/g, '');     // Trim leading/trailing hyphens

  if (!slug) {
    slug = `jadmaa-item-${Date.now()}`;
  }

  // If high-value intent keywords are supplied, incorporate primary keyword
  if (intentKeywords.length > 0) {
    const slugLower = slug.toLowerCase();
    const hasAnyKeyword = intentKeywords.some((kw) => slugLower.includes(kw.toLowerCase()));
    if (!hasAnyKeyword) {
      const primaryKeyword = intentKeywords[0].toLowerCase().replace(/\s+/g, '-');
      slug = `${slug}-${primaryKeyword}`;
    }
  }

  // Truncate to maximum length safely without cutting words in half
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
