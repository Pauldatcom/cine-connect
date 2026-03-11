/**
 * Recommendations Routes
 * Personalized film recommendations for the authenticated user
 */

import { Router } from 'express';
import { z } from 'zod';
import { container } from 'tsyringe';

import { authenticate, getAuthUser } from '../middleware/auth.js';
import type { Film } from '../domain/entities/Film.js';
import { GetRecommendationsUseCase } from '../application/use-cases/recommendations/index.js';

export const recommendationsRouter = Router();

function filmToResponse(film: Film): Record<string, unknown> {
  return {
    id: film.id,
    tmdbId: film.tmdbId,
    title: film.title,
    year: film.year,
    poster: film.poster,
    plot: film.plot,
    director: film.director,
    actors: film.actors,
    genre: film.genre,
    runtime: film.runtime,
    tmdbRating: film.tmdbRating,
    createdAt: film.createdAt,
    updatedAt: film.updatedAt,
  };
}

const querySchema = z.object({
  limit: z
    .string()
    .optional()
    .transform((s) => (s ? parseInt(s, 10) : undefined)),
});

/**
 * @swagger
 * /api/v1/recommendations:
 *   get:
 *     tags: [Recommendations]
 *     summary: Get personalized film recommendations
 *     security:
 *       - bearerAuth: []
 */
recommendationsRouter.get('/', authenticate, async (req, res, next) => {
  try {
    const userId = getAuthUser(req).userId;
    const query = querySchema.safeParse(req.query);
    const limit =
      query.success && query.data.limit !== null && query.data.limit !== undefined
        ? query.data.limit
        : 20;

    const getRecommendations = container.resolve(GetRecommendationsUseCase);
    const { films } = await getRecommendations.execute({ userId, limit });

    res.set('Cache-Control', 'private, max-age=120'); // 2 min for personalized
    res.json({
      success: true,
      data: films.map(filmToResponse),
    });
  } catch (error) {
    next(error);
  }
});
