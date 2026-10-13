import React, { useState, useEffect } from 'react';
import { SEO } from '../components/common/SEO';
import { BlogCard } from '../components/common/BlogCard';
import { blogApi } from "../lib/api/blogApi";
import type { BlogPost } from '../lib/api/blogApi';

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
        <section className="bg-jadmaa-cream py-12 border-b border-jadmaa-border text-left">
          <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 space-y-3">
            <span className="text-base md:text-lg font-bold text-jadmaa-red uppercase tracking-wider block">
              Articles &amp; Insights
            </span>
            <h2 className="font-heading font-medium text-3xl sm:text-4xl lg:text-5xl text-jadmaa-charcoal">
              Varmakalai Blog
            </h2>
            <p className="text-base md:text-lg text-jadmaa-textMuted max-w-2xl">
              Insights on Varmakalai (Varma Kalai) martial arts training, self-defence, and traditional Varma treatment — from the JADMAA Varmakalai team.
            </p>
          </div>
        </section>

        {/* Blog Posts Section */}
        <section className="py-12 bg-white border-b border-jadmaa-border min-h-screen">
          <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12">
          {loading ? (
            <div className="text-center py-20 text-[#7A6E65]">Loading articles...</div>
          ) : error && blogs.length === 0 ? (
            <div className="text-center py-20 text-[#B12B2B]">Error: {error}</div>
          ) : blogs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {blogs.map(blog => (
                <BlogCard key={blog.id} blog={blog} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-[14px] border border-[#E8DDD0]">
              <h3 className="font-bold text-xl text-[#2B2521] mb-2">No articles yet</h3>
              <p className="text-[15px] text-[#7A6E65]">Check back soon for new insights and stories.</p>
            </div>
          )}
          </div>
        </section>
      </div>
    </>
  );
};
