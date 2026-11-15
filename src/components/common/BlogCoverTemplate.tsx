import React, { useMemo } from 'react';
import { ResponsiveImage } from './ResponsiveImage';

export interface BlogCoverTemplateProps {
  title: string;
  imageUrl?: string | null;
  priority?: boolean;
  isInsideBlog?: boolean;
  className?: string;
}

/**
 * BlogCoverTemplate — Standardized 1:1 Split Template for Blog Cards and Blog Article Headers.
 *
 * Layout (Aspect Ratio 2:1 Container):
 *   LEFT  (50%) — Exactly 1:1 square panel (Cream background #FAF6F0).
 *                 Displays the cover artwork using `object-contain` so the image
 *                 is NEVER cropped, regardless of original image aspect ratio.
 *   RIGHT (50%) — Exactly 1:1 square panel (White background).
 *                 Displays:
 *                 1. Blog title at the top (up to 50 characters, auto-wrapping, bold, charcoal)
 *                 2. Centered JADMAA logo
 *                 3. "JADMAA VARMAKALAI" branding
 *                 4. "Ancient Power. Modern Training." tagline
 */
export const BlogCoverTemplate: React.FC<BlogCoverTemplateProps> = ({
  title,
  imageUrl,
  priority = false,
  isInsideBlog = false,
  className = '',
}) => {
  const fallbackThumbnail = '/images/course-basic.jpg';
  const logoSrc = '/logo.png';
  const imageSrc = imageUrl && imageUrl.trim() ? imageUrl.trim() : fallbackThumbnail;

  // Blog title allowed up to 50 characters (matches exact branding rule)
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
      className={`w-full aspect-[2/1] flex overflow-hidden border border-[#E8DDD0] bg-white ${
        isInsideBlog ? 'rounded-xl sm:rounded-2xl shadow-2xs' : 'border-b'
      } ${className}`}
    >
      {/* LEFT — 1:1 Square Artwork (Cream Background, Never Cropped) */}
      <div className="w-1/2 h-full aspect-square overflow-hidden bg-[#FAF6F0] flex items-center justify-center relative">
        <ResponsiveImage
          src={imageSrc}
          alt={title}
          priority={priority}
          width={isInsideBlog ? 640 : 320}
          height={isInsideBlog ? 640 : 320}
          aspectRatio="1/1"
          isBlog={true}
          sizes={
            isInsideBlog
              ? '(max-width: 640px) 50vw, (max-width: 1024px) 45vw, 420px'
              : '(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 240px'
          }
          className="w-full h-full object-contain object-center transition-transform duration-500 group-hover:scale-105 hover:scale-105"
          fallbackSrc={fallbackThumbnail}
          wrapperClassName="w-full h-full flex items-center justify-center"
        />
      </div>

      {/* RIGHT — Blog Title at Top + Fixed Logo + Brand Text + Tagline */}
      <div
        className={`w-1/2 h-full aspect-square bg-white flex flex-col justify-between items-center text-center overflow-hidden border-l border-[#E8DDD0] ${
          isInsideBlog
            ? 'px-3 py-3 sm:px-5 sm:py-4 md:px-7 md:py-6'
            : 'px-2.5 py-2.5 sm:px-3 sm:py-3.5'
        }`}
      >
        {/* 1. Blog title at top */}
        <div className="w-full flex items-start justify-center pt-0.5 sm:pt-1">
          <p
            className={`text-[#2B2521] font-bold leading-[1.3] line-clamp-3 text-center ${
              isInsideBlog
                ? 'text-[12px] sm:text-[15px] md:text-[18px]'
                : 'text-[11px] sm:text-[12px] md:text-[13px]'
            }`}
          >
            {displayTitle}
          </p>
        </div>

        {/* 2 & 3. Fixed JADMAA logo + branding + tagline */}
        <div className="flex flex-col items-center justify-center my-auto pt-1 pb-0.5">
          <img
            src={logoSrc}
            alt="JADMAA Varmakalai"
            className={`w-auto max-w-[85%] object-contain transition-transform duration-300 group-hover:scale-105 hover:scale-105 ${
              isInsideBlog
                ? 'h-[46px] sm:h-[62px] md:h-[78px]'
                : 'h-[38px] sm:h-[46px] md:h-[52px]'
            }`}
            loading={isInsideBlog ? 'eager' : 'lazy'}
          />
          <div className="mt-1 sm:mt-1.5 text-center leading-none">
            <div>
              <span
                className={`text-[#2B2521] font-extrabold tracking-[0.14em] uppercase ${
                  isInsideBlog
                    ? 'text-[9px] sm:text-[11.5px] md:text-[13px]'
                    : 'text-[8px] sm:text-[9px] md:text-[10px]'
                }`}
              >
                JADMAA{' '}
              </span>
              <span
                className={`text-[#B12B2B] font-bold tracking-[0.14em] uppercase ${
                  isInsideBlog
                    ? 'text-[9px] sm:text-[11.5px] md:text-[13px]'
                    : 'text-[8px] sm:text-[9px] md:text-[10px]'
                }`}
              >
                VARMAKALAI
              </span>
            </div>
            <p
              className={`mt-1 sm:mt-1.5 text-[#5C5148] font-semibold tracking-[0.06em] uppercase ${
                isInsideBlog
                  ? 'text-[7px] sm:text-[9px] md:text-[10.5px]'
                  : 'text-[6px] sm:text-[7px] md:text-[7.5px]'
              }`}
            >
              Ancient Power. Modern Training.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
