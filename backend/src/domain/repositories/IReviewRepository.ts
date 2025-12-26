/**
 * Review Repository Interface
 * Defines the contract for review data access
 */

import type {
  Review,
  CreateReviewProps,
  UpdateReviewProps,
  ReviewWithRelations,
} from '../entities/Review.js';
import type { ReviewLike, CreateReviewLikeProps } from '../entities/ReviewLike.js';
import type {
  ReviewComment,
  CreateReviewCommentProps,
  ReviewCommentWithUser,
} from '../entities/ReviewComment.js';

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface IReviewRepository {
  // ----- Reviews -----

  /**
   * Find review by ID
   */
  findById(id: string): Promise<Review | null>;

  /**
   * Find review by ID with relations (user, film, counts)
   */
  findByIdWithRelations(id: string, currentUserId?: string): Promise<ReviewWithRelations | null>;

  /**
   * Find review by user and film
   */
  findByUserAndFilm(userId: string, filmId: string): Promise<Review | null>;

  /**
   * Get reviews for a film (paginated)
   */
  findByFilmId(
    filmId: string,
    page: number,
    pageSize: number,
    currentUserId?: string
  ): Promise<PaginatedResult<ReviewWithRelations>>;

  /**
   * Get reviews by a user
   */
  findByUserId(userId: string, limit?: number): Promise<ReviewWithRelations[]>;

  /**
   * Create a new review
   */
  create(data: CreateReviewProps): Promise<Review>;

  /**
   * Update a review
   */
  update(id: string, data: UpdateReviewProps): Promise<Review | null>;

  /**
   * Delete a review
   */
  delete(id: string): Promise<boolean>;

  // ----- Likes -----

  /**
   * Find like by user and review
   */
  findLike(userId: string, reviewId: string): Promise<ReviewLike | null>;

  /**
   * Add like to review
   */
  addLike(data: CreateReviewLikeProps): Promise<ReviewLike>;

  /**
   * Remove like from review
   */
  removeLike(userId: string, reviewId: string): Promise<boolean>;

  /**
   * Get like count for a review
   */
  getLikeCount(reviewId: string): Promise<number>;

  /**
   * Get users who liked a review
   */
  getLikeUsers(
    reviewId: string,
    limit?: number
  ): Promise<{ id: string; username: string; avatarUrl: string | null }[]>;

  // ----- Comments -----

  /**
   * Find comment by ID
   */
  findCommentById(id: string): Promise<ReviewComment | null>;

  /**
   * Get comments for a review
   */
  getComments(
    reviewId: string,
    page: number,
    pageSize: number
  ): Promise<PaginatedResult<ReviewCommentWithUser>>;

  /**
   * Add comment to review
   */
  addComment(data: CreateReviewCommentProps): Promise<ReviewComment>;

  /**
   * Delete comment
   */
  deleteComment(id: string): Promise<boolean>;

  /**
   * Get comment count for a review
   */
  getCommentCount(reviewId: string): Promise<number>;
}

// Token for dependency injection
export const IReviewRepository = Symbol.for('IReviewRepository');
