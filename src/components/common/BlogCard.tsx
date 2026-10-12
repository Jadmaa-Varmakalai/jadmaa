import React from 'react';
import { Link } from 'react-router-dom';
import type { BlogPost } from '../../lib/api/blogApi';
import { format } from 'date-fns';

interface BlogCardProps {
  blog: BlogPost;
}

/**
 * BlogCard — Unified JADMAA LMS Blog Card Component.
 *
 * Upper visual section (Split 50/50):
 *   LEFT  (50%) — Cream-colored panel displaying the admin-uploaded thumbnail
 *                 (object-fit: cover, clean cropping, zero distortion).
 *   RIGHT (50%) — Original white background containing:
 *                 1. Blog topic/title at the top (clean, readable, auto-wrapping)
 *                 2. Fixed JADMAA logo below (reduced ~20-25%, centered)
 *                 3. Fixed "JADMAA VARMAKALAI" branding beneath the logo
 *
 * Lower content section (Preserved):
 *   - Red blog title link
 *   - Publication date & author
 *   - Short description / excerpt
 *   - "Read More →" link
 */
export const BlogCard: React.FC<BlogCardProps> = ({ blog }) => {
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

  return (
    <article className="bg-white border border-[#E8DDD0] rounded-[14px] overflow-hidden flex flex-col transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 group">
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

        {/* RIGHT — Blog Title at Top + Fixed Smaller Logo + Brand Text */}
        <div className="w-1/2 bg-white flex flex-col justify-between items-center px-3.5 py-3.5 sm:px-4 sm:py-4 text-center overflow-hidden border-l border-[#E8DDD0]">
          {/* 1. Blog topic/title at the top */}
          <div className="w-full flex items-start justify-center pt-0.5">
            <p className="text-[#2B2521] text-[12px] sm:text-[13px] font-bold leading-[1.35] line-clamp-2 sm:line-clamp-3 text-center">
              {blog.title}
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
      <div className="p-5 flex flex-col flex-grow">
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

        {/* Read More Link */}
        <div className="mt-auto pt-1">
          <Link
            to={`/blog/${blog.slug}`}
            className="inline-flex items-center text-[13px] font-semibold text-[#B12B2B] hover:text-[#8F2020] hover:underline transition-colors gap-1"
          >
            Read More <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </article>
  );
};
