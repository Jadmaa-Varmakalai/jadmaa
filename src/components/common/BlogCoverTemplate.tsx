import React, { useMemo } from 'react';
import { ResponsiveImage } from './ResponsiveImage';

export interface BlogCoverTemplateProps {
  title: string;
  imageUrl?: string | null;
  priority?: boolean;
  className?: string;
}

/**
 * BlogCoverTemplate — Inside Blog Header matching the exact BlogCard visual style and framing.
 *
 * Aspect Ratio:
 *   Locked to `aspect-[340/205]` (the exact ratio of the BlogCard visual panel: 340px width by 205px height).
 *   This guarantees that the left artwork half always has the exact 170:205 aspect ratio as the BlogCard,
 *   so the photo displays the EXACT same visual framing, content, and composition with zero unwanted cropping.
 *
 * Structure:
 *   LEFT  (50%) — Thumbnail Artwork (Cream Background #FAF6F0, object-cover object-center).
 *   RIGHT (50%) — White background:
 *                 1. Blog title at the top (up to 50 characters, auto-wrapping, bold, charcoal)
 *                 2. Centered JADMAA logo
 *                 3. "JADMAA VARMAKALAI" branding
 *                 4. "Ancient Power. Modern Training." tagline
 */
export const BlogCoverTemplate: React.FC<BlogCoverTemplateProps> = ({
  title,
  imageUrl,
  priority = false,
  className = '',
}) => {
  const fallbackThumbnail = '/images/course-basic.jpg';
  const logoSrc = '/logo.png';
  const imageSrc = imageUrl && imageUrl.trim() ? imageUrl.trim() : fallbackThumbnail;

  // Blog title allowed up to 50 characters (matches exact BlogCard rule)
  const displayTitle = useMemo(() => {
    const raw = (title || '').trim();
    if (raw.length <= 50) return raw;
    if (typeof Intl !== 'undefined' && (Intl as any).Segmenter) {
      try {
        const segmenter = new (Intl as any).Segmenter('ta', { granularity: 'grapheme' });
        const graphemes = Array.from(segmenter.segment(raw), (s: any) => s.segment);
        if (graphemes.length <= 50) return raw;
        return graphemes.slice(0, 50).join('').trim();
      } catch (_) {}
    }
    return raw.slice(0, 50).trim();
  }, [title]);

  return (
    <div
      className={`w-full aspect-[340/205] flex overflow-hidden rounded-xl sm:rounded-2xl border border-[#E8DDD0] bg-white shadow-2xs ${className}`}
    >
      {/* LEFT — Thumbnail Artwork (Cream Background, Exact BlogCard Ratio & Framing) */}
      <div className="w-1/2 h-full overflow-hidden bg-[#FAF6F0] flex items-center justify-center relative">
        <ResponsiveImage
          src={imageSrc}
          alt={title}
          priority={priority}
          width={640}
          height={410}
          aspectRatio="1/1"
          isBlog={true}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 45vw, 420px"
          className="w-full h-full object-cover object-center transition-transform duration-500 hover:scale-105"
          fallbackSrc={fallbackThumbnail}
          wrapperClassName="w-full h-full"
        />
      </div>

      {/* RIGHT — Blog Title at Top + Fixed Logo + Brand Text + Tagline (Exact BlogCard Proportions) */}
      <div className="w-1/2 h-full bg-white flex flex-col justify-between items-center px-3 py-3 sm:px-5 sm:py-5 md:px-7 md:py-6 text-center overflow-hidden border-l border-[#E8DDD0]">
        {/* 1. Blog title at top */}
        <div className="w-full flex items-start justify-center pt-0.5 sm:pt-1">
          <p className="text-[#2B2521] text-[12px] sm:text-[15px] md:text-[18px] font-bold leading-[1.3] line-clamp-3 text-center">
            {displayTitle}
          </p>
        </div>

        {/* 2 & 3. Fixed JADMAA logo + branding + tagline */}
        <div className="flex flex-col items-center justify-center my-auto py-1 sm:py-2">
          <img
            src={logoSrc}
            alt="JADMAA Varmakalai"
            className="h-[52px] sm:h-[68px] md:h-[84px] w-auto max-w-[85%] object-contain transition-transform duration-300 hover:scale-105"
            loading="eager"
          />
          <div className="mt-1.5 sm:mt-2.5 text-center leading-none">
            <div>
              <span className="text-[#2B2521] text-[9.5px] sm:text-[11.5px] md:text-[13.5px] font-extrabold tracking-[0.14em] uppercase">
                JADMAA{' '}
              </span>
              <span className="text-[#B12B2B] text-[9.5px] sm:text-[11.5px] md:text-[13.5px] font-bold tracking-[0.14em] uppercase">
                VARMAKALAI
              </span>
            </div>
            <p className="mt-1 sm:mt-1.5 text-[#5C5148] text-[7.5px] sm:text-[9px] md:text-[10.5px] font-semibold tracking-[0.06em] uppercase">
              Ancient Power. Modern Training.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
