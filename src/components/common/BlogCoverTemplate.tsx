import React, { useMemo } from 'react';
import { ResponsiveImage } from './ResponsiveImage';

export interface BlogCoverTemplateProps {
  title: string;
  imageUrl?: string | null;
  priority?: boolean;
  className?: string;
}

/**
 * BlogCoverTemplate — Inside Blog Header matching the exact BlogCard visual style.
 *
 * Structure (Matches BlogCard Upper Visual Panel Exactly):
 *   LEFT  (50%) — Thumbnail Artwork (Cream Background #FAF6F0, object-cover edge-to-edge).
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
      className={`w-full flex h-[210px] sm:h-[260px] md:h-[300px] overflow-hidden rounded-xl sm:rounded-2xl border border-[#E8DDD0] bg-white shadow-2xs ${className}`}
    >
      {/* LEFT — Thumbnail Artwork (Cream Background, Exact BlogCard object-cover) */}
      <div className="w-1/2 overflow-hidden bg-[#FAF6F0] flex items-center justify-center relative">
        <ResponsiveImage
          src={imageSrc}
          alt={title}
          priority={priority}
          width={640}
          height={320}
          aspectRatio="1/1"
          isBlog={true}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 45vw, 420px"
          className="w-full h-full object-cover object-center transition-transform duration-500 hover:scale-105"
          fallbackSrc={fallbackThumbnail}
          wrapperClassName="w-full h-full"
        />
      </div>

      {/* RIGHT — Blog Title at Top + Fixed Logo + Brand Text + Tagline (Exact BlogCard Style) */}
      <div className="w-1/2 bg-white flex flex-col justify-between items-center px-3 py-3 sm:px-4 sm:py-3.5 md:px-6 md:py-4 text-center overflow-hidden border-l border-[#E8DDD0]">
        {/* 1. Blog title at top */}
        <div className="w-full flex items-start justify-center pt-0.5 sm:pt-1">
          <p className="text-[#2B2521] text-[12px] sm:text-[15px] md:text-[17px] font-bold leading-[1.3] line-clamp-3 text-center">
            {displayTitle}
          </p>
        </div>

        {/* 2 & 3. Fixed JADMAA logo + branding + tagline */}
        <div className="flex flex-col items-center justify-center my-auto pt-1 pb-0.5">
          <img
            src={logoSrc}
            alt="JADMAA Varmakalai"
            className="h-[52px] sm:h-[66px] md:h-[78px] w-auto max-w-[85%] object-contain transition-transform duration-300 hover:scale-105"
            loading="eager"
          />
          <div className="mt-1.5 sm:mt-2 text-center leading-none">
            <div>
              <span className="text-[#2B2521] text-[9.5px] sm:text-[11.5px] md:text-[13px] font-extrabold tracking-[0.14em] uppercase">
                JADMAA{' '}
              </span>
              <span className="text-[#B12B2B] text-[9.5px] sm:text-[11.5px] md:text-[13px] font-bold tracking-[0.14em] uppercase">
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
