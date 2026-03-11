/**
 * Drizzle Review Repository Implementation
 */

import { and, count, desc, eq } from 'drizzle-orm';
import { injectable } from 'tsyringe';

import { db, schema } from '../../db/index.js';
import {
  Review,
  type CreateReviewProps,
  type ReviewWithRelations,
  type UpdateReviewProps,
} from '../../domain/entities/Review.js';
import {
  ReviewComment,
  type CreateReviewCommentProps,
  type ReviewCommentWithUser,
} from '../../domain/entities/ReviewComment.js';
import { ReviewLike, type CreateReviewLikeProps } from '../../domain/entities/ReviewLike.js';
import type {
  IReviewRepository,
  PaginatedResult,
} from '../../domain/repositories/IReviewRepository.js';

@injectable()
export class DrizzleReviewRepository implements IReviewRepository {
  // ----- Reviews -----

  async findById(id: string): Promise<Review | null> {
    const result = await db.query.reviews.findFirst({
      where: eq(schema.reviews.id, id),
    });

    return result ? this.toReviewDomain(result) : null;
  }

  async findByIdWithRelations(
    id: string,
    currentUserId?: string
  ): Promise<ReviewWithRelations | null> {
    const result = await db.query.reviews.findFirst({
      where: eq(schema.reviews.id, id),
      with: {
        user: {
          columns: { id: true, username: true, avatarUrl: true },
        },
        film: {
          columns: { id: true, tmdbId: true, title: true, poster: true, year: true },
        },
      },
    });

    if (!result) return null;

    const [likesCount, commentsCount, userLike] = await Promise.all([
      this.getLikeCount(id),
      this.getCommentCount(id),
      currentUserId ? this.findLike(currentUserId, id) : null,
    ]);

    return {
      ...this.toReviewDomain(result).toJSON(),
      user: result.user,
      film: result.film,
      likesCount,
      commentsCount,
      isLikedByCurrentUser: !!userLike,
    };
  }

  async findByUserAndFilm(userId: string, filmId: string): Promise<Review | null> {
    const result = await db.query.reviews.findFirst({
      where: and(eq(schema.reviews.userId, userId), eq(schema.reviews.filmId, filmId)),
    });

    return result ? this.toReviewDomain(result) : null;
  }

