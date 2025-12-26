/**
 * Create Review Use Case
 * Handles business logic for creating a new review
 */

import { inject, injectable } from 'tsyringe';

import { IReviewRepository } from '../../../domain/repositories/IReviewRepository.js';
import { IFilmRepository } from '../../../domain/repositories/IFilmRepository.js';
import { Review, type CreateReviewProps } from '../../../domain/entities/Review.js';
import { MIN_RATING, MAX_RATING, COMMENT_MAX_LENGTH } from '@cine-connect/shared';

export interface CreateReviewInput {
  userId: string;
  filmId: string;
  rating: number;
  comment?: string;
}

export interface CreateReviewOutput {
  review: Review;
}

export class CreateReviewError extends Error {
  constructor(
    message: string,
    public code: 'INVALID_RATING' | 'INVALID_COMMENT' | 'FILM_NOT_FOUND' | 'ALREADY_REVIEWED'
  ) {
    super(message);
    this.name = 'CreateReviewError';
  }
}

@injectable()
export class CreateReviewUseCase {
  constructor(
    @inject(IReviewRepository as symbol)
    private reviewRepository: IReviewRepository,
    @inject(IFilmRepository as symbol)
    private filmRepository: IFilmRepository
  ) {}

  async execute(input: CreateReviewInput): Promise<CreateReviewOutput> {
    // Validate rating
    if (!Review.isValidRating(input.rating)) {
      throw new CreateReviewError(
        `Rating must be between ${MIN_RATING} and ${MAX_RATING}`,
        'INVALID_RATING'
      );
    }

    // Validate comment if provided
    if (input.comment && input.comment.length > COMMENT_MAX_LENGTH) {
      throw new CreateReviewError(
        `Comment must be at most ${COMMENT_MAX_LENGTH} characters`,
        'INVALID_COMMENT'
      );
    }

    // Check if film exists
    const film = await this.filmRepository.findById(input.filmId);
    if (!film) {
      throw new CreateReviewError('Film not found', 'FILM_NOT_FOUND');
    }

    // Check if user already reviewed this film
    const existingReview = await this.reviewRepository.findByUserAndFilm(
      input.userId,
      input.filmId
    );
    if (existingReview) {
      throw new CreateReviewError('You have already reviewed this film', 'ALREADY_REVIEWED');
    }

    // Create review
    const reviewData: CreateReviewProps = {
      userId: input.userId,
      filmId: input.filmId,
      rating: input.rating,
      comment: input.comment || null,
    };

    const review = await this.reviewRepository.create(reviewData);

    return { review };
  }
}
