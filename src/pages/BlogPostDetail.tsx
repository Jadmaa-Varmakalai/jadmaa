import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { SEO } from '../components/common/SEO';
import { BlogCard } from '../components/common/BlogCard';
import { blogApi } from "../lib/api/blogApi";
import type { BlogPost } from '../lib/api/blogApi';
import ReactMarkdown from 'react-markdown';

interface FaqItem {
  question: string;
  answer: string;
}

export const BlogPostDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [blog, setBlog] = useState<BlogPost | null>(() => {
    if (!slug) return null;
    const cached = blogApi.getCachedBlogs();
    return cached.find(b => b.slug === slug || b.id === slug) || null;
  });
  const [allBlogs, setAllBlogs] = useState<BlogPost[]>(() => blogApi.getCachedBlogs());
  const [loading, setLoading] = useState<boolean>(() => {
    if (!slug) return true;
    const cached = blogApi.getCachedBlogs();
    return !cached.some(b => b.slug === slug || b.id === slug);
  });
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        if (!slug) return;
        const [data, list] = await Promise.all([
          blogApi.getBlogBySlug(slug),
          blogApi.getBlogs()
        ]);
        if (data) setBlog(data);
        if (list && list.length > 0) setAllBlogs(list);
      } catch (err: any) {
        if (!blog) {
          setError(err.message || 'Article not found');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchBlog();
  }, [slug]);

  // Extract FAQ items if present
  const faqs: FaqItem[] = useMemo(() => {
    if (!blog || !(blog as any).faq) return [];
    const rawFaq = (blog as any).faq as string;
    const items: FaqItem[] = [];
    const regex = /<h3[^>]*>(.*?)<\/h3>[\s\S]*?<p[^>]*>(.*?)<\/p>/g;
    let match;
    while ((match = regex.exec(rawFaq)) !== null) {
      items.push({
        question: match[1].replace(/&#8217;/g, "'").replace(/&amp;/g, '&').trim(),
        answer: match[2].replace(/&#8217;/g, "'").replace(/&amp;/g, '&').replace(/&mdash;/g, '—').trim()
      });
    }
    return items;
  }, [blog]);

  // Previous and Next Post
  const { prevPost, nextPost } = useMemo(() => {
    if (!blog || allBlogs.length === 0) return { prevPost: null, nextPost: null };
    const currentIndex = allBlogs.findIndex(b => b.slug === blog.slug || b.id === blog.id);
    if (currentIndex === -1) return { prevPost: null, nextPost: null };

    const prev = currentIndex > 0 ? allBlogs[currentIndex - 1] : null;
    const next = currentIndex < allBlogs.length - 1 ? allBlogs[currentIndex + 1] : null;
    return { prevPost: prev, nextPost: next };
  }, [blog, allBlogs]);

  // Related Blogs (excluding current post)
  const relatedBlogs = useMemo(() => {
    if (!blog || allBlogs.length <= 1) return [];
    return allBlogs
      .filter(b => b.slug !== blog.slug && b.id !== blog.id)
      .slice(0, 3);
  }, [blog, allBlogs]);

  // Clean HTML check
  const isHtmlContent = useMemo(() => {
    if (!blog?.content) return false;
    return /<[a-z][\s\S]*>/i.test(blog.content);
  }, [blog?.content]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF6F0] pt-20 pb-20 text-center text-[#7A6E65]">
        Loading article...
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="min-h-screen bg-[#FAF6F0] pt-20 pb-20 text-center px-4">
        <h2 className="text-2xl font-bold text-[#2B2521] mb-4">{error || 'Article not found'}</h2>
        <Link to="/blog" className="text-[#B12B2B] hover:underline text-sm font-semibold">
          ← Back to Blog
        </Link>
      </div>
    );
  }

  return (
    <>
      <SEO 
        title={`${blog.title} | JADMAA Varmakalai`}
        description={blog.excerpt || `Read ${blog.title} on the JADMAA Varmakalai blog.`}
      />

      <div className="bg-[#FAF6F0] min-h-screen py-10 px-4 sm:px-6">
        <div className="max-w-[1100px] mx-auto">
          {/* Main Article Container */}
          <main className="max-w-[800px] mx-auto">
            <article className="bg-white rounded-none sm:rounded-[4px] p-6 sm:p-10 md:p-12 shadow-sm text-left">
              {/* Post Title */}
              <h1 className="text-[26px] sm:text-[32px] font-bold text-[#2B2521] leading-[1.25] mb-2 font-heading">
                {blog.title}
              </h1>

              {/* Post Meta */}
              <div className="text-[13px] text-[#046bd2] font-semibold leading-[1.45] mb-8 pb-4 border-b border-[#F0F0F0]">
                <span>By </span>
                <span className="hover:underline">{blog.author?.name || 'info@jadmaa.com'}</span>
                <span className="mx-1 text-[#7A6E65]"> / </span>
                <span className="text-[#046bd2]">
                  {new Date(blog.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </span>
              </div>

              {/* Article Body Content */}
              <div className="text-[16px] text-[#334155] leading-[1.8] space-y-5 font-normal">
                {isHtmlContent ? (
                  <div 
                    className="jadmaa-article-content"
                    dangerouslySetInnerHTML={{ __html: blog.content }}
                  />
                ) : (
                  <div className="prose max-w-none text-[#334155] leading-[1.8]">
                    <ReactMarkdown>{blog.content}</ReactMarkdown>
                  </div>
                )}
              </div>

              {/* FAQ Section */}
              {faqs.length > 0 && (
                <section className="mt-10 pt-8 border-t border-[#E8DDD0]">
                  <h2 className="text-[22px] sm:text-[25px] font-bold text-[#2B2521] mb-6 font-heading">
                    Frequently Asked Questions
                  </h2>
                  <div className="space-y-4">
                    {faqs.map((faq, idx) => (
                      <div 
                        key={idx}
                        className="bg-white border border-[#E8DDD0] rounded-[12px] p-5 sm:p-6"
                      >
                        <h3 className="text-[16px] font-bold text-[#B12B2B] mb-2">
                          {faq.question}
                        </h3>
                        <p className="text-[15px] text-[#2B2521] leading-[1.8] m-0">
                          {faq.answer}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </article>

            {/* Post Navigation (Previous / Next) */}
            {(prevPost || nextPost) && (
              <nav className="mt-8 pt-4 flex flex-col sm:flex-row justify-between gap-4 text-left" aria-label="Posts">
                {prevPost ? (
                  <Link 
                    to={`/blog/${prevPost.slug}`}
                    className="group flex-1 bg-white p-4 rounded-[4px] border border-[#E8DDD0] hover:border-[#B12B2B] transition-colors"
                  >
                    <span className="block text-[11px] uppercase tracking-wider text-[#7A6E65] font-semibold mb-1 group-hover:text-[#B12B2B]">
                      ← Previous Post
                    </span>
                    <span className="text-[14px] font-medium text-[#2B2521] group-hover:text-[#B12B2B] line-clamp-1">
                      {prevPost.title}
                    </span>
                  </Link>
                ) : <div className="flex-1" />}

                {nextPost && (
                  <Link 
                    to={`/blog/${nextPost.slug}`}
                    className="group flex-1 bg-white p-4 rounded-[4px] border border-[#E8DDD0] hover:border-[#B12B2B] transition-colors text-right"
                  >
                    <span className="block text-[11px] uppercase tracking-wider text-[#7A6E65] font-semibold mb-1 group-hover:text-[#B12B2B]">
                      Next Post →
                    </span>
                    <span className="text-[14px] font-medium text-[#2B2521] group-hover:text-[#B12B2B] line-clamp-1">
                      {nextPost.title}
                    </span>
                  </Link>
                )}
              </nav>
            )}
          </main>

          {/* Related Articles Section (BlogCard style) */}
          {relatedBlogs.length > 0 && (
            <section className="mt-14 pt-10 border-t border-[#E8DDD0] text-left">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <span className="text-[12px] font-bold text-[#B12B2B] uppercase tracking-wider block mb-1">
                    More Articles
                  </span>
                  <h2 className="text-[24px] sm:text-[28px] font-bold text-[#2B2521] font-heading">
                    Related Insights &amp; Stories
                  </h2>
                </div>
                <Link
                  to="/blog"
                  className="text-[13px] font-semibold text-[#B12B2B] hover:text-[#8F2020] hover:underline"
                >
                  View All Blogs →
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {relatedBlogs.map((item) => (
                  <BlogCard key={item.id} blog={item} />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  );
};
