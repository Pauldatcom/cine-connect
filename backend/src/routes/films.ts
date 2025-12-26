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
 * /api/v1/films/tmdb/{tmdbId}:
 *   get:
 *     tags: [Films]
 *     summary: Get film by TMDb ID
 *     parameters:
 *       - in: path
 *         name: tmdbId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: ^\d+$
 *     responses:
 *       200:
 *         description: Film details
 *       404:
 *         description: Film not found
 */
filmsRouter.get('/tmdb/:tmdbId', optionalAuth, async (req, res, next) => {
  try {
    const { tmdbId } = tmdbIdParamSchema.parse(req.params);
    const tmdbIdNum = parseInt(tmdbId, 10);

    const film = await db.query.films.findFirst({
      where: eq(schema.films.tmdbId, tmdbIdNum),
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

/**
 * @swagger
 * /api/v1/films/tmdb:
 *   post:
 *     tags: [Films]
 *     summary: Register a film from TMDb (get or create)
 *     description: Creates a film record if it doesn't exist, or returns existing one
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [tmdbId, title]
 *             properties:
 *               tmdbId:
 *                 type: integer
 *               title:
 *                 type: string
 *               year:
 *                 type: string
 *               poster:
 *                 type: string
 *               plot:
 *                 type: string
 *               director:
 *                 type: string
 *               genre:
 *                 type: string
 *               runtime:
 *                 type: string
 *     responses:
 *       200:
 *         description: Existing film returned
 *       201:
 *         description: New film created
 */
filmsRouter.post('/tmdb', async (req, res, next) => {
  try {
    const data = registerFilmSchema.parse(req.body);

    // Check if film already exists
    const existingFilm = await db.query.films.findFirst({
      where: eq(schema.films.tmdbId, data.tmdbId),
    });

    if (existingFilm) {
      res.json({
        success: true,
        data: existingFilm,
        created: false,
      });
      return;
    }

    // Create new film
    const [newFilm] = await db
      .insert(schema.films)
      .values({
        tmdbId: data.tmdbId,
        title: data.title,
        year: data.year ?? null,
        poster: data.poster ?? null,
        plot: data.plot ?? null,
        director: data.director ?? null,
        genre: data.genre ?? null,
        runtime: data.runtime ?? null,
      })
      .returning();

    res.status(201).json({
      success: true,
      data: newFilm,
      created: true,
    });
  } catch (error) {
    next(error);
  }
});
