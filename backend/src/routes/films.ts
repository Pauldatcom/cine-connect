import { Router } from 'express';
import { z } from 'zod';
import { eq, ilike, desc } from 'drizzle-orm';
import { db, schema } from '../db/index.js';
import { optionalAuth } from '../middleware/auth.js';
import { ApiError } from '../middleware/errorHandler.js';

export const filmsRouter = Router();

// Validation schemas
const uuidParamSchema = z.object({
  id: z.string().uuid(),
});

const imdbIdParamSchema = z.object({
  imdbId: z.string().regex(/^tt\d{7,}$/, 'Invalid IMDb ID format'),
});

/**
 * @swagger
 * /api/v1/films:
 *   get:
 *     tags: [Films]
 *     summary: Get all films with optional filtering
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: genre
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of films
 */
filmsRouter.get('/', optionalAuth, async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const search = req.query.search as string;
    const genre = req.query.genre as string;
    const offset = (page - 1) * limit;

    // Build query conditions
    let query = db.select().from(schema.films);

    if (search) {
      query = query.where(ilike(schema.films.title, `%${search}%`)) as typeof query;
    }

    if (genre) {
      query = query.where(ilike(schema.films.genre, `%${genre}%`)) as typeof query;
    }

    const films = await query.orderBy(desc(schema.films.createdAt)).limit(limit).offset(offset);

    res.json({
      success: true,
      data: {
        items: films,
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
 * /api/v1/films/{id}:
 *   get:
 *     tags: [Films]
 *     summary: Get film by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Film details
 *       400:
 *         description: Invalid ID format
 *       404:
 *         description: Film not found
 */
filmsRouter.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const { id } = uuidParamSchema.parse(req.params);

    const film = await db.query.films.findFirst({
      where: eq(schema.films.id, id),
      with: {
        reviews: {
          with: {
            user: {
              columns: {
                id: true,
                username: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: (reviews, { desc }) => [desc(reviews.createdAt)],
          limit: 10,
        },
      },
    });

    if (!film) {
      throw ApiError.notFound('Film not found');
    }

    res.json({
      success: true,
      data: film,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/films/imdb/{imdbId}:
 *   get:
 *     tags: [Films]
 *     summary: Get or create film by IMDb ID
 *     parameters:
 *       - in: path
 *         name: imdbId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: ^tt\d{7,}$
 *     responses:
 *       200:
 *         description: Film details
 *       400:
 *         description: Invalid IMDb ID format
 *       404:
 *         description: Film not found
 */
filmsRouter.get('/imdb/:imdbId', optionalAuth, async (req, res, next) => {
  try {
    const { imdbId } = imdbIdParamSchema.parse(req.params);

    // Check if film exists in our database
    const film = await db.query.films.findFirst({
      where: eq(schema.films.imdbId, imdbId),
    });

    if (!film) {
      throw ApiError.notFound('Film not found in database');
    }

    res.json({
      success: true,
      data: film,
    });
  } catch (error) {
    next(error);
  }
});
