/**
 * Get Review Comments Use Case
 * Handles fetching paginated comments for a review
 */

import { inject, injectable } from 'tsyringe';

import {
  IReviewRepository,
  type PaginatedResult,
} from '../../../domain/repositories/IReviewRepository.js';
import type { ReviewCommentWithUser } from '../../../domain/entities/ReviewComment.js';

export interface GetReviewCommentsInput {
  reviewId: string;
  page?: number;
  pageSize?: number;
}

export interface GetReviewCommentsOutput {
  comments: PaginatedResult<ReviewCommentWithUser>;
}

export class GetReviewCommentsError extends Error {
  constructor(
    message: string,
    public code: 'REVIEW_NOT_FOUND'
  ) {
    super(message);
    this.name = 'GetReviewCommentsError';
  }
}

@injectable()
export class GetReviewCommentsUseCase {
  private static readonly DEFAULT_PAGE = 1;
  private static readonly DEFAULT_PAGE_SIZE = 20;
  private static readonly MAX_PAGE_SIZE = 100;

  constructor(
    @inject(IReviewRepository as symbol)
    private reviewRepository: IReviewRepository
  ) {}

  async execute(input: GetReviewCommentsInput): Promise<GetReviewCommentsOutput> {
    // Check if review exists
    const review = await this.reviewRepository.findById(input.reviewId);
    if (!review) {
      throw new GetReviewCommentsError('Review not found', 'REVIEW_NOT_FOUND');
    }

    const page = Math.max(1, input.page ?? GetReviewCommentsUseCase.DEFAULT_PAGE);
    const pageSize = Math.min(
      GetReviewCommentsUseCase.MAX_PAGE_SIZE,
      Math.max(1, input.pageSize ?? GetReviewCommentsUseCase.DEFAULT_PAGE_SIZE)
    );

    const comments = await this.reviewRepository.getComments(input.reviewId, page, pageSize);

    return { comments };
  }
}
