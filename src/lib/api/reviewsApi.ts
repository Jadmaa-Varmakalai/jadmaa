import { fetchApi } from './apiClient';

export type ReviewTargetType = 'COURSE' | 'PRODUCT' | 'BLOG';

export interface ItemReview {
  id: string;
  targetType: ReviewTargetType;
  targetId: string;
  userId: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    avatarUrl?: string | null;
  };
}

export interface ItemReviewsResponse {
  averageRating: number;
  totalRatings: number;
  reviews: ItemReview[];
}

export interface BlogCommentItem {
  id: string;
  blogPostId: string;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    avatarUrl?: string | null;
  };
}

export const reviewsApi = {
  getItemReviews: async (targetType: ReviewTargetType, targetId: string) => {
    return fetchApi<{ success: boolean; data: ItemReviewsResponse }>(
      `/reviews/item/${targetType}/${encodeURIComponent(targetId)}`
    );
  },

  submitItemReview: async (
    targetType: ReviewTargetType,
    targetId: string,
    rating: number,
    comment?: string
  ) => {
    return fetchApi<{
      success: boolean;
      data: { review: ItemReview; averageRating: number; totalRatings: number };
    }>(`/reviews/item/${targetType}/${encodeURIComponent(targetId)}`, {
      method: 'POST',
      body: JSON.stringify({ rating, comment }),
    });
  },

  deleteItemReview: async (reviewId: string) => {
    return fetchApi<{ success: boolean; data: { deleted: boolean } }>(
      `/reviews/item/${encodeURIComponent(reviewId)}`,
      { method: 'DELETE' }
    );
  },

  getBlogComments: async (blogPostId: string) => {
    return fetchApi<{ success: boolean; data: BlogCommentItem[] }>(
      `/reviews/blog-comments/${encodeURIComponent(blogPostId)}`
    );
  },

  createBlogComment: async (blogPostId: string, content: string) => {
    return fetchApi<{ success: boolean; data: BlogCommentItem }>(
      `/reviews/blog-comments/${encodeURIComponent(blogPostId)}`,
      {
        method: 'POST',
        body: JSON.stringify({ content }),
      }
    );
  },

  deleteBlogComment: async (commentId: string) => {
    return fetchApi<{ success: boolean; data: { deleted: boolean } }>(
      `/reviews/blog-comments/${encodeURIComponent(commentId)}`,
      { method: 'DELETE' }
    );
  },
};
