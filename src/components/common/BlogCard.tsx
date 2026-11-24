import React from 'react';
import { Link } from 'react-router-dom';
import type { BlogPost } from '../../lib/api/blogApi';
import { format } from 'date-fns';
import { ResponsiveImage } from './ResponsiveImage';
import { ShareButton } from './ShareButton';

interface BlogCardProps {
  blog: BlogPost;
  isAdmin?: boolean;
  priority?: boolean;
  onEdit?: (blog: BlogPost) => void;
  onDelete?: (blog: BlogPost) => void;
}

/**
 * BlogCard — Unified JADMAA Blog Card Component.
 *
 * Upper visual section (Split 50/50):
 *   LEFT  (50%) — Cream-colored panel displaying the thumbnail
 *                 (object-fit: cover, clean cropping, zero distortion).
 *   RIGHT (50%) — Original white background containing:
 *                 1. Blog title at the top (clean, readable, up to 50 characters, auto-wrapping)
 *                 2. Fixed JADMAA logo below (reduced ~20-25%, centered)
 *                 3. Fixed "JADMAA VARMAKALAI" branding beneath the logo
 *                 4. Tagline "Ancient Power. Modern Training." below branding
 *
 * Lower content section:
 *   - Red blog title link (up to 50 chars)
 *   - Publication date & author
 *   - Short description / excerpt
 *   - "Read More →" link
 *   - Admin Action Toolbar (Edit / Delete) if isAdmin is true
 */
