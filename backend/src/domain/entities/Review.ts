/**
 * Review Domain Entity
 * Pure domain model - no framework dependencies
 */

import { MAX_RATING, MIN_RATING } from '@cine-connect/shared';

export interface ReviewProps {
  id: string;
  userId: string;
  filmId: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateReviewProps {
  userId: string;
  filmId: string;
  rating: number;
  comment?: string | null;
}

export interface UpdateReviewProps {
  rating?: number;
  comment?: string | null;
}

export interface ReviewWithRelations extends ReviewProps {
  user?: {
    id: string;
    username: string;
    avatarUrl: string | null;
  };
  film?: {
    id: string;
    tmdbId: number;
    title: string;
    poster: string | null;
    year: string | null;
    genre?: string | null;
  };
  likesCount?: number;
  commentsCount?: number;
  isLikedByCurrentUser?: boolean;
}

export class Review {
  readonly id: string;
  readonly userId: string;
  readonly filmId: string;
  readonly rating: number;
  readonly comment: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(props: ReviewProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.filmId = props.filmId;
    this.rating = props.rating;
    this.comment = props.comment;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  /**
   * Validates rating is within bounds
   */
  static isValidRating(rating: number): boolean {
    return rating >= MIN_RATING && rating <= MAX_RATING && Number.isInteger(rating);
  }

  /**
   * Returns data for API response
   */
  toJSON(): ReviewProps {
    return {
      id: this.id,
      userId: this.userId,
      filmId: this.filmId,
      rating: this.rating,
      comment: this.comment,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
