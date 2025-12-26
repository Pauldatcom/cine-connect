/**
 * ReviewComment Domain Entity
 * Represents a comment on a review
 */

export interface ReviewCommentProps {
  id: string;
  userId: string;
  reviewId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateReviewCommentProps {
  userId: string;
  reviewId: string;
  content: string;
}

export interface ReviewCommentWithUser extends ReviewCommentProps {
  user: {
    id: string;
    username: string;
    avatarUrl: string | null;
  };
}

export class ReviewComment {
  readonly id: string;
  readonly userId: string;
  readonly reviewId: string;
  readonly content: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(props: ReviewCommentProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.reviewId = props.reviewId;
    this.content = props.content;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  /**
   * Validates comment content
   */
  static isValidContent(content: string): boolean {
    return content.length > 0 && content.length <= 1000;
  }

  toJSON(): ReviewCommentProps {
    return {
      id: this.id,
      userId: this.userId,
      reviewId: this.reviewId,
      content: this.content,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
