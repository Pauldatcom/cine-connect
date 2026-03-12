/**
 * Films Routes
 * Uses IFilmRepository, RegisterFilmUseCase, IReviewRepository (clean architecture)
 */

import { Router } from 'express';
import { z } from 'zod';
import { container } from 'tsyringe';

import { optionalAuth } from '../middleware/auth.js';
import { ApiError } from '../middleware/errorHandler.js';
import type { Film } from '../domain/entities/Film.js';
import { IFilmRepository } from '../domain/repositories/IFilmRepository.js';
import { IReviewRepository } from '../domain/repositories/IReviewRepository.js';
import { RegisterFilmUseCase } from '../application/use-cases/films/index.js';

export const filmsRouter = Router();

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

const uuidParamSchema = z.object({
  id: z.string().uuid(),
});

const tmdbIdParamSchema = z.object({
  tmdbId: z.string().regex(/^\d+$/, 'Invalid TMDb ID format'),
});

const registerFilmSchema = z.object({
  tmdbId: z.number().int().positive(),
  title: z.string().min(1).max(500),
  year: z.string().max(10).optional().nullable(),
  poster: z.string().optional().nullable(),
  plot: z.string().optional().nullable(),
  director: z.string().max(500).optional().nullable(),
  genre: z.string().max(500).optional().nullable(),
  runtime: z.string().max(50).optional().nullable(),
});

/**
 * @swagger
 * /api/v1/films:
 *   get:
 *     tags: [Films]
 *     summary: Get all films with optional filtering
 */
filmsRouter.get('/', optionalAuth, async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const search = (req.query.search as string) || undefined;
    const genre = (req.query.genre as string) || undefined;

    const filmRepo = container.resolve<IFilmRepository>(IFilmRepository as symbol);
    const result = await filmRepo.findAllPaginated({ page, limit, search, genre });

    res.set('Cache-Control', 'public, max-age=60'); // 1 min for list
    res.json({
      success: true,
      data: {
        items: result.items.map(filmToResponse),
        page: result.page,
        pageSize: result.pageSize,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/films/{id}:
 *   get:
 *     tags: [Films]
 *     summary: Get film by ID
 */
filmsRouter.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const { id } = uuidParamSchema.parse(req.params);

    const filmRepo = container.resolve<IFilmRepository>(IFilmRepository as symbol);
    const film = await filmRepo.findById(id);

    if (!film) {
      throw ApiError.notFound('Film not found');
    }

    const reviewRepo = container.resolve<IReviewRepository>(IReviewRepository as symbol);
    const reviewsResult = await reviewRepo.findByFilmId(id, 1, 10);

    res.set('Cache-Control', 'public, max-age=300'); // 5 min for film detail + reviews
    res.json({
      success: true,
      data: {
        ...filmToResponse(film),
        reviews: reviewsResult.items,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/films/tmdb/{tmdbId}:
 *   get:
 *     tags: [Films]
 *     summary: Get film by TMDb ID
 */
filmsRouter.get('/tmdb/:tmdbId', optionalAuth, async (req, res, next) => {
  try {
    const { tmdbId } = tmdbIdParamSchema.parse(req.params);
    const tmdbIdNum = parseInt(tmdbId, 10);

    const filmRepo = container.resolve<IFilmRepository>(IFilmRepository as symbol);
    const film = await filmRepo.findByTmdbId(tmdbIdNum);

    if (!film) {
      throw ApiError.notFound('Film not found in database');
    }

    res.set('Cache-Control', 'public, max-age=300'); // 5 min for film by TMDb ID
    res.json({
      success: true,
      data: filmToResponse(film),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/films/tmdb:
 *   post:
 *     tags: [Films]
 *     summary: Register a film from TMDb (get or create)
 */
filmsRouter.post('/tmdb', async (req, res, next) => {
  try {
    const data = registerFilmSchema.parse(req.body);

    const registerFilm = container.resolve(RegisterFilmUseCase);
    const { film, created } = await registerFilm.execute({
      tmdbId: data.tmdbId,
      title: data.title,
      year: data.year ?? undefined,
      poster: data.poster ?? undefined,
      plot: data.plot ?? undefined,
      director: data.director ?? undefined,
      genre: data.genre ?? undefined,
      runtime: data.runtime ?? undefined,
    });

    if (created) {
      res.status(201).json({
        success: true,
        data: filmToResponse(film),
        created: true,
      });
    } else {
      res.json({
        success: true,
        data: filmToResponse(film),
        created: false,
      });
    }
  } catch (error) {
    next(error);
  }
});