  async findByFilmId(
    filmId: string,
    page: number,
    pageSize: number,
    currentUserId?: string
  ): Promise<PaginatedResult<ReviewWithRelations>> {
    const offset = (page - 1) * pageSize;

    const [reviews, totalResult] = await Promise.all([
      db.query.reviews.findMany({
        where: eq(schema.reviews.filmId, filmId),
        with: {
          user: {
            columns: { id: true, username: true, avatarUrl: true },
          },
        },
        orderBy: [desc(schema.reviews.createdAt)],
        limit: pageSize,
        offset,
      }),
      db.select({ count: count() }).from(schema.reviews).where(eq(schema.reviews.filmId, filmId)),
    ]);

    const total = totalResult[0]?.count ?? 0;

    // Get likes/comments counts and user like status for each review
    const enrichedReviews = await Promise.all(
      reviews.map(async (review) => {
        const [likesCount, commentsCount, userLike] = await Promise.all([
          this.getLikeCount(review.id),
          this.getCommentCount(review.id),
          currentUserId ? this.findLike(currentUserId, review.id) : null,
        ]);

        return {
          ...this.toReviewDomain(review).toJSON(),
          user: review.user,
          likesCount,
          commentsCount,
          isLikedByCurrentUser: !!userLike,
        };
      })
    );

    return {
      items: enrichedReviews,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findByUserId(userId: string, limit = 50): Promise<ReviewWithRelations[]> {
    const reviews = await db.query.reviews.findMany({
      where: eq(schema.reviews.userId, userId),
      with: {
        film: {
          columns: { id: true, tmdbId: true, title: true, poster: true, year: true, genre: true },
        },
      },
      orderBy: [desc(schema.reviews.createdAt)],
      limit,
    });

    return Promise.all(
      reviews.map(async (review) => {
        const [likesCount, commentsCount] = await Promise.all([
          this.getLikeCount(review.id),
          this.getCommentCount(review.id),
        ]);

        return {
          ...this.toReviewDomain(review).toJSON(),
          film: review.film,
          likesCount,
          commentsCount,
        };
      })
    );
  }

  async create(data: CreateReviewProps): Promise<Review> {
    const [result] = await db
      .insert(schema.reviews)
      .values({
        userId: data.userId,
        filmId: data.filmId,
        rating: data.rating,
        comment: data.comment ?? null,
      })
      .returning();

    if (!result) {
      throw new Error('Failed to create review');
    }

    return this.toReviewDomain(result);
  }

  async update(id: string, data: UpdateReviewProps): Promise<Review | null> {
    const [result] = await db
      .update(schema.reviews)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(schema.reviews.id, id))
      .returning();

    return result ? this.toReviewDomain(result) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await db.delete(schema.reviews).where(eq(schema.reviews.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // ----- Likes -----

  async findLike(userId: string, reviewId: string): Promise<ReviewLike | null> {
    const result = await db.query.reviewLikes.findFirst({
      where: and(eq(schema.reviewLikes.userId, userId), eq(schema.reviewLikes.reviewId, reviewId)),
    });

    return result ? this.toLikeDomain(result) : null;
  }

  async addLike(data: CreateReviewLikeProps): Promise<ReviewLike> {
    const [result] = await db
      .insert(schema.reviewLikes)
      .values({
        userId: data.userId,
        reviewId: data.reviewId,
      })
      .returning();

    if (!result) {
      throw new Error('Failed to add like');
    }

    return this.toLikeDomain(result);
  }

  async removeLike(userId: string, reviewId: string): Promise<boolean> {
    const result = await db
      .delete(schema.reviewLikes)
      .where(and(eq(schema.reviewLikes.userId, userId), eq(schema.reviewLikes.reviewId, reviewId)));

    return (result.rowCount ?? 0) > 0;
  }

  async getLikeCount(reviewId: string): Promise<number> {
    const result = await db
      .select({ count: count() })
      .from(schema.reviewLikes)
      .where(eq(schema.reviewLikes.reviewId, reviewId));

    return result[0]?.count ?? 0;
  }

  async getLikeUsers(
    reviewId: string,
    limit = 10
  ): Promise<{ id: string; username: string; avatarUrl: string | null }[]> {
    const likes = await db.query.reviewLikes.findMany({
      where: eq(schema.reviewLikes.reviewId, reviewId),
      with: {
        user: {
          columns: { id: true, username: true, avatarUrl: true },
        },
      },
      limit,
      orderBy: [desc(schema.reviewLikes.createdAt)],
    });

    return likes.map((like) => like.user);
  }

  // ----- Comments -----

  async findCommentById(id: string): Promise<ReviewComment | null> {
    const result = await db.query.reviewComments.findFirst({
      where: eq(schema.reviewComments.id, id),
    });

    return result ? this.toCommentDomain(result) : null;
  }

  async getComments(
    reviewId: string,
    page: number,
    pageSize: number
  ): Promise<PaginatedResult<ReviewCommentWithUser>> {
    const offset = (page - 1) * pageSize;

    const [comments, totalResult] = await Promise.all([
      db.query.reviewComments.findMany({
        where: eq(schema.reviewComments.reviewId, reviewId),
        with: {
          user: {
            columns: { id: true, username: true, avatarUrl: true },
          },
        },
        orderBy: [desc(schema.reviewComments.createdAt)],
        limit: pageSize,
        offset,
      }),
      db
        .select({ count: count() })
        .from(schema.reviewComments)
        .where(eq(schema.reviewComments.reviewId, reviewId)),
    ]);

    const total = totalResult[0]?.count ?? 0;

    return {
      items: comments.map((comment) => ({
        ...this.toCommentDomain(comment).toJSON(),
        user: comment.user,
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async addComment(data: CreateReviewCommentProps): Promise<ReviewComment> {
    const [result] = await db
      .insert(schema.reviewComments)
      .values({
        userId: data.userId,
        reviewId: data.reviewId,
        content: data.content,
      })
      .returning();

    if (!result) {
      throw new Error('Failed to add comment');
    }

    return this.toCommentDomain(result);
  }

  async deleteComment(id: string): Promise<boolean> {
    const result = await db.delete(schema.reviewComments).where(eq(schema.reviewComments.id, id));

    return (result.rowCount ?? 0) > 0;
  }

  async getCommentCount(reviewId: string): Promise<number> {
    const result = await db
      .select({ count: count() })
      .from(schema.reviewComments)
      .where(eq(schema.reviewComments.reviewId, reviewId));

    return result[0]?.count ?? 0;
  }

  // ----- Mapping -----

  private toReviewDomain(row: typeof schema.reviews.$inferSelect): Review {
    return new Review({
      id: row.id,
      userId: row.userId,
      filmId: row.filmId,
      rating: row.rating,
      comment: row.comment,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  private toLikeDomain(row: typeof schema.reviewLikes.$inferSelect): ReviewLike {
    return new ReviewLike({
      id: row.id,
      userId: row.userId,
      reviewId: row.reviewId,
      createdAt: row.createdAt,
    });
  }

  private toCommentDomain(row: typeof schema.reviewComments.$inferSelect): ReviewComment {
    return new ReviewComment({
      id: row.id,
      userId: row.userId,
      reviewId: row.reviewId,
      content: row.content,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
