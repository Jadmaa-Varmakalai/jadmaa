import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, Trash2, MessageSquarePlus } from 'lucide-react';
import { reviewsApi, type ItemReview, type ReviewTargetType } from '../../lib/api/reviewsApi';
import { useAuth } from '../../context/AuthContext';

interface ItemReviewsSectionProps {
  targetType: ReviewTargetType;
  targetId: string;
  title?: string;
  starsOnly?: boolean;
  onStatsChange?: (stats: { averageRating: number; totalRatings: number }) => void;
}

export const ItemReviewsSection: React.FC<ItemReviewsSectionProps> = ({
  targetType,
  targetId,
  title = 'Ratings & Reviews',
  starsOnly = false,
  onStatsChange,
}) => {
  const { user, isLoggedIn } = useAuth();
  const [reviews, setReviews] = useState<ItemReview[]>([]);
  const [averageRating, setAverageRating] = useState<number>(0);
  const [totalRatings, setTotalRatings] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const [selectedRating, setSelectedRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  const loadReviews = async () => {
    if (!targetId) return;
    try {
      setLoading(true);
      const res = await reviewsApi.getItemReviews(targetType, targetId);
      if (res?.success && res.data) {
        setReviews(res.data.reviews || []);
        setAverageRating(res.data.averageRating || 0);
        setTotalRatings(res.data.totalRatings || 0);
        onStatsChange?.({
          averageRating: res.data.averageRating || 0,
          totalRatings: res.data.totalRatings || 0,
        });

        // Pre-fill existing user review if present
        if (user?.id) {
          const mine = (res.data.reviews || []).find((r) => r.userId === user.id);
          if (mine) {
            setSelectedRating(mine.rating);
            setComment(mine.comment || '');
          }
        }
      }
    } catch (err) {
      console.error('Failed to load reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [targetType, targetId, user?.id]);

  const myExistingReview = user?.id ? reviews.find((r) => r.userId === user.id) : undefined;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn) return;
    setSubmitting(true);
    setStatusMsg(null);
    try {
      const res = await reviewsApi.submitItemReview(targetType, targetId, selectedRating, comment);
      if (res?.success) {
        setStatusMsg(myExistingReview ? 'Your review was updated.' : 'Thank you for your review!');
        await loadReviews();
      }
    } catch (err: any) {
      setStatusMsg(err?.message || 'Failed to submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStarClick = async (star: number) => {
    setSelectedRating(star);
    if (starsOnly && isLoggedIn) {
      setSubmitting(true);
      setStatusMsg(null);
      try {
        const res = await reviewsApi.submitItemReview(targetType, targetId, star, '');
        if (res?.success) {
          setStatusMsg(myExistingReview ? 'Your rating was updated!' : 'Thank you for rating!');
          await loadReviews();
        }
      } catch (err: any) {
        setStatusMsg(err?.message || 'Failed to submit rating.');
      } finally {
        setSubmitting(false);
      }
    }
  };

  const handleDelete = async (reviewId: string) => {
    if (!window.confirm('Delete this review?')) return;
    try {
      await reviewsApi.deleteItemReview(reviewId);
      setComment('');
      setSelectedRating(5);
      await loadReviews();
    } catch (err) {
      console.error('Failed to delete review:', err);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-[#E8DDD0] p-5 sm:p-6 space-y-5 shadow-2xs">
      {/* Header & Dynamic Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E8DDD0]/70 pb-4">
        <div>
          <h3 className="font-heading font-extrabold text-lg sm:text-xl text-[#2B2521]">{title}</h3>
          <p className="text-xs text-[#5C5148] mb-0">
            Verified ratings and feedback from JADMAA members
          </p>
        </div>

        <div className="flex items-center gap-2.5 bg-[#FAF6F0] border border-[#E8DDD0] px-3.5 py-2 rounded-xl self-start sm:self-auto">
          <div className="flex items-center text-amber-500">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-4 h-4 ${
                  star <= Math.round(averageRating) ? 'fill-current' : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <span className="text-sm font-extrabold text-[#2B2521]">
            {totalRatings > 0 ? averageRating.toFixed(1) : '0.0'}
          </span>
          <span className="text-xs text-[#5C5148]">
            ({totalRatings} {totalRatings === 1 ? 'Rating' : 'Ratings'})
          </span>
        </div>
      </div>

      {/* If starsOnly mode: render only the interactive star picker, suppress review text & list */}
      {starsOnly ? (
        <div className="bg-[#FAF6F0]/70 border border-[#E8DDD0] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <span className="text-xs font-bold text-[#2B2521] block">
              {myExistingReview ? 'Your Current Rating:' : 'Tap a star to rate this article:'}
            </span>
            {statusMsg && (
              <span className="text-xs text-emerald-700 font-semibold block">{statusMsg}</span>
            )}
          </div>

          {isLoggedIn ? (
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => {
                const active = (hoverRating || selectedRating) >= star;
                return (
                  <button
                    key={star}
                    type="button"
                    disabled={submitting}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => handleStarClick(star)}
                    aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                    className="p-1 cursor-pointer transition-transform hover:scale-125 disabled:opacity-50"
                  >
                    <Star
                      className={`w-6 h-6 transition-colors ${
                        active ? 'text-amber-500 fill-current' : 'text-gray-300'
                      }`}
                    />
                  </button>
                );
              })}
              <span className="text-xs font-mono font-bold text-[#5C5148] ml-1.5 tabular-nums">
                {selectedRating}/5
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#5C5148]">Sign in to rate:</span>
              <Link
                to="/login"
                className="px-3.5 py-1.5 bg-[#B12B2B] hover:bg-[#8F2020] text-white text-xs font-semibold rounded-lg transition"
              >
                Sign In
              </Link>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Review Submission Form */}
          {isLoggedIn ? (
            <form onSubmit={handleSubmit} className="bg-[#FAF6F0]/70 border border-[#E8DDD0] rounded-xl p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold text-[#2B2521] flex items-center gap-1.5">
                  <MessageSquarePlus className="w-4 h-4 text-[#B12B2B]" />
                  <span>{myExistingReview ? 'Update Your Rating & Review' : 'Rate & Write a Review'}</span>
                </span>

                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const active = (hoverRating || selectedRating) >= star;
                    return (
                      <button
                        key={star}
                        type="button"
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setSelectedRating(star)}
                        aria-label={`Rate ${star} stars`}
                        className="p-0.5 cursor-pointer transition-transform hover:scale-110"
                      >
                        <Star
                          className={`w-5 h-5 ${
                            active ? 'text-amber-500 fill-current' : 'text-gray-300'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>

              <textarea
                rows={2}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your honest experience (optional)..."
                className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-[#E8DDD0] rounded-xl focus:outline-none focus:border-[#B12B2B] resize-none"
              />

              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-emerald-700 font-medium">{statusMsg || ''}</span>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-[#B12B2B] hover:bg-[#8F2020] text-white text-xs font-semibold rounded-xl transition cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : myExistingReview ? 'Update Review' : 'Submit Review'}
                </button>
              </div>
            </form>
          ) : (
            <div className="bg-[#FAF6F0]/70 border border-[#E8DDD0] rounded-xl p-3.5 flex items-center justify-between gap-3 text-xs">
              <span className="text-[#5C5148]">Sign in to rate and write a review.</span>
              <Link
                to="/login"
                className="px-3.5 py-1.5 bg-[#B12B2B] hover:bg-[#8F2020] text-white font-semibold rounded-lg transition shrink-0"
              >
                Sign In
              </Link>
            </div>
          )}

          {/* Reviews List */}
          {loading ? (
            <p className="text-xs text-[#5C5148] mb-0">Loading reviews...</p>
          ) : reviews.length === 0 ? (
            <p className="text-xs sm:text-sm text-[#5C5148] italic mb-0">
              No reviews yet. Be the first to share your feedback!
            </p>
          ) : (
            <div className="divide-y divide-[#E8DDD0]/60">
              {reviews.map((rev) => {
                const canDelete = user?.id === rev.userId || isAdmin;
                return (
                  <div key={rev.id} className="py-3.5 first:pt-0 last:pb-0 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {rev.user?.avatarUrl ? (
                          <img
                            src={rev.user.avatarUrl}
                            alt={rev.user.name}
                            className="w-8 h-8 rounded-full object-cover border border-[#E8DDD0]"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-[#B12B2B]/10 text-[#B12B2B] font-bold text-xs flex items-center justify-center shrink-0">
                            {(rev.user?.name || 'U').charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <span className="text-xs sm:text-sm font-bold text-[#2B2521] block truncate">
                            {rev.user?.name || 'Member'}
                          </span>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center text-amber-500">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star
                                  key={s}
                                  className={`w-3 h-3 ${s <= rev.rating ? 'fill-current' : 'text-gray-300'}`}
                                />
                              ))}
                            </div>
                            <span className="text-[10px] text-[#5C5148]">
                              {new Date(rev.updatedAt || rev.createdAt).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                          </div>
                        </div>
                      </div>

                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => handleDelete(rev.id)}
                          title="Delete review"
                          className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {rev.comment && (
                      <p className="text-xs sm:text-sm text-[#5C5148] leading-relaxed pl-10 mb-0">
                        {rev.comment}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};
