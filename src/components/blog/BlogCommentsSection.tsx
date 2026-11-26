import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Trash2, Send } from 'lucide-react';
import { reviewsApi, type BlogCommentItem } from '../../lib/api/reviewsApi';
import { useAuth } from '../../context/AuthContext';

interface BlogCommentsSectionProps {
  blogPostId: string;
}

export const BlogCommentsSection: React.FC<BlogCommentsSectionProps> = ({ blogPostId }) => {
  const { user, isLoggedIn } = useAuth();
  const [comments, setComments] = useState<BlogCommentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  const loadComments = async () => {
    if (!blogPostId) return;
    try {
      setLoading(true);
      const res = await reviewsApi.getBlogComments(blogPostId);
      if (res?.success && Array.isArray(res.data)) {
        setComments(res.data);
      }
    } catch (err) {
      console.error('Failed to load blog comments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComments();
  }, [blogPostId]);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !isLoggedIn) return;
    setSubmitting(true);
    try {
      const res = await reviewsApi.createBlogComment(blogPostId, content.trim());
      if (res?.success && res.data) {
        setComments((prev) => [res.data, ...prev]);
        setContent('');
      }
    } catch (err) {
      console.error('Failed to post comment:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await reviewsApi.deleteBlogComment(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (err) {
      console.error('Failed to delete comment:', err);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-[#E8DDD0] p-5 sm:p-6 space-y-5 shadow-2xs">
      <div className="flex items-center gap-2 border-b border-[#E8DDD0]/70 pb-3">
        <MessageCircle className="w-5 h-5 text-[#B12B2B]" />
        <h3 className="font-heading font-extrabold text-lg sm:text-xl text-[#2B2521]">
          Comments ({comments.length})
        </h3>
      </div>

      {isLoggedIn ? (
        <form onSubmit={handlePost} className="space-y-2.5">
          <textarea
            rows={3}
            required
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share your thoughts or questions about this article..."
            className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#FAF6F0]/60 border border-[#E8DDD0] rounded-xl focus:outline-none focus:border-[#B12B2B] resize-none"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting || !content.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#B12B2B] hover:bg-[#8F2020] text-white text-xs font-semibold rounded-xl transition cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submitting ? 'Posting...' : 'Post Comment'}</span>
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-[#FAF6F0]/70 border border-[#E8DDD0] rounded-xl p-3.5 flex items-center justify-between gap-3 text-xs">
          <span className="text-[#5C5148]">Sign in to post a comment on this article.</span>
          <Link
            to="/login"
            className="px-3.5 py-1.5 bg-[#B12B2B] hover:bg-[#8F2020] text-white font-semibold rounded-lg transition shrink-0"
          >
            Sign In
          </Link>
        </div>
      )}

      {loading ? (
        <p className="text-xs text-[#5C5148] mb-0">Loading comments...</p>
      ) : comments.length === 0 ? (
        <p className="text-xs sm:text-sm text-[#5C5148] italic mb-0">
          No comments yet. Start the conversation!
        </p>
      ) : (
        <div className="divide-y divide-[#E8DDD0]/60">
          {comments.map((c) => {
            const canDelete = user?.id === c.userId || isAdmin;
            return (
              <div key={c.id} className="py-3.5 first:pt-0 last:pb-0 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {c.user?.avatarUrl ? (
                      <img
                        src={c.user.avatarUrl}
                        alt={c.user.name}
                        className="w-8 h-8 rounded-full object-cover border border-[#E8DDD0]"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-[#B12B2B] text-white font-bold text-xs flex items-center justify-center shrink-0">
                        {(c.user?.name || 'U').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <span className="text-xs sm:text-sm font-bold text-[#2B2521] block truncate">
                        {c.user?.name || 'Member'}
                      </span>
                      <span className="text-[10px] text-[#5C5148]">
                        {new Date(c.createdAt).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>

                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => handleDelete(c.id)}
                      title="Delete comment"
                      className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <p className="text-xs sm:text-sm text-[#5C5148] leading-relaxed pl-10 whitespace-pre-line mb-0">
                  {c.content}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
