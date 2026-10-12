import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '../components/common/SEO';
import { blogApi } from "../lib/api/blogApi";
import type { BlogPost } from '../lib/api/blogApi';
import { format } from 'date-fns';

export const Blog: React.FC = () => {
  const [blogs, setBlogs] = useState<BlogPost[]>(() => blogApi.getCachedBlogs());
  const [loading, setLoading] = useState(() => blogApi.getCachedBlogs().length === 0);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const data = await blogApi.getBlogs();
        if (data && data.length > 0) {
          setBlogs(data);
        }
      } catch (err: any) {
        if (blogs.length === 0) {
          setError(err.message || 'Failed to load blogs');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchBlogs();
  }, []);

  return (
    <>
      <SEO 
        title="Varmakalai Blog | Martial Arts & Varma Treatment Insights"
        description="Read Varmakalai (Varma Kalai) articles, martial arts training tips, and traditional Varma treatment guides from JADMAA Varmakalai."
      />

      <div className="bg-[#FAF6F0] min-h-screen text-left text-[#2B2521]">
        {/* Header Container */}
        <section className="pt-10 pb-6 px-4 sm:px-6 lg:px-8 max-w-[1200px] mx-auto">
          <h1 className="text-[32px] sm:text-[40px] font-bold text-[#2B2521] leading-[1.2] mb-3">
            Varmakalai Blog
          </h1>
          <p className="text-[15px] sm:text-[16px] text-[#5C5148] leading-[1.6] max-w-[900px]">
            Insights on Varmakalai (Varma Kalai) martial arts training, self-defence, and traditional Varma treatment — from the JADMAA Varmakalai team.
          </p>
        </section>

        {/* Blog Posts Section */}
        <section className="pb-20 px-4 sm:px-6 lg:px-8 max-w-[1200px] mx-auto">
          {loading ? (
            <div className="text-center py-20 text-[#7A6E65]">Loading articles...</div>
          ) : error && blogs.length === 0 ? (
            <div className="text-center py-20 text-[#B12B2B]">Error: {error}</div>
          ) : blogs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {blogs.map(blog => (
                <article 
                  key={blog.id} 
                  className="bg-white border border-[#E8DDD0] rounded-[14px] overflow-hidden flex flex-col transition-all duration-300 hover:shadow-md"
                >
                  {/* Thumbnail */}
                  {blog.thumbnailUrl && (
                    <Link to={`/blog/${blog.slug}`} className="block overflow-hidden aspect-[16/9] bg-[#FAF6F0]">
                      <img 
                        src={blog.thumbnailUrl} 
                        alt={blog.title} 
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                        loading="lazy"
                      />
                    </Link>
                  )}

                  {/* Post Content */}
                  <div className="p-6 flex flex-col flex-grow">
                    <h3 className="text-[19px] sm:text-[20px] font-bold text-[#B12B2B] leading-[1.3] mb-2 hover:text-[#8F2020] transition-colors">
                      <Link to={`/blog/${blog.slug}`}>
                        {blog.title}
                      </Link>
                    </h3>

                    {/* Meta */}
                    <div className="text-[12px] text-[#7A6E65] leading-[1.4] mb-3 font-normal">
                      <span>{format(new Date(blog.createdAt), 'MMMM dd, yyyy')}</span>
                      <span className="mx-1.5 text-[#E8DDD0]">|</span>
                      <span>by {blog.author?.name || 'info@jadmaa.com'}</span>
                    </div>

                    {/* Excerpt */}
                    <div className="text-[14px] text-[#5C5148] leading-[1.6] line-clamp-3 mb-5">
                      {blog.excerpt || 'Read the full article to learn more about this topic.'}
                    </div>

                    {/* Read More Link */}
                    <div className="mt-auto pt-2">
                      <Link 
                        to={`/blog/${blog.slug}`}
                        className="inline-flex items-center text-[13px] font-medium text-[#B12B2B] hover:text-[#8F2020] hover:underline transition-colors"
                      >
                        Read More →
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-[14px] border border-[#E8DDD0]">
              <h3 className="font-bold text-xl text-[#2B2521] mb-2">No articles yet</h3>
              <p className="text-[15px] text-[#7A6E65]">Check back soon for new insights and stories.</p>
            </div>
          )}
        </section>
      </div>
    </>
  );
};
