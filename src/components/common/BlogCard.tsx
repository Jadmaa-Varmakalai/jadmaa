import React from 'react';
import { Link } from 'react-router-dom';
import type { BlogPost } from '../../lib/api/blogApi';
import { format } from 'date-fns';
import { BlogCoverTemplate } from './BlogCoverTemplate';

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

  return (
    <article className="bg-white border border-[#E8DDD0] rounded-[14px] overflow-hidden flex flex-col transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 group relative">
      {/* ── Upper visual split panel (1:1 Template, Never Cropped) ───── */}
      <Link
        to={`/blog/${blog.slug}`}
        className="block w-full overflow-hidden"
        aria-label={`Open article: ${blog.title}`}
      >
        <BlogCoverTemplate
          title={blog.title}
          imageUrl={blog.thumbnailUrl}
          priority={priority}
          isInsideBlog={false}
          className="border-0 border-b border-[#E8DDD0]"
        />
      </Link>

      {/* ── Lower content section ────────────────────────────────────── */}
      <div className="p-5 flex flex-col flex-grow text-left">
        {/* Red blog title */}
        <h3 className="text-[17px] sm:text-[18px] font-bold text-[#B12B2B] leading-[1.35] mb-2 hover:text-[#8F2020] transition-colors line-clamp-3">
          <Link to={`/blog/${blog.slug}`}>
            {displayTitle}
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
