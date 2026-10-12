import React, { useState, useEffect } from 'react';
import { blogApi } from "../../lib/api/blogApi";
import type { BlogPost } from '../../lib/api/blogApi';
import { Plus, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ImageUpload } from '../../components/common/ImageUpload';

export const BlogManager: React.FC = () => {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [isEditing, setIsEditing] = useState(false);
  const [currentBlog, setCurrentBlog] = useState<Partial<BlogPost>>({});

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const data = await blogApi.getBlogs(true);
      // Admin should see all blogs, even unpublished ones.
      // But our getBlogs api currently only returns published:true.
      // Let's assume we update getBlogs to return all for admin later, or we can fetch all via a different endpoint.
      // For now, we will use the existing getBlogs.
      setBlogs(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load blogs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (currentBlog.id) {
        await blogApi.updateBlog(currentBlog.id, currentBlog);
      } else {
        await blogApi.createBlog(currentBlog);
      }
      setIsEditing(false);
      setCurrentBlog({});
      fetchBlogs();
    } catch (err: any) {
      alert(err.message || 'Error saving blog');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this post?')) {
      try {
        await blogApi.deleteBlog(id);
        fetchBlogs();
      } catch (err: any) {
        alert(err.message || 'Error deleting blog');
      }
    }
  };

  if (isEditing) {
    return (
      <div className="bg-white p-6 rounded-2xl border border-jadmaa-border shadow-sm">
        <h3 className="text-xl font-bold text-jadmaa-charcoal mb-4">
          {currentBlog.id ? 'Edit Post' : 'Create New Post'}
        </h3>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-jadmaa-charcoal mb-1">Title</label>
            <input 
              type="text" 
              required
              value={currentBlog.title || ''}
              onChange={(e) => setCurrentBlog({...currentBlog, title: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-')})}
              className="w-full px-4 py-2 text-sm border border-jadmaa-border rounded-lg focus:ring-1 focus:ring-jadmaa-red outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-jadmaa-charcoal mb-1">Slug (URL)</label>
            <input 
              type="text" 
              required
              value={currentBlog.slug || ''}
              onChange={(e) => setCurrentBlog({...currentBlog, slug: e.target.value})}
              className="w-full px-4 py-2 text-sm border border-jadmaa-border rounded-lg focus:ring-1 focus:ring-jadmaa-red outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-jadmaa-charcoal mb-1">Excerpt</label>
            <textarea 
              rows={2}
              value={currentBlog.excerpt || ''}
              onChange={(e) => setCurrentBlog({...currentBlog, excerpt: e.target.value})}
              className="w-full px-4 py-2 text-sm border border-jadmaa-border rounded-lg focus:ring-1 focus:ring-jadmaa-red outline-none"
            />
          </div>
          <ImageUpload 
            label="Thumbnail Image"
            value={currentBlog.thumbnailUrl || ''}
            onChange={(url) => setCurrentBlog({...currentBlog, thumbnailUrl: url})}
            aspectRatio="video"
            helperText="Upload an image from your device or paste an image URL"
          />
          <div>
            <label className="block text-xs font-bold text-jadmaa-charcoal mb-1">Content (Markdown)</label>
            <textarea 
              required
              rows={10}
              value={currentBlog.content || ''}
              onChange={(e) => setCurrentBlog({...currentBlog, content: e.target.value})}
              className="w-full px-4 py-2 text-sm border border-jadmaa-border rounded-lg focus:ring-1 focus:ring-jadmaa-red outline-none font-mono"
            />
          </div>
          <div className="flex items-center space-x-2">
            <input 
              type="checkbox" 
              id="published"
              checked={currentBlog.published || false}
              onChange={(e) => setCurrentBlog({...currentBlog, published: e.target.checked})}
            />
            <label htmlFor="published" className="text-sm font-semibold text-jadmaa-charcoal">Published</label>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4 border-t border-jadmaa-border">
            <button 
              type="button" 
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 text-sm font-bold text-jadmaa-textMuted hover:text-jadmaa-charcoal"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="px-4 py-2 text-sm font-bold bg-jadmaa-red text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Save Post
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="font-heading font-extrabold text-2xl text-jadmaa-charcoal">Blog Posts</h3>
        <button 
          onClick={() => {
            setCurrentBlog({ published: true });
            setIsEditing(true);
          }}
          className="flex items-center justify-center space-x-1 bg-jadmaa-charcoal text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-800 transition-colors shrink-0 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Post</span>
        </button>
      </div>

      {loading ? (
        <div className="py-8 text-center text-jadmaa-textMuted">Loading posts...</div>
      ) : error ? (
        <div className="py-8 text-center text-jadmaa-red">Error: {error}</div>
      ) : blogs.length > 0 ? (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-2xl border border-jadmaa-border overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-jadmaa-cream border-b border-jadmaa-border text-jadmaa-textMuted">
                <tr>
                  <th className="px-6 py-3 font-bold">Title</th>
                  <th className="px-6 py-3 font-bold">Date</th>
                  <th className="px-6 py-3 font-bold">Status</th>
                  <th className="px-6 py-3 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-jadmaa-border">
                {blogs.map(blog => (
                  <tr key={blog.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-semibold text-jadmaa-charcoal">{blog.title}</td>
                    <td className="px-6 py-4 text-jadmaa-textMuted">{format(new Date(blog.createdAt), 'MMM dd, yyyy')}</td>
                    <td className="px-6 py-4">
                      {blog.published ? (
                        <span className="inline-flex items-center space-x-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md text-xs font-bold">
                          <CheckCircle className="w-3 h-3" /> <span>Published</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 text-gray-600 bg-gray-100 px-2 py-1 rounded-md text-xs font-bold">
                          <XCircle className="w-3 h-3" /> <span>Draft</span>
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right space-x-3">
                      <button 
                        onClick={() => {
                          setCurrentBlog(blog);
                          setIsEditing(true);
                        }}
                        className="text-jadmaa-textMuted hover:text-jadmaa-charcoal transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(blog.id)}
                        className="text-jadmaa-textMuted hover:text-jadmaa-red transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Grid View */}
          <div className="md:hidden grid grid-cols-1 gap-4">
            {blogs.map(blog => (
              <div key={blog.id} className="bg-white border border-jadmaa-border rounded-xl p-4 shadow-sm flex flex-col space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <h3 className="font-bold text-jadmaa-charcoal leading-tight">{blog.title}</h3>
                  {blog.published ? (
                    <span className="inline-flex items-center space-x-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md text-[10px] font-bold shrink-0">
                      <CheckCircle className="w-3 h-3" /> <span>Published</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center space-x-1 text-gray-600 bg-gray-100 px-2 py-1 rounded-md text-[10px] font-bold shrink-0">
                      <XCircle className="w-3 h-3" /> <span>Draft</span>
                    </span>
                  )}
                </div>
                
                <div className="text-sm text-jadmaa-textMuted">
                  <span className="block text-xs text-gray-400 font-bold uppercase mb-0.5">Date</span>
                  {format(new Date(blog.createdAt), 'MMM dd, yyyy')}
                </div>

                <div className="flex justify-end space-x-2 pt-3 border-t border-jadmaa-border mt-2">
                  <button 
                    onClick={() => {
                      setCurrentBlog(blog);
                      setIsEditing(true);
                    }}
                    className="flex-1 flex items-center justify-center space-x-1 py-2 text-jadmaa-textMuted hover:text-jadmaa-charcoal bg-gray-50 hover:bg-gray-100 rounded-lg transition font-medium text-sm"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Edit</span>
                  </button>
                  <button 
                    onClick={() => handleDelete(blog.id)}
                    className="flex-1 flex items-center justify-center space-x-1 py-2 text-jadmaa-red bg-red-50 hover:bg-red-100 rounded-lg transition font-medium text-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-12 bg-jadmaa-cream/40 rounded-2xl border border-dashed border-jadmaa-border">
          <p className="text-sm text-jadmaa-textMuted">No blog posts found. Create your first post!</p>
        </div>
      )}
    </div>
  );
};
