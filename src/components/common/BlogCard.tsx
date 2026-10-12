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
 *   RIGHT — Blog title at the top + smaller JADMAA logo positioned below the title.
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

        {/* RIGHT — Title + Logo */}
        <div className="w-[48%] bg-[#1A1A1A] flex flex-col justify-between px-4 py-4 overflow-hidden">
          {/* Blog Title */}
          <p className="text-white text-[13px] sm:text-[14px] font-semibold leading-[1.45] line-clamp-5 pr-1">
            {blog.title}
          </p>

          {/* JADMAA Logo — smaller, pushed slightly down toward bottom */}
          <div className="flex items-end justify-end mt-2 shrink-0">
            <img
              src={fallbackLogo}
              alt="JADMAA Varmakalai"
              className="w-[54px] h-[54px] sm:w-[60px] sm:h-[60px] object-contain opacity-90 brightness-0 invert"
              loading="lazy"
            />
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
