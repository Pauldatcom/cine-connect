/**
 * Get Film Reviews Use Case
 * Handles fetching paginated reviews for a film
 */

import { inject, injectable } from 'tsyringe';

import {
  IReviewRepository,
  type PaginatedResult,
} from '../../../domain/repositories/IReviewRepository.js';
import type { ReviewWithRelations } from '../../../domain/entities/Review.js';

export interface GetFilmReviewsInput {
  filmId: string;
  page?: number;
  pageSize?: number;
  currentUserId?: string;
}

export interface GetFilmReviewsOutput {
  reviews: PaginatedResult<ReviewWithRelations>;
}

@injectable()
export class GetFilmReviewsUseCase {
  private static readonly DEFAULT_PAGE = 1;
  private static readonly DEFAULT_PAGE_SIZE = 20;
  private static readonly MAX_PAGE_SIZE = 100;

  constructor(
    @inject(IReviewRepository as symbol)
    private reviewRepository: IReviewRepository
  ) {}

  async execute(input: GetFilmReviewsInput): Promise<GetFilmReviewsOutput> {
    const page = Math.max(1, input.page ?? GetFilmReviewsUseCase.DEFAULT_PAGE);
    const pageSize = Math.min(
      GetFilmReviewsUseCase.MAX_PAGE_SIZE,
      Math.max(1, input.pageSize ?? GetFilmReviewsUseCase.DEFAULT_PAGE_SIZE)
    );

    const reviews = await this.reviewRepository.findByFilmId(
      input.filmId,
      page,
      pageSize,
      input.currentUserId
    );

    return { reviews };
  }
}
