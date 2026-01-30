/**
 * useReviews - Custom hooks for review-related queries and mutations
 *
 * Encapsulates all TanStack Query logic for reviews including
 * CRUD operations, likes, and comments.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createReview,
  getFilmReviews,
  getReview,
  getUserReviews,
  updateReview,
  deleteReview,
  likeReview,
  getReviewLikes,
  commentOnReview,
  getReviewComments,
  deleteComment,
  type Review,
  type CreateReviewInput,
  type UpdateReviewInput,
  type PaginatedResponse,
  type ReviewComment,
  type LikeResponse,
  type CommentResponse,
  type LikesResponse,
} from '@/lib/api/reviews';

/**
 * Fetch reviews for a specific film
 */
export function useFilmReviews(filmId: string | undefined, page = 1, pageSize = 20) {
  return useQuery({
    queryKey: ['reviews', 'film', filmId, page, pageSize],
    queryFn: () => {
      if (!filmId) throw new Error('filmId is required');
      return getFilmReviews(filmId, page, pageSize);
    },
    enabled: !!filmId,
  });
}

/**
 * Fetch a single review by ID
 */
export function useReview(reviewId: string | undefined) {
  return useQuery({
    queryKey: ['review', reviewId],
    queryFn: () => {
      if (!reviewId) throw new Error('reviewId is required');
      return getReview(reviewId);
    },
    enabled: !!reviewId,
  });
}

/**
 * Fetch reviews by a specific user
 */
export function useUserReviews(userId: string | undefined) {
  return useQuery({
    queryKey: ['reviews', 'user', userId],
    queryFn: () => {
      if (!userId) throw new Error('userId is required');
      return getUserReviews(userId);
    },
    enabled: !!userId,
  });
}

/**
 * Find user's existing review for a specific film
 * Returns the review if user has already reviewed this film, undefined otherwise
 */
export function useUserFilmReview(userId: string | undefined, filmId: string | undefined) {
  const { data: userReviews, isLoading, error } = useUserReviews(userId);

  const existingReview = userReviews?.find((review) => review.filmId === filmId);

  return {
    existingReview,
    hasReviewed: !!existingReview,
    isLoading,
    error,
  };
}

/**
 * Create a new review mutation
 */
export function useCreateReview(filmId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateReviewInput) => createReview(input),
    onSuccess: () => {
      // Invalidate film reviews and user reviews to refetch
      if (filmId) {
        queryClient.invalidateQueries({ queryKey: ['reviews', 'film', filmId] });
      }
      // Invalidate all user reviews to update hasReviewed status
      queryClient.invalidateQueries({ queryKey: ['reviews', 'user'] });
    },
  });
}

/**
 * Update an existing review mutation
 */
export function useUpdateReview(filmId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ reviewId, input }: { reviewId: string; input: UpdateReviewInput }) =>
      updateReview(reviewId, input),
    onSuccess: (_, { reviewId }) => {
      // Invalidate specific review, film reviews, and user reviews
      queryClient.invalidateQueries({ queryKey: ['review', reviewId] });
      if (filmId) {
        queryClient.invalidateQueries({ queryKey: ['reviews', 'film', filmId] });
      }
      // Invalidate all user reviews to update cached data
      queryClient.invalidateQueries({ queryKey: ['reviews', 'user'] });
    },
  });
}

/**
 * Delete a review mutation
 */
export function useDeleteReview(filmId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reviewId: string) => deleteReview(reviewId),
    onSuccess: () => {
      // Invalidate film reviews to refetch
      if (filmId) {
        queryClient.invalidateQueries({ queryKey: ['reviews', 'film', filmId] });
      }
    },
  });
}

/**
 * Toggle like on a review mutation
 */
export function useLikeReview(filmId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reviewId: string) => likeReview(reviewId),
    onSuccess: (_, reviewId) => {
      // Invalidate to refetch with updated like count
      queryClient.invalidateQueries({ queryKey: ['review', reviewId] });
      if (filmId) {
        queryClient.invalidateQueries({ queryKey: ['reviews', 'film', filmId] });
      }
    },
  });
}

/**
 * Fetch users who liked a review
 */
export function useReviewLikes(reviewId: string | undefined, limit = 10) {
  return useQuery({
    queryKey: ['review', reviewId, 'likes', limit],
    queryFn: () => {
      if (!reviewId) throw new Error('reviewId is required');
      return getReviewLikes(reviewId, limit);
    },
    enabled: !!reviewId,
  });
}

/**
 * Fetch comments for a review
 */
export function useReviewComments(reviewId: string | undefined, page = 1, pageSize = 20) {
  return useQuery({
    queryKey: ['review', reviewId, 'comments', page, pageSize],
    queryFn: () => {
      if (!reviewId) throw new Error('reviewId is required');
      return getReviewComments(reviewId, page, pageSize);
    },
    enabled: !!reviewId,
  });
}

/**
 * Add a comment to a review mutation
 */
export function useAddComment(reviewId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (content: string) => {
      if (!reviewId) throw new Error('reviewId is required');
      return commentOnReview(reviewId, content);
    },
    onSuccess: () => {
      // Invalidate comments to refetch
      if (reviewId) {
        queryClient.invalidateQueries({ queryKey: ['review', reviewId, 'comments'] });
        queryClient.invalidateQueries({ queryKey: ['review', reviewId] });
      }
    },
  });
}

/**
 * Delete a comment mutation
 */
export function useDeleteComment(reviewId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (commentId: string) => {
      if (!reviewId) throw new Error('reviewId is required');
      return deleteComment(reviewId, commentId);
    },
    onSuccess: () => {
      // Invalidate comments to refetch
      if (reviewId) {
        queryClient.invalidateQueries({ queryKey: ['review', reviewId, 'comments'] });
        queryClient.invalidateQueries({ queryKey: ['review', reviewId] });
      }
    },
  });
}

// Type exports for convenience
export type {
  Review,
  CreateReviewInput,
  UpdateReviewInput,
  PaginatedResponse,
  ReviewComment,
  LikeResponse,
  CommentResponse,
  LikesResponse,
};
