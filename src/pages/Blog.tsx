import React, { useState, useEffect } from 'react';
import { SEO } from '../components/common/SEO';
import { BlogCard } from '../components/common/BlogCard';
import { blogApi } from "../lib/api/blogApi";
import type { BlogPost } from '../lib/api/blogApi';
import { useAuth } from '../context/AuthContext';
import { ImageUpload } from '../components/common/ImageUpload';
import ReactMarkdown from 'react-markdown';
import { 
  Plus, 
  Eye, 
  Code2, 
  Check, 
  X, 
  FileText, 
  Bold, 
  Italic, 
  Heading2, 
  Heading3, 
  List, 
  Link as LinkIcon, 
  Quote
} from 'lucide-react';

export const Blog: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [blogs, setBlogs] = useState<BlogPost[]>(() => blogApi.getCachedBlogs());
  const [loading, setLoading] = useState(() => blogApi.getCachedBlogs().length === 0);
  const [error, setError] = useState('');

  // Blogger-style Modal Editor State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<'compose' | 'preview'>('compose');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formTopic, setFormTopic] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formThumbnail, setFormThumbnail] = useState('');
  const [formExcerpt, setFormExcerpt] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formPublished, setFormPublished] = useState(true);

  const fetchBlogs = async () => {
    try {
      const data = await blogApi.getBlogs(isAdmin);
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

  useEffect(() => {
    fetchBlogs();
  }, [isAdmin]);

  const handleOpenNewPost = () => {
    setEditingId(null);
    setFormTitle('');
    setFormTopic('Varma Training');
    setFormSlug('');
    setFormThumbnail('/images/course-basic.jpg');
    setFormExcerpt('');
    setFormContent('<h2>Introduction</h2>\n<p>Start writing your article here...</p>');
    setFormPublished(true);
    setEditorMode('compose');
    setSaveSuccess(false);
    setIsEditorOpen(true);
  };

  const handleOpenEditPost = (blog: BlogPost) => {
    setEditingId(blog.id);
    setFormTitle(blog.title || '');
    setFormTopic(blog.topic || blog.title || '');
    setFormSlug(blog.slug || '');
    setFormThumbnail(blog.thumbnailUrl || '');
    setFormExcerpt(blog.excerpt || '');
    // Clean topic comment if present in raw content
    const cleanedContent = (blog.content || '').replace(/^<!--topic:.*?-->\s*/, '');
    setFormContent(cleanedContent);
    setFormPublished(blog.published ?? true);
    setEditorMode('compose');
    setSaveSuccess(false);
    setIsEditorOpen(true);
  };

  const handleCloseEditor = () => {
    if (isSaving) return;
    setIsEditorOpen(false);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFormTitle(val);
    if (!editingId && !formSlug) {
      setFormSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
    }
  };

  const handleSavePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      alert('Please enter a post title');
      return;
    }

    try {
      setIsSaving(true);
      const postData: Partial<BlogPost> = {
        title: formTitle.trim(),
        topic: formTopic.trim() || formTitle.trim(),
        slug: formSlug.trim() || formTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        thumbnailUrl: formThumbnail.trim() || null,
        excerpt: formExcerpt.trim() || null,
        content: formContent.trim(),
        published: formPublished
      };

      if (editingId) {
        await blogApi.updateBlog(editingId, postData);
      } else {
        await blogApi.createBlog(postData);
      }

      setSaveSuccess(true);
      await fetchBlogs();
      setTimeout(() => {
        setIsEditorOpen(false);
        setIsSaving(false);
      }, 600);
    } catch (err: any) {
      alert(err.message || 'Error saving post');
      setIsSaving(false);
    }
  };

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

  // Helper toolbar actions
  const insertFormatting = (syntaxBefore: string, syntaxAfter = '') => {
    setFormContent(prev => prev + `\n${syntaxBefore}Text${syntaxAfter}\n`);
  };

  return (
    <>
      <SEO 
        title="Varmakalai Blog | Martial Arts & Varma Treatment Insights"
        description="Read Varmakalai (Varma Kalai) articles, martial arts training tips, and traditional Varma treatment guides from JADMAA Varmakalai."
      />

      <div className="bg-[#FAF6F0] min-h-screen text-left text-[#2B2521]">
        {/* Header Container */}
        <section className="bg-jadmaa-cream py-12 border-b border-jadmaa-border text-left">
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

            {/* Admin Quick Action Button */}
            {isAdmin && (
              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={handleOpenNewPost}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#B12B2B] hover:bg-[#8F2020] text-white text-sm font-bold rounded-lg shadow-md transition-all hover:shadow-lg cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ New Blog Post</span>
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Blog Posts Grid Section */}
        <section className="py-12 bg-white border-b border-jadmaa-border min-h-screen">
          <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12">
            {loading ? (
              <div className="text-center py-20 text-[#7A6E65]">Loading articles...</div>
            ) : error && blogs.length === 0 ? (
              <div className="text-center py-20 text-[#B12B2B]">Error: {error}</div>
            ) : blogs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {blogs.map(blog => (
                  <BlogCard 
                    key={blog.id} 
                    blog={blog} 
                    isAdmin={isAdmin}
                    onEdit={handleOpenEditPost}
                    onDelete={handleDeletePost}
                  />
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

      {/* ── GOOGLE BLOGGER STYLE FULL-PAGE MODAL EDITOR ────────────────── */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex justify-center p-2 sm:p-4 md:p-6 animate-fadeIn">
          <div className="bg-[#FAF6F0] w-full max-w-[1300px] rounded-xl sm:rounded-2xl shadow-2xl border border-[#E8DDD0] flex flex-col my-auto max-h-[96vh] overflow-hidden">
            
            {/* Top Blogger Toolbar */}
            <header className="bg-white px-4 sm:px-6 py-3 border-b border-[#E8DDD0] flex items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                {/* Blogger Icon Badge */}
                <div className="w-8 h-8 rounded-lg bg-[#FF5722] text-white flex items-center justify-center font-bold text-base shadow-sm shrink-0">
                  B
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-[#2B2521] text-sm sm:text-base truncate">
                    {editingId ? `Editing: ${formTitle || 'Untitled Post'}` : 'New Post — Google Blogger Editor'}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-[#7A6E65]">
                    <span>{formPublished ? '● Published' : '○ Draft'}</span>
                    <span>•</span>
                    <span>JADMAA Varmakalai Blog</span>
                  </div>
                </div>
              </div>

              {/* Center Mode Switcher */}
              <div className="hidden sm:flex items-center bg-[#F5EFE6] rounded-lg p-0.5 border border-[#E8DDD0]">
                <button
                  type="button"
                  onClick={() => setEditorMode('compose')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                    editorMode === 'compose'
                      ? 'bg-white text-[#2B2521] shadow-sm'
                      : 'text-[#7A6E65] hover:text-[#2B2521]'
                  }`}
                >
                  <Code2 className="w-3.5 h-3.5" />
                  Compose
                </button>
                <button
                  type="button"
                  onClick={() => setEditorMode('preview')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                    editorMode === 'preview'
                      ? 'bg-white text-[#2B2521] shadow-sm'
                      : 'text-[#7A6E65] hover:text-[#2B2521]'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  Preview
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleCloseEditor}
                  disabled={isSaving}
                  className="px-3 py-1.5 text-xs font-semibold text-[#7A6E65] hover:text-[#2B2521] hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSavePost}
                  disabled={isSaving}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#B12B2B] hover:bg-[#8F2020] text-white text-xs sm:text-sm font-bold rounded-lg shadow transition-colors cursor-pointer disabled:opacity-50"
                >
                  {saveSuccess ? (
                    <>
                      <Check className="w-4 h-4 text-white" />
                      <span>Saved!</span>
                    </>
                  ) : isSaving ? (
                    <span>Saving...</span>
                  ) : (
                    <>
                      <span>{formPublished ? 'Publish' : 'Save Draft'}</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleCloseEditor}
                  className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors ml-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </header>

            {/* Main Editor Body (2 Column Layout like Blogger) */}
            <form onSubmit={handleSavePost} className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 min-h-0 bg-[#FAF6F0]">
              
              {/* Left Column: Title, Topic, Content Editor (8 cols) */}
              <div className="lg:col-span-8 p-4 sm:p-6 flex flex-col space-y-4 border-b lg:border-b-0 lg:border-r border-[#E8DDD0] bg-white overflow-y-auto">
                {/* Title Input */}
                <div>
                  <label className="block text-xs font-bold text-[#7A6E65] uppercase tracking-wider mb-1">
                    Post Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={handleTitleChange}
                    placeholder="Enter catchy article title..."
                    className="w-full px-4 py-2.5 text-base sm:text-lg font-bold text-[#2B2521] border border-[#E8DDD0] rounded-lg focus:ring-2 focus:ring-[#B12B2B] focus:border-transparent outline-none bg-[#FAF6F0]"
                  />
                </div>

                {/* Topic / Category Input */}
                <div>
                  <label className="block text-xs font-bold text-[#7A6E65] uppercase tracking-wider mb-1">
                    Topic / Category (Appears on Card)
                  </label>
                  <input
                    type="text"
                    value={formTopic}
                    onChange={(e) => setFormTopic(e.target.value)}
                    placeholder="e.g. Beginner Guide, Women's Self-Defence, Varma Therapy"
                    className="w-full px-4 py-2 text-sm font-semibold text-[#2B2521] border border-[#E8DDD0] rounded-lg focus:ring-2 focus:ring-[#B12B2B] focus:border-transparent outline-none bg-[#FAF6F0]"
                  />
                  <p className="text-[11px] text-[#7A6E65] mt-1">
                    This displays prominently on the top right panel of the blog card.
                  </p>
                </div>

                {/* Content Editor Toolbar */}
                <div className="border border-[#E8DDD0] rounded-xl overflow-hidden flex flex-col flex-1">
                  <div className="bg-[#FAF6F0] border-b border-[#E8DDD0] px-3 py-2 flex flex-wrap items-center gap-1">
                    <button
                      type="button"
                      onClick={() => insertFormatting('**', '**')}
                      className="p-1.5 hover:bg-white rounded text-gray-700 hover:text-black transition"
                      title="Bold"
                    >
                      <Bold className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormatting('*', '*')}
                      className="p-1.5 hover:bg-white rounded text-gray-700 hover:text-black transition"
                      title="Italic"
                    >
                      <Italic className="w-4 h-4" />
                    </button>
                    <span className="w-px h-4 bg-[#E8DDD0] mx-1" />
                    <button
                      type="button"
                      onClick={() => insertFormatting('<h2>', '</h2>')}
                      className="p-1.5 hover:bg-white rounded text-gray-700 hover:text-black transition text-xs font-bold"
                      title="Heading 2"
                    >
                      <Heading2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormatting('<h3>', '</h3>')}
                      className="p-1.5 hover:bg-white rounded text-gray-700 hover:text-black transition text-xs font-bold"
                      title="Heading 3"
                    >
                      <Heading3 className="w-4 h-4" />
                    </button>
                    <span className="w-px h-4 bg-[#E8DDD0] mx-1" />
                    <button
                      type="button"
                      onClick={() => insertFormatting('<ul>\n  <li>', '</li>\n</ul>')}
                      className="p-1.5 hover:bg-white rounded text-gray-700 hover:text-black transition"
                      title="List"
                    >
                      <List className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormatting('<blockquote>', '</blockquote>')}
                      className="p-1.5 hover:bg-white rounded text-gray-700 hover:text-black transition"
                      title="Quote"
                    >
                      <Quote className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormatting('<a href="https://jadmaa.com">', '</a>')}
                      className="p-1.5 hover:bg-white rounded text-gray-700 hover:text-black transition"
                      title="Link"
                    >
                      <LinkIcon className="w-4 h-4" />
                    </button>

                    <div className="ml-auto sm:hidden flex items-center">
                      <button
                        type="button"
                        onClick={() => setEditorMode(m => m === 'compose' ? 'preview' : 'compose')}
                        className="text-xs text-[#B12B2B] font-bold px-2 py-1 bg-white border border-[#E8DDD0] rounded"
                      >
                        {editorMode === 'compose' ? 'Preview' : 'Compose'}
                      </button>
                    </div>
                  </div>

                  {/* Compose View or Live Preview */}
                  {editorMode === 'compose' ? (
                    <textarea
                      required
                      value={formContent}
                      onChange={(e) => setFormContent(e.target.value)}
                      placeholder="Write your article in HTML or Markdown here..."
                      className="w-full flex-1 min-h-[360px] p-4 text-[15px] font-mono leading-relaxed text-[#2B2521] border-0 outline-none resize-none bg-white"
                    />
                  ) : (
                    <div className="w-full flex-1 min-h-[360px] p-6 bg-white overflow-y-auto text-left">
                      <h1 className="text-2xl font-bold text-[#2B2521] mb-4 font-heading">{formTitle || 'Preview Title'}</h1>
                      <div className="text-[13px] text-[#046bd2] font-semibold mb-6 pb-2 border-b border-[#F0F0F0]">
                        By Admin / {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </div>
                      {/<[a-z][\s\S]*>/i.test(formContent) ? (
                        <div 
                          className="jadmaa-article-content prose max-w-none text-[#334155] leading-[1.8]"
                          dangerouslySetInnerHTML={{ __html: formContent }}
                        />
                      ) : (
                        <div className="prose max-w-none text-[#334155] leading-[1.8]">
                          <ReactMarkdown>{formContent}</ReactMarkdown>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Post Settings Sidebar (4 cols) */}
              <div className="lg:col-span-4 p-4 sm:p-6 bg-[#FAF6F0] space-y-6 overflow-y-auto">
                <div className="flex items-center gap-2 pb-2 border-b border-[#E8DDD0]">
                  <FileText className="w-4 h-4 text-[#B12B2B]" />
                  <h4 className="font-bold text-sm text-[#2B2521] uppercase tracking-wider">
                    Post Settings
                  </h4>
                </div>

                {/* Thumbnail Upload with Live Card Preview */}
                <div className="bg-white p-4 rounded-xl border border-[#E8DDD0] space-y-3">
                  <ImageUpload 
                    label="Thumbnail Artwork"
                    value={formThumbnail}
                    onChange={(url) => setFormThumbnail(url)}
                    aspectRatio="video"
                    helperText="Upload image or paste direct image URL (shown on left side of blog card)"
                  />
                  {formThumbnail && (
                    <div className="mt-2 text-center">
                      <span className="text-[11px] text-[#7A6E65] block mb-1">Thumbnail Preview</span>
                      <img 
                        src={formThumbnail} 
                        alt="Thumbnail" 
                        className="w-full h-28 object-cover rounded-lg border border-[#E8DDD0]"
                        onError={(e) => { (e.target as any).src = '/images/course-basic.jpg'; }}
                      />
                    </div>
                  )}
                </div>

                {/* Excerpt */}
                <div className="bg-white p-4 rounded-xl border border-[#E8DDD0] space-y-2">
                  <label className="block text-xs font-bold text-[#7A6E65] uppercase tracking-wider">
                    Summary / Excerpt
                  </label>
                  <textarea
                    rows={3}
                    value={formExcerpt}
                    onChange={(e) => setFormExcerpt(e.target.value)}
                    placeholder="Short 2-line description shown on the blog card..."
                    className="w-full px-3 py-2 text-xs text-[#2B2521] border border-[#E8DDD0] rounded-lg focus:ring-1 focus:ring-[#B12B2B] outline-none"
                  />
                </div>

                {/* Permalink Slug */}
                <div className="bg-white p-4 rounded-xl border border-[#E8DDD0] space-y-2">
                  <label className="block text-xs font-bold text-[#7A6E65] uppercase tracking-wider">
                    Permalink (Slug)
                  </label>
                  <input
                    type="text"
                    value={formSlug}
                    onChange={(e) => setFormSlug(e.target.value)}
                    placeholder="post-url-slug"
                    className="w-full px-3 py-2 text-xs font-mono text-[#2B2521] border border-[#E8DDD0] rounded-lg focus:ring-1 focus:ring-[#B12B2B] outline-none"
                  />
                  <p className="text-[11px] text-[#7A6E65]">
                    URL will be: <span className="font-mono text-[#B12B2B]">/blog/{formSlug || 'post-slug'}</span>
                  </p>
                </div>

                {/* Publishing Controls */}
                <div className="bg-white p-4 rounded-xl border border-[#E8DDD0] space-y-3">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formPublished}
                      onChange={(e) => setFormPublished(e.target.checked)}
                      className="w-4 h-4 text-[#B12B2B] rounded border-[#E8DDD0] focus:ring-[#B12B2B]"
                    />
                    <span className="text-xs font-bold text-[#2B2521]">
                      Publish immediately to live site
                    </span>
                  </label>
                  <p className="text-[11px] text-[#7A6E65]">
                    If unchecked, this post remains saved as a Draft visible only to admins.
                  </p>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