export const BlogCard: React.FC<BlogCardProps> = ({ blog, isAdmin, priority = false, onEdit, onDelete }) => {
  const fallbackThumbnail = '/images/course-basic.jpg';
  const logoSrc = '/logo.png';

  // Format date safely
  const formattedDate = (() => {
    try {
      return format(new Date(blog.createdAt), 'MMMM dd, yyyy');
    } catch {
      return 'Recent';
    }
  })();

  // Allow up to 50 characters for blog title safely
  const rawTitle = (blog.title || '').trim();
  const displayTitle = (() => {
    if (rawTitle.length <= 50) return rawTitle;
    if (typeof Intl !== 'undefined' && (Intl as any).Segmenter) {
      try {
        const segmenter = new (Intl as any).Segmenter('ta', { granularity: 'grapheme' });
        const graphemes = Array.from(segmenter.segment(rawTitle), (s: any) => s.segment);
        if (graphemes.length <= 50) return rawTitle;
        return graphemes.slice(0, 50).join('').trim();
      } catch (_) {
        // Fallback if segmenter fails
      }
    }
    return rawTitle.slice(0, 50).trim();
  })();
  const displayTopic = displayTitle;

  // Standardized dynamic title font size based on title length:
  // Guarantees up to 50 characters (including long Tamil and English titles) fit cleanly
  // across mobile, tablet, and laptop screens without being cut off by line clamping.
  const titleLength = displayTopic.length;
  const titleFontSize = React.useMemo(() => {
    if (titleLength <= 24) return 'text-[12.5px] sm:text-[13.5px] lg:text-[14px]';
    if (titleLength <= 36) return 'text-[11px] sm:text-[12px] lg:text-[12.5px]';
    return 'text-[9.5px] sm:text-[10.5px] lg:text-[11px]';
  }, [titleLength]);

  return (
    <article className="bg-white border border-[#E8DDD0] rounded-[14px] overflow-hidden flex flex-col transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 group relative max-w-[390px] sm:max-w-none w-full h-full">
      {/* ── Upper visual split panel (Geometrically locked to aspect-[340/205] for standard framing) ── */}
      <Link
        to={`/blog/${blog.slug}`}
        className="flex aspect-[340/205] w-full overflow-hidden border-b border-[#E8DDD0]"
        aria-label={`Open article: ${blog.title}`}
      >
        {/* LEFT (50%) — Thumbnail Artwork (Cream Background, Exact 170:205 Framing) */}
        <div className="w-1/2 h-full overflow-hidden bg-[#FAF6F0] flex items-center justify-center relative">
          <ResponsiveImage
            src={blog.thumbnailUrl || fallbackThumbnail}
            alt={blog.title}
            priority={priority}
            width={340}
            height={205}
            aspectRatio="1/1"
            isBlog={true}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 240px"
            className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
            fallbackSrc={fallbackThumbnail}
            wrapperClassName="w-full h-full"
          />
        </div>

        {/* RIGHT (50%) — Blog Title at Top + Fixed Logo + Brand Text + Tagline */}
        <div className="w-1/2 h-full bg-white flex flex-col justify-between items-center px-2 py-2 sm:px-2.5 sm:py-2.5 lg:px-3 lg:py-3 text-center overflow-hidden border-l border-[#E8DDD0]">
          {/* 1. Blog title at the top (auto-fit font, never cut off with ellipsis) */}
          <div className="w-full flex items-start justify-center pt-0.5">
            <p className={`text-[#2B2521] ${titleFontSize} font-bold leading-[1.25] sm:leading-[1.3] line-clamp-4 text-center break-words`}>
              {displayTopic}
            </p>
          </div>

          {/* 2 & 3. Standardized JADMAA logo + branding + tagline below */}
          <div className="flex flex-col items-center justify-center my-auto py-0.5 sm:py-1">
            <img
              src={logoSrc}
              alt="JADMAA Varmakalai"
              className="h-[42px] sm:h-[48px] lg:h-[52px] w-auto max-w-[85%] object-contain transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
            <div className="mt-1 sm:mt-1.5 text-center leading-none">
              <div>
                <span className="text-[#2B2521] text-[8px] sm:text-[9px] lg:text-[9.5px] font-extrabold tracking-[0.14em] uppercase">
                  JADMAA{' '}
                </span>
                <span className="text-[#B12B2B] text-[8px] sm:text-[9px] lg:text-[9.5px] font-bold tracking-[0.14em] uppercase">
                  VARMAKALAI
                </span>
              </div>
              <p className="mt-0.5 sm:mt-1 text-[#5C5148] text-[6.5px] sm:text-[7.5px] lg:text-[8px] font-semibold tracking-[0.06em] uppercase">
                Ancient Power. Modern Training.
              </p>
            </div>
          </div>
        </div>
      </Link>

      {/* ── Lower content section (Standardized Heights for Row Uniformity) ── */}
      <div className="p-4 sm:p-5 flex flex-col flex-grow text-left">
        {/* Red blog title */}
        <h3 className="text-[16px] sm:text-[17.5px] font-bold text-[#B12B2B] leading-[1.35] mb-2 hover:text-[#8F2020] transition-colors line-clamp-2 min-h-[44px] sm:min-h-[48px]">
          <Link to={`/blog/${blog.slug}`}>
            {blog.title}
          </Link>
        </h3>

        {/* Meta — date + author */}
        <div className="text-[12px] text-[#7A6E65] leading-[1.4] mb-2.5 font-normal">
          <span>{formattedDate}</span>
          <span className="mx-1.5 text-[#E8DDD0]">|</span>
          <span>by {blog.author?.name || 'info@jadmaa.com'}</span>
        </div>

        {/* Excerpt */}
        <div className="text-[13px] text-[#5C5148] leading-[1.6] line-clamp-3 mb-4 flex-grow min-h-[60px]">
          {blog.excerpt || 'Read the full article to learn more about this topic.'}
        </div>

        {/* Read More Link & Action Bar */}
        <div className="mt-auto pt-2.5 flex items-center justify-between gap-2 border-t border-[#F5EFE6]">
          <Link
            to={`/blog/${blog.slug}`}
            className="inline-flex items-center text-[13px] font-semibold text-[#B12B2B] hover:text-[#8F2020] hover:underline transition-colors gap-1"
          >
            Read More <span aria-hidden="true">→</span>
          </Link>

          <div className="flex items-center gap-1.5">
            <ShareButton
              title={blog.title}
              url={`/blog/${blog.slug}`}
              text={blog.excerpt || blog.title}
              variant="icon"
              iconSize={14}
            />

            {isAdmin && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onEdit?.(blog);
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#B12B2B] hover:bg-[#8F2020] text-white text-[12px] font-semibold rounded-[6px] shadow-sm transition-colors cursor-pointer"
                  title="Edit blog in Blogger editor"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </button>
                {onDelete && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onDelete?.(blog);
                    }}
                    className="inline-flex items-center p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 text-[12px] rounded-[6px] transition-colors cursor-pointer"
                    title="Delete blog post"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
};
