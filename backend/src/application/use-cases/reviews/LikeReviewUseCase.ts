/**
 * Like Review Use Case
 * Handles toggling like on a review
 */

import { inject, injectable } from 'tsyringe';

import { IReviewRepository } from '../../../domain/repositories/IReviewRepository.js';

export interface LikeReviewInput {
  userId: string;
  reviewId: string;
}

export interface LikeReviewOutput {
  liked: boolean;
  likesCount: number;
}

export class LikeReviewError extends Error {
  constructor(
    message: string,
    public code: 'REVIEW_NOT_FOUND'
  ) {
    super(message);
    this.name = 'LikeReviewError';
  }
}

@injectable()
export class LikeReviewUseCase {
  constructor(
    @inject(IReviewRepository as symbol)
    private reviewRepository: IReviewRepository
  ) {}

  async execute(input: LikeReviewInput): Promise<LikeReviewOutput> {
    // Check if review exists
    const review = await this.reviewRepository.findById(input.reviewId);
    if (!review) {
      throw new LikeReviewError('Review not found', 'REVIEW_NOT_FOUND');
    }

    // Check if user already liked
    const existingLike = await this.reviewRepository.findLike(input.userId, input.reviewId);

    let liked: boolean;

    if (existingLike) {
      // Unlike
      await this.reviewRepository.removeLike(input.userId, input.reviewId);
      liked = false;
    } else {
      // Like
      await this.reviewRepository.addLike({
        userId: input.userId,
        reviewId: input.reviewId,
      });
      liked = true;
    }

    // Get updated count
    const likesCount = await this.reviewRepository.getLikeCount(input.reviewId);

    return { liked, likesCount };
  }
}
