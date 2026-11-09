import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { SEO, buildArticleSchema } from '../components/common/SEO';
import { BlogCard } from '../components/common/BlogCard';
import { ImageCropModal } from '../components/common/ImageCropModal';
import { getOptimizedBlogThumbnail } from '../utils/imageUtils';
import { blogApi, cleanSlug } from "../lib/api/blogApi";
import type { BlogPost } from '../lib/api/blogApi';
import { useAuth } from '../context/AuthContext';
import ReactMarkdown from 'react-markdown';
import { Crop, Check, RotateCcw } from 'lucide-react';

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

  // Determine if this blog has an inside cropped image
  const isCropped = useMemo(() => {
    if (blog?.insideImageUrl && blog.insideImageUrl.trim()) return true;
    if (blog?.content && /<!--insideImage:.*?-->/.test(blog.content)) return true;
    return false;
  }, [blog]);

  // Inside banner image: use insideImageUrl if cropped, else fallback to original thumbnail
  const insideBannerUrl = useMemo(() => {
    if (blog?.insideImageUrl && blog.insideImageUrl.trim()) {
      return blog.insideImageUrl;
    }
    const match = blog?.content?.match(/<!--insideImage:(.*?)-->/);
    if (match && match[1]?.trim()) {
      return match[1].trim();
    }
    return featuredImageUrl;
  }, [blog, featuredImageUrl]);

  // Extract topic/category
  const displayTopic = useMemo(() => {
    if (!blog) return null;
    if ((blog as any).topic) return (blog as any).topic;
    const match = blog.content?.match(/^<!--topic:(.*?)-->\s*/);
    return match ? match[1] : null;
  }, [blog]);

  // Handle saving newly cropped or adjusted image (AFFECTS ONLY INSIDE BLOG IMAGE, NOT CARD THUMBNAIL)
  const handleSaveCrop = async (newUrl: string) => {
    if (!blog) return;
    try {
      const res = await blogApi.updateBlogThumbnail(blog.id, newUrl, { insideOnly: true });
      const savedInside = (res as any)?.data?.insideImageUrl || (res as any)?.insideImageUrl || newUrl;
      setBlog((prev) => prev ? { ...prev, insideImageUrl: savedInside } : null);
      setCropSuccessMessage('Inside blog image cropped & saved!');
      setTimeout(() => setCropSuccessMessage(null), 4000);
    } catch (err: any) {
      console.warn('Failed to update blog with cropped image:', err);
      // Still update local state for immediate feedback
      setBlog((prev) => prev ? { ...prev, insideImageUrl: newUrl } : null);
      setCropSuccessMessage('Inside image updated in view.');
      setTimeout(() => setCropSuccessMessage(null), 4000);
    }
  };

  // Revert back to original uncropped image with blur fit
  const handleResetCrop = async () => {
    if (!blog) return;
    try {
      await blogApi.updateBlogThumbnail(blog.id, '', { insideOnly: true, resetCrop: true });
      setBlog((prev) => {
        if (!prev) return null;
        const cleaned = (prev.content || '').replace(/<!--insideImage:.*?-->\s*/g, '');
        return { ...prev, insideImageUrl: null, content: cleaned };
      });
      setCropSuccessMessage('Reverted to original uncropped image with blur fit.');
      setTimeout(() => setCropSuccessMessage(null), 4000);
    } catch (err: any) {
      console.warn('Failed to reset crop:', err);
      setBlog((prev) => prev ? { ...prev, insideImageUrl: null } : null);
    }
  };

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
        title={(blog as any).metaTitle || `${blog.title} | JADMAA Varmakalai`}
        description={(blog as any).metaDesc || blog.excerpt || blog.content.replace(/<[^>]+>/g, '').slice(0, 160)}
        keywords={(blog as any).keywords || 'varmakalai, varma therapy, traditional healing, martial arts'}
        image={insideBannerUrl || featuredImageUrl}
        url={`/blog/${encodeURIComponent(blog.slug)}`}
        type="article"
        schema={buildArticleSchema({
          title: blog.title,
          description: (blog as any).metaDesc || blog.excerpt || blog.content.replace(/<[^>]+>/g, '').slice(0, 160),
          slug: blog.slug,
          authorName: blog.author?.name || 'Aasan Bojagarajan',
          datePublished: blog.createdAt,
          dateModified: blog.updatedAt,
          imageUrl: insideBannerUrl || featuredImageUrl,
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

              {/* 2. Featured Image / Inside Banner */}
              {insideBannerUrl && (
                <div className="w-full mb-6 relative group/banner">
                  {/* Clean responsive image container maintaining identical 16:9 aspect ratio across all device layouts */}
                  <div className="w-full aspect-[16/9] overflow-hidden rounded-xl sm:rounded-2xl border border-[#E8DDD0] bg-[#FAF6F0] shadow-2xs relative flex items-center justify-center">
                    {/* Render ambient blurred backdrop ONLY if image is uncropped */}
                    {!isCropped && (
                      <img
                        src={insideBannerUrl}
                        alt=""
                        aria-hidden="true"
                        className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-40 scale-110 pointer-events-none select-none"
                      />
                    )}

                    {/* Main Image: uncropped uses object-contain; cropped fills cleanly with object-cover and NO blur backdrop */}
                    <img
                      key={insideBannerUrl}
                      src={insideBannerUrl}
                      alt={blog.title}
                      loading="eager"
                      decoding="async"
                      className={`w-full h-full ${
                        isCropped ? 'object-cover' : 'object-contain'
                      } object-center rounded-xl sm:rounded-2xl block transition-all duration-300 relative z-10`}
                    />
                  </div>

                  {/* Clean Crop Image Option Toolbar (Admins) */}
                  {canManage && (
                    <div className="mt-2.5 flex items-center justify-between gap-2 px-1">
                      {cropSuccessMessage ? (
                        <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1 animate-fade-in">
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{cropSuccessMessage}</span>
                        </span>
                      ) : (
                        <div />
                      )}

                      <div className="flex items-center gap-2">
                        {isCropped && (
                          <button
                            type="button"
                            onClick={handleResetCrop}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-[#FAF6F0] text-gray-600 hover:text-red-700 border border-gray-200 hover:border-red-300 rounded-lg text-xs font-semibold shadow-2xs transition cursor-pointer"
                            title="Reset to original uncropped image with blur fit"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Reset to Original</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setIsCropModalOpen(true)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-[#FAF6F0] text-[#7A2E2E] hover:text-[#B12B2B] border border-[#E8DDD0] hover:border-[#B12B2B] rounded-lg text-xs font-semibold shadow-2xs transition cursor-pointer"
                          title="Crop inside blog image without affecting blog card thumbnail"
                        >
                          <Crop className="w-3.5 h-3.5 text-[#B12B2B]" />
                          <span>{isCropped ? 'Re-Crop Inside Image' : 'Crop Image'}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 3. Blog Category, Author, and Publication Information */}
              <div className="flex flex-wrap items-center gap-2 text-[12px] sm:text-[13px] text-[#5C5148] font-medium leading-[1.45] mb-8 pb-4 border-b border-[#F0F0F0]">
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

              {/* 4. Blog Article Content */}
              <div className="text-[15px] sm:text-[16px] text-[#334155] leading-[1.8] space-y-5 font-normal">
                {isHtmlContent ? (
                  <div 
                    className="jadmaa-article-content"
                    dangerouslySetInnerHTML={{ __html: cleanedContent }}
                  />
                ) : (
                  <div className="prose max-w-none text-[#334155] leading-[1.8]">
                    <ReactMarkdown>{cleanedContent}</ReactMarkdown>
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

      {/* Interactive Crop & Position Modal */}
      {isCropModalOpen && featuredImageUrl && (
        <ImageCropModal
          isOpen={isCropModalOpen}
          imageUrl={featuredImageUrl}
          title={`Crop Featured Image: ${blog.title}`}
          aspectRatioPreset="16:9"
          onClose={() => setIsCropModalOpen(false)}
          onSave={handleSaveCrop}
        />
      )}
    </>
  );
};
