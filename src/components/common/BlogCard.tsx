import React from 'react';
import { Link } from 'react-router-dom';
import type { BlogPost } from '../../lib/api/blogApi';
import { format } from 'date-fns';

interface BlogCardProps {
  blog: BlogPost;
  isAdmin?: boolean;
  onEdit?: (blog: BlogPost) => void;
  onDelete?: (blog: BlogPost) => void;
}

/**
 * BlogCard — Unified JADMAA LMS Blog Card Component.
 *
 * Upper visual section (Split 50/50):
 *   LEFT  (50%) — Cream-colored panel displaying the thumbnail
 *                 (object-fit: cover, clean cropping, zero distortion).
 *   RIGHT (50%) — Original white background containing:
 *                 1. Blog topic/title at the top (clean, readable, auto-wrapping)
 *                 2. Fixed JADMAA logo below (reduced ~20-25%, centered)
 *                 3. Fixed "JADMAA VARMAKALAI" branding beneath the logo
 *
 * Lower content section:
 *   - Red blog title link
 *   - Publication date & author
 *   - Short description / excerpt
 *   - "Read More →" link
 *   - Admin Action Toolbar (Edit / Delete) if isAdmin is true
 */
export const BlogCard: React.FC<BlogCardProps> = ({ blog, isAdmin, onEdit, onDelete }) => {
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

  const displayTopic = blog.topic || blog.title;

  return (
    <article className="bg-white border border-[#E8DDD0] rounded-[14px] overflow-hidden flex flex-col transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 group relative">
      {/* ── Upper visual split panel ─────────────────────────────────── */}
      <Link
        to={`/blog/${blog.slug}`}
        className="flex h-[195px] sm:h-[205px] overflow-hidden border-b border-[#E8DDD0]"
        aria-label={`Open article: ${blog.title}`}
      >
        {/* LEFT — Thumbnail Artwork (Cream Background) */}
        <div className="w-1/2 overflow-hidden bg-[#FAF6F0] flex items-center justify-center relative">
          <img
            src={blog.thumbnailUrl || fallbackThumbnail}
            alt={blog.title}
            className="w-full h-full object-cover object-left transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            onError={(e) => {
              const img = e.target as HTMLImageElement;
              if (img.src !== fallbackThumbnail) {
                img.src = fallbackThumbnail;
              }
            }}
          />
        </div>

        {/* RIGHT — Blog Topic/Title at Top + Fixed Smaller Logo + Brand Text */}
        <div className="w-1/2 bg-white flex flex-col justify-between items-center px-3.5 py-3.5 sm:px-4 sm:py-4 text-center overflow-hidden border-l border-[#E8DDD0]">
          {/* 1. Blog topic/title at the top */}
          <div className="w-full flex items-start justify-center pt-0.5">
            <p className="text-[#2B2521] text-[12px] sm:text-[13px] font-bold leading-[1.35] line-clamp-2 sm:line-clamp-3 text-center">
              {displayTopic}
            </p>
          </div>

          {/* 2 & 3. Smaller fixed JADMAA logo (reduced 20-25%) + branding below */}
          <div className="flex flex-col items-center justify-center my-auto pt-1 pb-0.5">
            <img
              src={logoSrc}
              alt="JADMAA Varmakalai"
              className="h-[68px] sm:h-[76px] w-auto max-w-[85%] object-contain transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
            <div className="mt-1.5 text-center leading-none">
              <span className="text-[#2B2521] text-[9.5px] sm:text-[10px] font-extrabold tracking-[0.14em] uppercase">
                JADMAA{' '}
              </span>
              <span className="text-[#B12B2B] text-[9.5px] sm:text-[10px] font-bold tracking-[0.14em] uppercase">
                VARMAKALAI
              </span>
            </div>
          </div>
        </div>
      </Link>

      {/* ── Lower content section ────────────────────────────────────── */}
      <div className="p-5 flex flex-col flex-grow text-left">
        {/* Red blog title */}
        <h3 className="text-[17px] sm:text-[18px] font-bold text-[#B12B2B] leading-[1.35] mb-2 hover:text-[#8F2020] transition-colors line-clamp-2">
          <Link to={`/blog/${blog.slug}`}>
            {blog.title}
          </Link>
        </h3>

        {/* Meta — date + author */}
        <div className="text-[12px] text-[#7A6E65] leading-[1.4] mb-3 font-normal">
          <span>{formattedDate}</span>
          <span className="mx-1.5 text-[#E8DDD0]">|</span>
          <span>by {blog.author?.name || 'info@jadmaa.com'}</span>
        </div>

        {/* Excerpt */}
        <div className="text-[13px] text-[#5C5148] leading-[1.65] line-clamp-3 mb-4 flex-grow">
          {blog.excerpt || 'Read the full article to learn more about this topic.'}
        </div>

        {/* Read More Link & Admin Action Bar */}
        <div className="mt-auto pt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-[#F5EFE6]">
          <Link
            to={`/blog/${blog.slug}`}
            className="inline-flex items-center text-[13px] font-semibold text-[#B12B2B] hover:text-[#8F2020] hover:underline transition-colors gap-1"
          >
            Read More <span aria-hidden="true">→</span>
          </Link>

          {isAdmin && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onEdit?.(blog);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#B12B2B] hover:bg-[#8F2020] text-white text-[12px] font-semibold rounded-[6px] shadow-sm transition-colors cursor-pointer"
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
                  className="inline-flex items-center px-2 py-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 text-[12px] rounded-[6px] transition-colors cursor-pointer"
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
    </article>
  );
};
