import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { SEO, buildArticleSchema } from '../components/common/SEO';
import { BlogCard } from '../components/common/BlogCard';
import { BlogCoverTemplate } from '../components/common/BlogCoverTemplate';
import { ShareButton } from '../components/common/ShareButton';
import { ItemReviewsSection } from '../components/common/ItemReviewsSection';
import { getOptimizedBlogThumbnail } from '../utils/imageUtils';
import { blogApi, cleanSlug } from "../lib/api/blogApi";
import type { BlogPost } from '../lib/api/blogApi';
import { useAuth } from '../context/AuthContext';
import ReactMarkdown from 'react-markdown';

interface FaqItem {
  question: string;
  answer: string;
}

export const BlogPostDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const canManage = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || (user as any)?.isAdmin === true;

  const [blog, setBlog] = useState<BlogPost | null>(() => {
    if (!slug) return null;
    const cached = blogApi.getCachedBlogs();
    const clean = cleanSlug(slug);
    const decoded = decodeURIComponent(slug).trim();
    return cached.find(b => 
      b.slug === slug || 
      b.slug === decoded || 
      b.id === slug || 
      (clean && clean.length > 0 && cleanSlug(b.slug) === clean)
    ) || null;
  });
  const [allBlogs, setAllBlogs] = useState<BlogPost[]>(() => blogApi.getCachedBlogs());
  const [loading, setLoading] = useState<boolean>(() => {
    if (!slug) return true;
    const cached = blogApi.getCachedBlogs();
    const clean = cleanSlug(slug);
    const decoded = decodeURIComponent(slug).trim();
    return !cached.some(b => 
      b.slug === slug || 
      b.slug === decoded || 
      b.id === slug || 
      (clean && clean.length > 0 && cleanSlug(b.slug) === clean)
    );
  });
  const [error, setError] = useState('');

  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [cropSuccessMessage, setCropSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        if (!slug) return;
        const [data, list] = await Promise.all([
          blogApi.getBlogBySlug(slug),
          blogApi.getBlogs()
        ]);
        if (data) {
          setBlog(data);
          // Canonical URL check: If accessed via legacy Tamil or percent-encoded slug, update browser URL smoothly
          if (data.slug && slug && slug !== data.slug && decodeURIComponent(slug) !== data.slug) {
            window.history.replaceState(null, '', `/blog/${data.slug}`);
          }
        }
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

  // Clean HTML check & stripped content (strip internal meta tags)
  const cleanedContent = useMemo(() => {
    if (!blog?.content) return '';
    return blog.content
      .replace(/^<!--topic:.*?-->\s*/, '')
      .replace(/^<!--insideImage:.*?-->\s*/, '')
      .replace(/<!--insideImage:.*?-->\s*/g, '');
  }, [blog?.content]);

  const isHtmlContent = useMemo(() => {
    if (!cleanedContent) return false;
    return /<[a-z][\s\S]*>/i.test(cleanedContent);
  }, [cleanedContent]);

  // Resolve featured image URL (authentic thumbnail assigned to the blog card)
  const featuredImageUrl = useMemo(() => {
    if (blog?.thumbnailUrl && blog.thumbnailUrl.trim()) {
      return blog.thumbnailUrl;
    }
    const slugCover = getOptimizedBlogThumbnail(blog?.slug || blog?.id || '');
    if (slugCover?.webp) {
      return slugCover.webp;
    }
    return '/images/course-basic.jpg';
  }, [blog]);

  // Extract topic/category
  const displayTopic = useMemo(() => {
    if (!blog) return null;
    if ((blog as any).topic) return (blog as any).topic;
    const match = blog.content?.match(/^<!--topic:(.*?)-->\s*/);
    return match ? match[1] : null;
  }, [blog]);

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
        title={(blog as any).metaTitle || `${blog.title} | JADMAA`}
        description={(blog as any).metaDesc || blog.excerpt || blog.content.replace(/<[^>]+>/g, '').slice(0, 160)}
        keywords={(blog as any).keywords || 'traditional martial arts, wellness, jadmaa article'}
        image={`https://jadmaa.com/api/v1/blogs/og-image/${encodeURIComponent(blog.slug)}.jpg`}
        url={`/blog/${encodeURIComponent(blog.slug)}`}
        type="article"
        schema={buildArticleSchema({
          title: blog.title,
          description: (blog as any).metaDesc || (blog.excerpt ? blog.excerpt.slice(0, 160) : '') || blog.content.replace(/<[^>]+>/g, '').slice(0, 160),
          slug: blog.slug,
          authorName: blog.author?.name || 'Aasan Bojagarajan',
          datePublished: blog.createdAt,
          dateModified: blog.updatedAt,
          imageUrl: `https://jadmaa.com/api/v1/blogs/og-image/${encodeURIComponent(blog.slug)}.jpg`,
        })}
      />

      <div className="bg-[#FAF6F0] min-h-screen py-8 sm:py-12 px-3 sm:px-6">
        <div className="max-w-[1100px] mx-auto">
          {/* Main Article Container */}
          <main className="max-w-[840px] mx-auto">
            <article className="bg-white rounded-xl sm:rounded-2xl p-5 sm:p-9 md:p-12 shadow-sm border border-[#E8DDD0] text-left" data-aos="fade-up">
              
              {/* 1. Blog Title */}
              <h1 className="text-[26px] sm:text-[34px] md:text-[38px] font-bold text-[#2B2521] leading-[1.25] mb-5 sm:mb-6 font-heading">
                {blog.title}
              </h1>

              {/* 2. Featured Image / Inside Banner — Unified 1:1 BlogCard Template (Never Cropped) */}
              {featuredImageUrl && (
                <div className="w-full mb-6">
                  <BlogCoverTemplate
                    title={blog.title}
                    imageUrl={featuredImageUrl}
                    priority={true}
                  />
                </div>
              )}

              {/* 3. Blog Category, Author, and Publication Information */}
              <div className="flex flex-wrap items-center justify-between gap-3 text-[12px] sm:text-[13px] text-[#5C5148] font-medium leading-[1.45] mb-8 pb-4 border-b border-[#F0F0F0]">
                <div className="flex flex-wrap items-center gap-2">
                  {displayTopic && (
                    <>
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#B12B2B]/10 text-[#B12B2B] font-bold text-[11px] uppercase tracking-wider">
                        {displayTopic}
                      </span>
                      <span className="text-[#E8DDD0]">•</span>
                    </>
                  )}
                  <span>By <strong className="text-[#2B2521] font-semibold">{blog.author?.name || 'info@jadmaa.com'}</strong></span>
                  <span className="text-[#E8DDD0]">•</span>
                  <time dateTime={blog.createdAt} className="text-[#7A6E65]">
                    {new Date(blog.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </time>
                </div>
                <ShareButton
                  title={blog.title}
                  url={`/blog/${encodeURIComponent(blog.slug)}`}
                  variant="pill"
                  buttonText="Share"
                />
              </div>

              {/* 4. Blog Article Content (Plain-Text Body + Contact Details Template) */}
              <div className="text-[15px] sm:text-[16px] text-[#334155] leading-[1.8] space-y-6 font-normal">
                {blog.excerpt && blog.excerpt.trim() && (
                  <div className="whitespace-pre-line text-[#334155] leading-[1.85]">
                    {blog.excerpt}
                  </div>
                )}

                {cleanedContent && (
                  isHtmlContent ? (
                    <div 
                      className="jadmaa-article-content pt-4 border-t border-[#F0F0F0]"
                      dangerouslySetInnerHTML={{ __html: cleanedContent }}
                    />
                  ) : (
                    <div className="prose max-w-none text-[#334155] leading-[1.8] pt-4 border-t border-[#F0F0F0]">
                      <ReactMarkdown>{cleanedContent}</ReactMarkdown>
                    </div>
                  )
                )}
              </div>

              {/* Bottom Follow Us Social Bar */}
              <div className="mt-8 pt-6 border-t border-[#F0F0F0] flex flex-row items-center justify-between gap-4">
                <span className="text-xs font-bold uppercase tracking-wider text-[#2B2521]">
                  Follow Us On:
                </span>
                <div className="flex items-center gap-2.5">
                  {/* Instagram */}
                  <a
                    href="https://www.instagram.com/jadmaavarmakalai/"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Instagram"
                    className="w-8 h-8 rounded-full bg-[#3E352F] hover:bg-[#B12B2B] text-[#FAF6F0] flex items-center justify-center transition-colors shadow-2xs"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    </svg>
                  </a>

                  {/* Facebook */}
                  <a
                    href="https://www.facebook.com/profile.php?id=61591816677608"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Facebook"
                    className="w-8 h-8 rounded-full bg-[#3E352F] hover:bg-[#B12B2B] text-[#FAF6F0] flex items-center justify-center transition-colors shadow-2xs"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M9 8H6v4h3v12h5V12h3.642L18 8h-4V6.333C14 5.374 14.5 5 15.5 5H18V0h-3.808C10.592 0 9 1.583 9 4.615V8z" />
                    </svg>
                  </a>

                  {/* YouTube */}
                  <a
                    href="https://www.youtube.com/@JADMAAVarmakalai"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="YouTube"
                    className="w-8 h-8 rounded-full bg-[#3E352F] hover:bg-[#B12B2B] text-[#FAF6F0] flex items-center justify-center transition-colors shadow-2xs"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
                    </svg>
                  </a>

                  {/* WhatsApp */}
                  <a
                    href="https://whatsapp.com/channel/0029VbDzWmJKQuJDkFXMU03d"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="WhatsApp"
                    className="w-8 h-8 rounded-full bg-[#3E352F] hover:bg-[#B12B2B] text-[#FAF6F0] flex items-center justify-center transition-colors shadow-2xs"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                    </svg>
                  </a>
                </div>
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
                    className="group flex-1 bg-white p-4 rounded-xl border border-[#E8DDD0] hover:border-[#B12B2B] transition-colors shadow-2xs"
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
                    className="group flex-1 bg-white p-4 rounded-xl border border-[#E8DDD0] hover:border-[#B12B2B] transition-colors text-right shadow-2xs"
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

            {/* Reader Rating (Stars Only) */}
            <div className="mt-12">
              <ItemReviewsSection
                targetType="BLOG"
                targetId={blog.id}
                title="Rate This Article"
                starsOnly={true}
              />
            </div>
          </main>
        </div>
      </div>

      {/* 2. Related Articles Section in Dark Cream #F2EDE4 */}
      {relatedBlogs.length > 0 && (
        <section className="py-14 bg-[#F2EDE4] border-t border-[#E8DDD0] text-left">
          <div className="max-w-[1100px] mx-auto px-4 sm:px-6">
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

            {/* Mobile Peek-Carousel / Desktop Compact Grid */}
            <div className="flex overflow-x-auto snap-x snap-mandatory gap-3.5 sm:gap-5 pb-4 px-1 sm:px-0 no-scrollbar sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:overflow-visible">
              {relatedBlogs.map((item) => (
                <div key={item.id} className="w-[78vw] max-w-[295px] sm:w-auto sm:max-w-none shrink-0 snap-start flex justify-center">
                  <BlogCard blog={item} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}


    </>
  );
};
