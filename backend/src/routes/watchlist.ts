/**
 * Watchlist Routes
 * Handles all watchlist-related API endpoints using Clean Architecture
 */

import { Router } from 'express';
import { z } from 'zod';
import { container } from 'tsyringe';

import { authenticate, getAuthUser } from '../middleware/auth.js';
import { ApiError } from '../middleware/errorHandler.js';

import {
  AddToWatchlistUseCase,
  AddToWatchlistError,
  RemoveFromWatchlistUseCase,
  RemoveFromWatchlistError,
  GetUserWatchlistUseCase,
  CheckWatchlistUseCase,
} from '../application/use-cases/watchlist/index.js';

export const watchlistRouter = Router();

// Validation schemas
const addToWatchlistSchema = z.object({
  filmId: z.string().uuid(),
});

/**
 * @swagger
 * /api/v1/watchlist:
 *   get:
 *     tags: [Watchlist]
 *     summary: Get current user's watchlist
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User's watchlist
 *       401:
 *         description: Unauthorized
 */
watchlistRouter.get('/', authenticate, async (req, res, next) => {
  try {
    const userId = getAuthUser(req).userId;

    const useCase = container.resolve(GetUserWatchlistUseCase);
    const result = await useCase.execute({ userId });

    res.json({
      success: true,
      data: {
        items: result.items,
        count: result.count,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/watchlist:
 *   post:
 *     tags: [Watchlist]
 *     summary: Add a film to watchlist
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [filmId]
 *             properties:
 *               filmId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Film added to watchlist
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Film not found
 *       409:
 *         description: Film already in watchlist
 */
watchlistRouter.post('/', authenticate, async (req, res, next) => {
  try {
    const { filmId } = addToWatchlistSchema.parse(req.body);
    const userId = getAuthUser(req).userId;

    const useCase = container.resolve(AddToWatchlistUseCase);
    const result = await useCase.execute({ userId, filmId });

    res.status(201).json({
      success: true,
      data: result.watchlistItem.toJSON(),
    });
  } catch (error) {
    if (error instanceof AddToWatchlistError) {
      switch (error.code) {
        case 'FILM_NOT_FOUND':
          return next(ApiError.notFound(error.message));
        case 'ALREADY_IN_WATCHLIST':
          return next(ApiError.conflict(error.message));
      }
    }
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/watchlist/{filmId}:
 *   delete:
 *     tags: [Watchlist]
 *     summary: Remove a film from watchlist
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: filmId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       204:
 *         description: Film removed from watchlist
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Film not in watchlist
 */
watchlistRouter.delete('/:filmId', authenticate, async (req, res, next) => {
  try {
    const filmId = z.string().uuid().parse(req.params.filmId);
    const userId = getAuthUser(req).userId;

    const useCase = container.resolve(RemoveFromWatchlistUseCase);
    await useCase.execute({ userId, filmId });

    res.status(204).send();
  } catch (error) {
    if (error instanceof RemoveFromWatchlistError) {
      if (error.code === 'NOT_IN_WATCHLIST') {
        return next(ApiError.notFound(error.message));
      }
    }
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/watchlist/check/{filmId}:
 *   get:
 *     tags: [Watchlist]
 *     summary: Check if a film is in the user's watchlist
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: filmId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Watchlist status
 *       401:
 *         description: Unauthorized
 */
watchlistRouter.get('/check/:filmId', authenticate, async (req, res, next) => {
  try {
    const filmId = z.string().uuid().parse(req.params.filmId);
    const userId = getAuthUser(req).userId;

    const useCase = container.resolve(CheckWatchlistUseCase);
    const result = await useCase.execute({ userId, filmId });

    res.json({
      success: true,
      data: {
        isInWatchlist: result.isInWatchlist,
      },
    });
  } catch (error) {
    next(error);
  }
});
