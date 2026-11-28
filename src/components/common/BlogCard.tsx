import React from 'react';
import { Link } from 'react-router-dom';
import type { BlogPost } from '../../lib/api/blogApi';
import { format } from 'date-fns';
import { ResponsiveImage } from './ResponsiveImage';
import { ShareButton } from './ShareButton';
import { ArrowRight, Edit, Trash2 } from 'lucide-react';

interface BlogCardProps {
  blog: BlogPost;
  isAdmin?: boolean;
  priority?: boolean;
  onEdit?: (blog: BlogPost) => void;
  onDelete?: (blog: BlogPost) => void;
  className?: string;
}

export const BlogCard: React.FC<BlogCardProps> = ({
  blog,
  isAdmin,
  priority = false,
  onEdit,
  onDelete,
  className = '',
}) => {
  const fallbackThumbnail = '/images/course-basic.jpg';
  const logoSrc = '/logo.png';

  // Format date safely
  const formattedDate = (() => {
    try {
      return format(new Date(blog.createdAt), 'MMM dd, yyyy');
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
        // Fallback
      }
    }
    return rawTitle.slice(0, 50).trim();
  })();
  const displayTopic = displayTitle;

  const titleLength = displayTopic.length;
  const titleFontSize = React.useMemo(() => {
    if (titleLength <= 24) return 'text-[11.5px] sm:text-[12.5px] lg:text-[13px]';
    if (titleLength <= 36) return 'text-[10px] sm:text-[11px] lg:text-[11.5px]';
    return 'text-[9px] sm:text-[9.5px] lg:text-[10px]';
  }, [titleLength]);

  return (
    <article className={`bg-white border border-[#E8DDD0] rounded-2xl overflow-hidden flex flex-col shadow-[0_4px_16px_rgba(43,37,33,0.05)] hover:shadow-[0_12px_28px_rgba(177,43,43,0.09)] hover:border-[#B12B2B]/30 transition-all duration-300 group relative w-full h-full ${className}`}>
      {/* ── Unified 1:1 Square Image Frame ── */}
      <Link
        to={`/blog/${blog.slug}`}
        className="flex aspect-square w-full overflow-hidden border-b border-[#E8DDD0] bg-[#FAF6F0]"
        aria-label={`Open article: ${blog.title}`}
      >
        {/* LEFT (50%) — Thumbnail Artwork */}
        <div className="w-1/2 h-full overflow-hidden bg-[#FAF6F0] flex items-center justify-center relative">
          <ResponsiveImage
            src={blog.thumbnailUrl || fallbackThumbnail}
            alt={blog.title}
            priority={priority}
            width={340}
            height={205}
            aspectRatio="1/1"
            isBlog={true}
            sizes="(max-width: 640px) 40vw, (max-width: 1024px) 25vw, 220px"
            className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
            fallbackSrc={fallbackThumbnail}
            wrapperClassName="w-full h-full"
          />
        </div>

        {/* RIGHT (50%) — Brand Header + Title + Logo */}
        <div className="w-1/2 h-full bg-white flex flex-col justify-between items-center px-1.5 py-1.5 sm:px-2.5 sm:py-2 text-center overflow-hidden border-l border-[#E8DDD0]">
          {/* 1. Blog title at the top */}
          <div className="w-full flex items-start justify-center pt-0.5">
            <p className={`text-[#2B2521] ${titleFontSize} font-bold leading-[1.2] sm:leading-[1.25] line-clamp-3 text-center break-words`}>
              {displayTopic}
            </p>
          </div>

          {/* 2 & 3. Standardized JADMAA logo + branding below */}
          <div className="flex flex-col items-center justify-center my-auto py-0.5">
            <img
              src={logoSrc}
              alt="JADMAA Varmakalai"
              className="h-[34px] sm:h-[40px] lg:h-[44px] w-auto max-w-[85%] object-contain transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
            <div className="mt-0.5 text-center leading-none">
              <div>
                <span className="text-[#2B2521] text-[7.5px] sm:text-[8.5px] font-extrabold tracking-[0.14em] uppercase">
                  JADMAA{' '}
                </span>
                <span className="text-[#B12B2B] text-[7.5px] sm:text-[8.5px] font-bold tracking-[0.14em] uppercase">
                  VARMAKALAI
                </span>
              </div>
              <p className="mt-0.5 text-[#5C5148] text-[6px] sm:text-[7px] font-semibold tracking-[0.05em] uppercase">
                Ancient Power. Modern Training.
              </p>
            </div>
          </div>
        </div>
      </Link>

      {/* ── Lower content section (p-4) ── */}
      <div className="p-4 flex flex-col flex-1 text-left justify-between gap-2">
        <div>
          {/* Title */}
          <Link to={`/blog/${blog.slug}`} className="block group-hover:text-[#8F2020] transition-colors">
            <h3 className="text-base sm:text-lg font-bold text-[#2B2521] leading-snug line-clamp-2">
              {blog.title}
            </h3>
          </Link>

          {/* Meta — date + author */}
          <div className="text-sm text-[#5C5148] leading-[1.4] mt-1 font-normal flex items-center gap-1.5 truncate">
            <span>{formattedDate}</span>
            <span className="text-[#E8DDD0]">•</span>
            <span className="truncate">{blog.author?.name || 'JADMAA Gurukulam'}</span>
          </div>

          {/* Excerpt */}
          {blog.excerpt && (
            <p className="line-clamp-2 text-sm text-[#5C5148] leading-relaxed mt-1.5">
              {blog.excerpt}
            </p>
          )}
        </div>

        {/* Action Row */}
        <div className="pt-2 border-t border-[#F5EFE6] flex items-center justify-between gap-2 mt-auto">
          <Link
            to={`/blog/${blog.slug}`}
            className="inline-flex items-center text-xs font-semibold text-[#B12B2B] hover:text-[#8F2020] hover:underline transition-colors gap-1"
          >
            <span>Read Article</span>
            <ArrowRight className="w-3 h-3" />
          </Link>

          <div className="flex items-center gap-1">
            <ShareButton
              title={blog.title}
              url={`/blog/${blog.slug}`}
              variant="icon"
              iconSize={13}
              className="w-7 h-7"
            />

            {isAdmin && (
              <div className="flex items-center gap-1 ml-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onEdit?.(blog);
                  }}
                  className="p-1.5 bg-[#B12B2B] hover:bg-[#8F2020] text-white rounded-md shadow-2xs transition-colors cursor-pointer"
                  title="Edit blog"
                >
                  <Edit className="w-3 h-3" />
                </button>
                {onDelete && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onDelete?.(blog);
                    }}
                    className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                    title="Delete blog"
                  >
                    <Trash2 className="w-3 h-3" />
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
