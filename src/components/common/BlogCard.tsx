import React from 'react';
import { Link } from 'react-router-dom';
import type { BlogPost } from '../../lib/api/blogApi';
import { format } from 'date-fns';

interface BlogCardProps {
  blog: BlogPost;
}

/**
 * BlogCard — Premium JADMAA split-panel card.
 *
 * Upper visual section:
 *   LEFT  — Uploaded thumbnail (object-fit: cover, fills the panel fully).
 *   RIGHT — Blog title at top + smaller JADMAA logo at the bottom of the dark panel.
 *
 * Lower content section (unchanged from original):
 *   Red blog title link, date, author, excerpt, Read More →
 */
export const BlogCard: React.FC<BlogCardProps> = ({ blog }) => {
  const fallbackLogo = '/logo.png';

  return (
    <article className="bg-white border border-[#E8DDD0] rounded-[14px] overflow-hidden flex flex-col transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 group">
      {/* ── Upper visual split panel ─────────────────────────────────── */}
      <Link
        to={`/blog/${blog.slug}`}
        className="flex h-[188px] sm:h-[200px] overflow-hidden"
        aria-label={`Open article: ${blog.title}`}
      >
        {/* LEFT — Thumbnail */}
        <div className="w-[52%] shrink-0 overflow-hidden bg-[#FAF6F0]">
          <img
            src={blog.thumbnailUrl || fallbackLogo}
            alt={blog.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            onError={(e) => {
              const img = e.target as HTMLImageElement;
              if (img.src !== fallbackLogo) img.src = fallbackLogo;
            }}
          />
        </div>

        {/* RIGHT — Title + Logo on dark panel */}
        <div className="w-[48%] bg-[#1A1A1A] flex flex-col px-4 py-4 overflow-hidden">
          {/* Blog Title — top of panel */}
          <p className="text-white text-[12.5px] sm:text-[13.5px] font-semibold leading-[1.4] line-clamp-5 flex-1">
            {blog.title}
          </p>

          {/* JADMAA branding — bottom of panel, slightly smaller */}
          <div className="flex items-end justify-start mt-3 gap-2 shrink-0">
            {/* Logo with CSS filter to make it white on dark bg */}
            <img
              src={fallbackLogo}
              alt="JADMAA"
              style={{ filter: 'brightness(0) invert(1)', WebkitFilter: 'brightness(0) invert(1)' }}
              className="w-[42px] h-[42px] sm:w-[48px] sm:h-[48px] object-contain opacity-85"
              loading="lazy"
            />
            <div className="flex flex-col leading-[1.1]">
              <span className="text-white text-[9px] font-bold tracking-wider uppercase opacity-90">JADMAA</span>
              <span className="text-[#B12B2B] text-[8px] font-semibold tracking-wider uppercase">Varmakalai</span>
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
          <span>{format(new Date(blog.createdAt), 'MMMM dd, yyyy')}</span>
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
