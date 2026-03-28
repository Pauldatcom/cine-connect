/**
 * Reviews API - Review endpoints
 */

import { api } from './client';

// Types
export interface ReviewUser {
  id: string;
  username: string;
  avatarUrl: string | null;
}

export interface ReviewFilm {
  id: string;
  tmdbId?: number;
  title: string;
  poster: string | null;
  year: string | null;
}

export interface Review {
  id: string;
  userId: string;
  filmId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
  user?: ReviewUser;
  film?: ReviewFilm;
  likesCount?: number;
  commentsCount?: number;
  isLikedByCurrentUser?: boolean;
}

export interface ReviewComment {
  id: string;
  userId: string;
  reviewId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  user: ReviewUser;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CreateReviewInput {
  filmId: string;
  rating: number;
  comment?: string;
}

export interface UpdateReviewInput {
  rating?: number;
  comment?: string;
}

export interface LikeResponse {
  liked: boolean;
  likesCount: number;
}

export interface CommentResponse {
  comment: ReviewComment;
  commentsCount: number;
}

export interface LikesResponse {
  users: ReviewUser[];
  count: number;
}

/**
 * Create a new review
 */
export async function createReview(input: CreateReviewInput): Promise<Review> {
  return api.post<Review>('/api/v1/reviews', input);
}

/**
 * Get reviews for a film
 */
export async function getFilmReviews(
  filmId: string,
  page = 1,
  pageSize = 20
): Promise<PaginatedResponse<Review>> {
  return api.get<PaginatedResponse<Review>>(
    `/api/v1/reviews/film/${filmId}?page=${page}&pageSize=${pageSize}`
  );
}

/**
 * Get a single review by ID
 */
export async function getReview(reviewId: string): Promise<Review> {
  return api.get<Review>(`/api/v1/reviews/${reviewId}`);
}

/**
 * Get reviews by a user
 */
export async function getUserReviews(userId: string): Promise<Review[]> {
  return api.get<Review[]>(`/api/v1/reviews/user/${userId}`);
}

/**
 * Update a review
 */
export async function updateReview(reviewId: string, input: UpdateReviewInput): Promise<Review> {
  return api.patch<Review>(`/api/v1/reviews/${reviewId}`, input);
}

/**
 * Delete a review
 */
export async function deleteReview(reviewId: string): Promise<void> {
  return api.delete<void>(`/api/v1/reviews/${reviewId}`);
}

/**
 * Toggle like on a review
 */
export async function likeReview(reviewId: string): Promise<LikeResponse> {
  return api.post<LikeResponse>(`/api/v1/reviews/${reviewId}/like`);
}

/**
 * Get users who liked a review
 */
export async function getReviewLikes(reviewId: string, limit = 10): Promise<LikesResponse> {
  return api.get<LikesResponse>(`/api/v1/reviews/${reviewId}/likes?limit=${limit}`);
}

/**
 * Add a comment to a review
 */
export async function commentOnReview(reviewId: string, content: string): Promise<CommentResponse> {
  return api.post<CommentResponse>(`/api/v1/reviews/${reviewId}/comments`, { content });
}

/**
 * Get comments for a review
 */
export async function getReviewComments(
  reviewId: string,
  page = 1,
  pageSize = 20
): Promise<PaginatedResponse<ReviewComment>> {
  return api.get<PaginatedResponse<ReviewComment>>(
    `/api/v1/reviews/${reviewId}/comments?page=${page}&pageSize=${pageSize}`
  );
}

/**
 * Delete a comment
 */
export async function deleteComment(reviewId: string, commentId: string): Promise<void> {
  return api.delete<void>(`/api/v1/reviews/${reviewId}/comments/${commentId}`);
}

export const reviewsApi = {
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
};

export default reviewsApi;
