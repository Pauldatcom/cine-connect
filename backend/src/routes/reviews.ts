/**
 * Reviews Routes
 * Handles all review-related API endpoints using Clean Architecture
 */

import { Router } from 'express';
import { z } from 'zod';
import { container } from 'tsyringe';

import { authenticate, optionalAuth, getAuthUser, tryGetAuthUser } from '../middleware/auth.js';
import { ApiError } from '../middleware/errorHandler.js';
import { MIN_RATING, MAX_RATING, COMMENT_MAX_LENGTH } from '@cine-connect/shared';

import {
  CreateReviewUseCase,
  CreateReviewError,
  GetFilmReviewsUseCase,
  LikeReviewUseCase,
  LikeReviewError,
  CommentOnReviewUseCase,
  CommentOnReviewError,
  GetReviewCommentsUseCase,
  GetReviewCommentsError,
} from '../application/use-cases/reviews/index.js';
import { IReviewRepository } from '../domain/repositories/IReviewRepository.js';

export const reviewsRouter = Router();

// Validation schemas
const createReviewSchema = z.object({
  filmId: z.string().uuid(),
  rating: z.number().int().min(MIN_RATING).max(MAX_RATING),
  comment: z.string().max(COMMENT_MAX_LENGTH).optional(),
});

const updateReviewSchema = z.object({
  rating: z.number().int().min(MIN_RATING).max(MAX_RATING).optional(),
  comment: z.string().max(COMMENT_MAX_LENGTH).optional(),
});

const commentSchema = z.object({
  content: z.string().min(1).max(1000),
});

/**
 * @swagger
 * /api/v1/reviews:
 *   post:
 *     tags: [Reviews]
 *     summary: Create a new review
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [filmId, rating]
 *             properties:
 *               filmId:
 *                 type: string
 *                 format: uuid
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *     responses:
 *       201:
 *         description: Review created
 *       401:
 *         description: Unauthorized
 *       409:
 *         description: Already reviewed
 */
