/**
 * Comment On Review Use Case
 * Handles adding comments to reviews
 */

import { inject, injectable } from 'tsyringe';

import { IReviewRepository } from '../../../domain/repositories/IReviewRepository.js';
import { ReviewComment } from '../../../domain/entities/ReviewComment.js';

export interface CommentOnReviewInput {
  userId: string;
  reviewId: string;
  content: string;
}

export interface CommentOnReviewOutput {
  comment: ReviewComment;
  commentsCount: number;
}

export class CommentOnReviewError extends Error {
  constructor(
    message: string,
    public code: 'REVIEW_NOT_FOUND' | 'INVALID_CONTENT'
  ) {
    super(message);
    this.name = 'CommentOnReviewError';
  }
}

@injectable()
export class CommentOnReviewUseCase {
  private static readonly MAX_CONTENT_LENGTH = 1000;

  constructor(
    @inject(IReviewRepository as symbol)
    private reviewRepository: IReviewRepository
  ) {}

  async execute(input: CommentOnReviewInput): Promise<CommentOnReviewOutput> {
    // Validate content
    if (!input.content || input.content.trim().length === 0) {
      throw new CommentOnReviewError('Comment content is required', 'INVALID_CONTENT');
    }

    if (input.content.length > CommentOnReviewUseCase.MAX_CONTENT_LENGTH) {
      throw new CommentOnReviewError(
        `Comment must be at most ${CommentOnReviewUseCase.MAX_CONTENT_LENGTH} characters`,
        'INVALID_CONTENT'
      );
    }

    // Check if review exists
    const review = await this.reviewRepository.findById(input.reviewId);
    if (!review) {
      throw new CommentOnReviewError('Review not found', 'REVIEW_NOT_FOUND');
    }

    // Add comment
    const comment = await this.reviewRepository.addComment({
      userId: input.userId,
      reviewId: input.reviewId,
      content: input.content.trim(),
    });

    // Get updated count
    const commentsCount = await this.reviewRepository.getCommentCount(input.reviewId);

    return { comment, commentsCount };
  }
}
