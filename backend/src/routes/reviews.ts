import { Router } from 'express';
import { z } from 'zod';
import { eq, and, desc } from 'drizzle-orm';
import { db, schema } from '../db/index.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { ApiError } from '../middleware/errorHandler.js';
import { MIN_RATING, MAX_RATING, COMMENT_MAX_LENGTH } from '@cine-connect/shared';

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
 */
reviewsRouter.post('/', authenticate, async (req, res, next) => {
  try {
    const { filmId, rating, comment } = createReviewSchema.parse(req.body);
    const userId = req.user!.userId;

    // Check if user already reviewed this film
    const existingReview = await db.query.reviews.findFirst({
      where: and(eq(schema.reviews.userId, userId), eq(schema.reviews.filmId, filmId)),
    });

    if (existingReview) {
      throw ApiError.conflict('You have already reviewed this film');
    }

    // Check if film exists
    const film = await db.query.films.findFirst({
      where: eq(schema.films.id, filmId),
    });

    if (!film) {
      throw ApiError.notFound('Film not found');
    }

    // Create review
    const [review] = await db
      .insert(schema.reviews)
      .values({
        userId,
        filmId,
        rating,
        comment,
      })
      .returning();

    res.status(201).json({
      success: true,
      data: review,
    });
  } catch (error) {
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
 *     responses:
 *       200:
 *         description: List of reviews
 */
reviewsRouter.get('/film/:filmId', optionalAuth, async (req, res, next) => {
  try {
    const { filmId } = req.params;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = 20;
    const offset = (page - 1) * limit;

    const reviews = await db.query.reviews.findMany({
      where: eq(schema.reviews.filmId, filmId),
      with: {
        user: {
          columns: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: [desc(schema.reviews.createdAt)],
      limit,
      offset,
    });

    res.json({
      success: true,
      data: {
        items: reviews,
        page,
        pageSize: limit,
      },
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
    const { userId } = req.params;

    const reviews = await db.query.reviews.findMany({
      where: eq(schema.reviews.userId, userId),
      with: {
        film: {
          columns: {
            id: true,
            title: true,
            poster: true,
            year: true,
          },
        },
      },
      orderBy: [desc(schema.reviews.createdAt)],
      limit: 50,
    });

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
 *     responses:
 *       200:
 *         description: Review updated
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Review not found
 */
reviewsRouter.patch('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = updateReviewSchema.parse(req.body);
    const userId = req.user!.userId;

    // Find review and verify ownership
    const review = await db.query.reviews.findFirst({
      where: eq(schema.reviews.id, id),
    });

    if (!review) {
      throw ApiError.notFound('Review not found');
    }

    if (review.userId !== userId) {
      throw ApiError.forbidden('You can only edit your own reviews');
    }

    // Update review
    const [updated] = await db
      .update(schema.reviews)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(schema.reviews.id, id))
      .returning();

    res.json({
      success: true,
      data: updated,
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
 *       404:
 *         description: Review not found
 */
reviewsRouter.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    // Find review and verify ownership
    const review = await db.query.reviews.findFirst({
      where: eq(schema.reviews.id, id),
    });

    if (!review) {
      throw ApiError.notFound('Review not found');
    }

    if (review.userId !== userId) {
      throw ApiError.forbidden('You can only delete your own reviews');
    }

    await db.delete(schema.reviews).where(eq(schema.reviews.id, id));

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});
