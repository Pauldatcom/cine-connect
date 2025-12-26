/**
 * ReviewLike Domain Entity
 * Represents a user liking a review
 */

export interface ReviewLikeProps {
  id: string;
  userId: string;
  reviewId: string;
  createdAt: Date;
}

export interface CreateReviewLikeProps {
  userId: string;
  reviewId: string;
}

export class ReviewLike {
  readonly id: string;
  readonly userId: string;
  readonly reviewId: string;
  readonly createdAt: Date;

  constructor(props: ReviewLikeProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.reviewId = props.reviewId;
    this.createdAt = props.createdAt;
  }

  toJSON(): ReviewLikeProps {
    return {
      id: this.id,
      userId: this.userId,
      reviewId: this.reviewId,
      createdAt: this.createdAt,
    };
  }
}
