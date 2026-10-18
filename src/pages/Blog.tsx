import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SEO } from '../components/common/SEO';
import { BlogCard } from '../components/common/BlogCard';
import { blogApi } from "../lib/api/blogApi";
import type { BlogPost } from '../lib/api/blogApi';
import { useAuth } from '../context/AuthContext';
import { FileText } from 'lucide-react';

export const Blog: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const canManageBlogs = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || (user as any)?.isAdmin === true;

  const [blogs, setBlogs] = useState<BlogPost[]>(() => blogApi.getCachedBlogs());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchBlogs = async () => {
    try {
      const data = await blogApi.getBlogs(canManageBlogs);
      if (Array.isArray(data)) {
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

  useEffect(() => {
    fetchBlogs();
  }, [canManageBlogs]);

  const handleDeletePost = async (blog: BlogPost) => {
    if (confirm(`Are you sure you want to delete "${blog.title}"?`)) {
      try {
        await blogApi.deleteBlog(blog.id);
        setBlogs(prev => prev.filter(b => b.id !== blog.id));
      } catch (err: any) {
        alert(err.message || 'Error deleting post');
      }
    }
  };

  return (
    <>
      <SEO 
        title="Varmakalai Blog | Martial Arts & Varma Treatment Insights"
        description="Read Varmakalai (Varma Kalai) articles, martial arts training tips, and traditional Varma treatment guides from JADMAA Varmakalai."
      />

      <div className="bg-[#FAF6F0] min-h-screen text-left text-[#2B2521]">
        {/* Header Container */}
        <section className="bg-jadmaa-cream py-12 border-b border-jadmaa-border text-left" data-aos="fade-up">
          <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3">
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

            {/* Admin / Super Admin Manage Blogs Button */}
            {canManageBlogs && (
              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() => navigate('/admin#blogs')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#B12B2B] hover:bg-[#8F2020] text-white text-sm font-bold rounded-lg shadow-md transition-all hover:shadow-lg cursor-pointer"
                  title="Manage blog posts in Admin panel"
                >
                  <FileText className="w-4 h-4" />
                  <span>Manage Blogs</span>
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Blog Posts Grid Section */}
        <section className="py-12 bg-white border-b border-jadmaa-border min-h-screen">
          <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12">
            {loading && blogs.length === 0 ? (
              <div className="text-center py-20 text-[#7A6E65]">Loading articles...</div>
            ) : error && blogs.length === 0 ? (
              <div className="text-center py-20 text-[#B12B2B]">Error: {error}</div>
            ) : blogs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-aos="fade-up">
                {blogs.map((blog, idx) => (
                  <div key={blog.id} data-aos="fade-up" data-aos-delay={(idx % 3) * 100}>
                    <BlogCard 
                      blog={blog} 
                      isAdmin={canManageBlogs}
                      onEdit={() => navigate('/admin#blogs')}
                      onDelete={handleDeletePost}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-white rounded-[14px] border border-[#E8DDD0]">
                <h3 className="font-bold text-xl text-[#2B2521] mb-2">No articles yet</h3>
                <p className="text-[15px] text-[#7A6E65]">Check back soon for new insights and stories.</p>
                {canManageBlogs && (
                  <button
                    onClick={() => navigate('/admin#blogs')}
                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[#B12B2B] text-white text-xs font-bold rounded-lg hover:bg-[#8F2020] transition cursor-pointer"
                  >
                    Go to Manage Blogs
                  </button>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  );
};