reviewsRouter.post('/', authenticate, async (req, res, next) => {
  try {
    const { filmId, rating, comment } = createReviewSchema.parse(req.body);
    const userId = getAuthUser(req).userId;

    const useCase = container.resolve(CreateReviewUseCase);
    const result = await useCase.execute({
      userId,
      filmId,
      rating,
      comment,
    });

    res.status(201).json({
      success: true,
      data: result.review.toJSON(),
    });
  } catch (error) {
    if (error instanceof CreateReviewError) {
      switch (error.code) {
        case 'ALREADY_REVIEWED':
          return next(ApiError.conflict(error.message));
        case 'FILM_NOT_FOUND':
          return next(ApiError.notFound(error.message));
        case 'INVALID_RATING':
        case 'INVALID_COMMENT':
          return next(ApiError.badRequest(error.message));
      }
    }
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/reviews/film/{filmId}:
 *   get:
 *     tags: [Reviews]
 *     summary: Get reviews for a film
 *     parameters:
 *       - in: path
 *         name: filmId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: List of reviews with pagination
 */
reviewsRouter.get('/film/:filmId', optionalAuth, async (req, res, next) => {
  try {
    const filmId = z.string().uuid().parse(req.params.filmId);
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const currentUserId = tryGetAuthUser(req)?.userId;

    const useCase = container.resolve(GetFilmReviewsUseCase);
    const result = await useCase.execute({
      filmId,
      page,
      pageSize,
      currentUserId,
    });

    res.json({
      success: true,
      data: result.reviews,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/reviews/user/{userId}:
 *   get:
 *     tags: [Reviews]
 *     summary: Get reviews by a user
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: List of reviews
 */
reviewsRouter.get('/user/:userId', optionalAuth, async (req, res, next) => {
  try {
    const userId = z.string().uuid().parse(req.params.userId);

    const reviewRepository = container.resolve<IReviewRepository>(IReviewRepository as symbol);
    const reviews = await reviewRepository.findByUserId(userId);

    res.json({
      success: true,
      data: reviews,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/reviews/{id}:
 *   get:
 *     tags: [Reviews]
 *     summary: Get a single review by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Review details
 *       404:
 *         description: Review not found
 */
reviewsRouter.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const id = z.string().uuid().parse(req.params.id);
    const currentUserId = tryGetAuthUser(req)?.userId;

    const reviewRepository = container.resolve<IReviewRepository>(IReviewRepository as symbol);
    const review = await reviewRepository.findByIdWithRelations(id, currentUserId);

    if (!review) {
      throw ApiError.notFound('Review not found');
    }

    res.json({
      success: true,
      data: review,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/reviews/{id}:
 *   patch:
 *     tags: [Reviews]
 *     summary: Update a review
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *     responses:
 *       200:
 *         description: Review updated
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Review not found
 */
reviewsRouter.patch('/:id', authenticate, async (req, res, next) => {
  try {
    const id = z.string().uuid().parse(req.params.id);
    const updates = updateReviewSchema.parse(req.body);
    const userId = getAuthUser(req).userId;

    const reviewRepository = container.resolve<IReviewRepository>(IReviewRepository as symbol);

    // Find review and verify ownership
    const review = await reviewRepository.findById(id);

    if (!review) {
      throw ApiError.notFound('Review not found');
    }

    if (review.userId !== userId) {
      throw ApiError.forbidden('You can only edit your own reviews');
    }

    // Update review
    const updated = await reviewRepository.update(id, updates);

    res.json({
      success: true,
      data: updated?.toJSON(),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/reviews/{id}:
 *   delete:
 *     tags: [Reviews]
 *     summary: Delete a review
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       204:
 *         description: Review deleted
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Review not found
 */
reviewsRouter.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const id = z.string().uuid().parse(req.params.id);
    const userId = getAuthUser(req).userId;

    const reviewRepository = container.resolve<IReviewRepository>(IReviewRepository as symbol);

    // Find review and verify ownership
    const review = await reviewRepository.findById(id);

    if (!review) {
      throw ApiError.notFound('Review not found');
    }

    if (review.userId !== userId) {
      throw ApiError.forbidden('You can only delete your own reviews');
    }

    await reviewRepository.delete(id);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// ==================== LIKES ====================

/**
 * @swagger
 * /api/v1/reviews/{id}/like:
 *   post:
 *     tags: [Reviews]
 *     summary: Toggle like on a review
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Like toggled
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Review not found
 */
reviewsRouter.post('/:id/like', authenticate, async (req, res, next) => {
  try {
    const reviewId = z.string().uuid().parse(req.params.id);
    const userId = getAuthUser(req).userId;

    const useCase = container.resolve(LikeReviewUseCase);
    const result = await useCase.execute({ userId, reviewId });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof LikeReviewError) {
      if (error.code === 'REVIEW_NOT_FOUND') {
        return next(ApiError.notFound(error.message));
      }
    }
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/reviews/{id}/likes:
 *   get:
 *     tags: [Reviews]
 *     summary: Get users who liked a review
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: List of users who liked the review
 */
reviewsRouter.get('/:id/likes', async (req, res, next) => {
  try {
    const reviewId = z.string().uuid().parse(req.params.id);
    const limit = parseInt(req.query.limit as string) || 10;

    const reviewRepository = container.resolve<IReviewRepository>(IReviewRepository as symbol);

    const [users, count] = await Promise.all([
      reviewRepository.getLikeUsers(reviewId, limit),
      reviewRepository.getLikeCount(reviewId),
    ]);

    res.json({
      success: true,
      data: {
        users,
        count,
      },
    });
  } catch (error) {
    next(error);
  }
});

// ==================== COMMENTS ====================

/**
 * @swagger
 * /api/v1/reviews/{id}/comments:
 *   post:
 *     tags: [Reviews]
 *     summary: Add a comment to a review
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content:
 *                 type: string
 *                 maxLength: 1000
 *     responses:
 *       201:
 *         description: Comment added
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Review not found
 */
reviewsRouter.post('/:id/comments', authenticate, async (req, res, next) => {
  try {
    const reviewId = z.string().uuid().parse(req.params.id);
    const { content } = commentSchema.parse(req.body);
    const userId = getAuthUser(req).userId;

    const useCase = container.resolve(CommentOnReviewUseCase);
    const result = await useCase.execute({ userId, reviewId, content });

    res.status(201).json({
      success: true,
      data: {
        comment: result.comment.toJSON(),
        commentsCount: result.commentsCount,
      },
    });
  } catch (error) {
    if (error instanceof CommentOnReviewError) {
      switch (error.code) {
        case 'REVIEW_NOT_FOUND':
          return next(ApiError.notFound(error.message));
        case 'INVALID_CONTENT':
          return next(ApiError.badRequest(error.message));
      }
    }
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/reviews/{id}/comments:
 *   get:
 *     tags: [Reviews]
 *     summary: Get comments for a review
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: List of comments with pagination
 *       404:
 *         description: Review not found
 */
reviewsRouter.get('/:id/comments', async (req, res, next) => {
  try {
    const reviewId = z.string().uuid().parse(req.params.id);
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;

    const useCase = container.resolve(GetReviewCommentsUseCase);
    const result = await useCase.execute({ reviewId, page, pageSize });

    res.json({
      success: true,
      data: result.comments,
    });
  } catch (error) {
    if (error instanceof GetReviewCommentsError) {
      if (error.code === 'REVIEW_NOT_FOUND') {
        return next(ApiError.notFound(error.message));
      }
    }
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/reviews/{reviewId}/comments/{commentId}:
 *   delete:
 *     tags: [Reviews]
 *     summary: Delete a comment
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       204:
 *         description: Comment deleted
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Comment not found
 */
reviewsRouter.delete('/:reviewId/comments/:commentId', authenticate, async (req, res, next) => {
  try {
    const commentId = z.string().uuid().parse(req.params.commentId);
    const userId = getAuthUser(req).userId;

    const reviewRepository = container.resolve<IReviewRepository>(IReviewRepository as symbol);

    const comment = await reviewRepository.findCommentById(commentId);

    if (!comment) {
      throw ApiError.notFound('Comment not found');
    }

    if (comment.userId !== userId) {
      throw ApiError.forbidden('You can only delete your own comments');
    }

    await reviewRepository.deleteComment(commentId);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});
