/**
 * Films Routes Unit Tests
 */

// Must import reflect-metadata FIRST before any tsyringe usage
import 'reflect-metadata';

import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import request from 'supertest';
import { createApp } from '@/app';

// Valid UUIDs for testing
const FILM_ID = '11111111-1111-1111-1111-111111111111';
const NONEXISTENT_ID = '99999999-9999-9999-9999-999999999999';

// Mock the database module
vi.mock('@/db/index.js', () => {
  const mockFilms = {
    id: 'id',
    tmdbId: 'tmdbId',
    title: 'title',
    year: 'year',
    poster: 'poster',
    plot: 'plot',
    director: 'director',
    actors: 'actors',
    genre: 'genre',
    runtime: 'runtime',
    tmdbRating: 'tmdbRating',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
  };

  return {
    db: {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnThis(),
          orderBy: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          offset: vi.fn().mockResolvedValue([]),
        }),
      }),
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([]),
        }),
      }),
      query: {
        films: {
          findFirst: vi.fn(),
        },
      },
    },
    schema: {
      films: mockFilms,
    },
  };
});

import { db } from '@/db/index.js';

describe('Films Routes', () => {
  const app = createApp();

  const mockFilm = {
    id: FILM_ID,
    tmdbId: 12345,
    title: 'Test Movie',
    year: '2024',
    poster: 'https://example.com/poster.jpg',
    plot: 'A great movie',
    director: 'Test Director',
    actors: 'Actor 1, Actor 2',
    genre: 'Action, Drama',
    runtime: '120 min',
    tmdbRating: '8.5',
    createdAt: new Date(),
    updatedAt: new Date(),
    reviews: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/v1/films', () => {
    it('should return list of films', async () => {
      (db.select as Mock).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnThis(),
          orderBy: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          offset: vi.fn().mockResolvedValue([mockFilm]),
        }),
      });

      const response = await request(app).get('/api/v1/films').expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toHaveLength(1);
      expect(response.body.data.page).toBe(1);
    });

    it('should handle pagination parameters', async () => {
      (db.select as Mock).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnThis(),
          orderBy: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          offset: vi.fn().mockResolvedValue([]),
        }),
      });

      const response = await request(app).get('/api/v1/films?page=2&limit=10').expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.page).toBe(2);
      expect(response.body.data.pageSize).toBe(10);
    });

    it('should handle search parameter', async () => {
      (db.select as Mock).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnThis(),
          orderBy: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          offset: vi.fn().mockResolvedValue([mockFilm]),
        }),
      });

      const response = await request(app).get('/api/v1/films?search=Test').expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should handle genre filter', async () => {
      (db.select as Mock).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnThis(),
          orderBy: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          offset: vi.fn().mockResolvedValue([mockFilm]),
        }),
      });

      const response = await request(app).get('/api/v1/films?genre=Action').expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should clamp pagination values', async () => {
      (db.select as Mock).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnThis(),
          orderBy: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          offset: vi.fn().mockResolvedValue([]),
        }),
      });

      // Page 0 should become 1
      const response = await request(app).get('/api/v1/films?page=0&limit=200').expect(200);

      expect(response.body.data.page).toBe(1);
      expect(response.body.data.pageSize).toBe(100); // Clamped to max
    });
  });

  describe('GET /api/v1/films/:id', () => {
    it('should return film by ID', async () => {
      (db.query.films.findFirst as Mock).mockResolvedValue(mockFilm);

      const response = await request(app).get(`/api/v1/films/${FILM_ID}`).expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(FILM_ID);
      expect(response.body.data.title).toBe('Test Movie');
    });

    it('should return 404 if film not found', async () => {
      (db.query.films.findFirst as Mock).mockResolvedValue(null);

      const response = await request(app).get(`/api/v1/films/${NONEXISTENT_ID}`).expect(404);

      expect(response.body.success).toBe(false);
    });

    // improve the error case using not a generic 400 but to be more accurate.

    it('should return 400 for invalid UUID', async () => {
      const response = await request(app).get('/api/v1/films/not-a-uuid').expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/films/tmdb/:tmdbId', () => {
    it('should return film by TMDb ID', async () => {
      (db.query.films.findFirst as Mock).mockResolvedValue(mockFilm);

      const response = await request(app).get('/api/v1/films/tmdb/12345').expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tmdbId).toBe(12345);
    });

    it('should return 404 if film not in database', async () => {
      (db.query.films.findFirst as Mock).mockResolvedValue(null);

      const response = await request(app).get('/api/v1/films/tmdb/99999').expect(404);

      expect(response.body.success).toBe(false);
    });
    // improve the error case using not a generic 400 but to be more accurate.

    it('should return 400 for invalid TMDb ID format', async () => {
      const response = await request(app).get('/api/v1/films/tmdb/not-a-number').expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/films/tmdb', () => {
    const validFilmData = {
      tmdbId: 550,
      title: 'Fight Club',
      year: '1999',
      poster: '/poster.jpg',
      plot: 'An insomniac office worker...',
      director: 'David Fincher',
      genre: 'Drama',
      runtime: '139 min',
    };

    it('should return existing film if already registered', async () => {
      (db.query.films.findFirst as Mock).mockResolvedValue({
        id: FILM_ID,
        ...validFilmData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const response = await request(app)
        .post('/api/v1/films/tmdb')
        .send(validFilmData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.created).toBe(false);
      expect(response.body.data.tmdbId).toBe(550);
    });

    it('should create new film if not exists', async () => {
      (db.query.films.findFirst as Mock).mockResolvedValue(null);

      const newFilm = {
        id: FILM_ID,
        ...validFilmData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (db.insert as Mock).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([newFilm]),
        }),
      });

      const response = await request(app)
        .post('/api/v1/films/tmdb')
        .send(validFilmData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.created).toBe(true);
      expect(response.body.data.title).toBe('Fight Club');
    });

    it('should create film with minimal required fields', async () => {
      (db.query.films.findFirst as Mock).mockResolvedValue(null);

      const minimalFilm = {
        id: FILM_ID,
        tmdbId: 123,
        title: 'Minimal Film',
        year: null,
        poster: null,
        plot: null,
        director: null,
        genre: null,
        runtime: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (db.insert as Mock).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([minimalFilm]),
        }),
      });

      const response = await request(app)
        .post('/api/v1/films/tmdb')
        .send({ tmdbId: 123, title: 'Minimal Film' })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.created).toBe(true);
    });

    it('should return 400 for missing tmdbId', async () => {
      const response = await request(app)
        .post('/api/v1/films/tmdb')
        .send({ title: 'No TMDb ID' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for missing title', async () => {
      const response = await request(app)
        .post('/api/v1/films/tmdb')
        .send({ tmdbId: 123 })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid tmdbId type', async () => {
      const response = await request(app)
        .post('/api/v1/films/tmdb')
        .send({ tmdbId: 'not-a-number', title: 'Test' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for negative tmdbId', async () => {
      const response = await request(app)
        .post('/api/v1/films/tmdb')
        .send({ tmdbId: -1, title: 'Test' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for empty title', async () => {
      const response = await request(app)
        .post('/api/v1/films/tmdb')
        .send({ tmdbId: 123, title: '' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle optional null fields', async () => {
      (db.query.films.findFirst as Mock).mockResolvedValue(null);

      const filmWithNulls = {
        id: FILM_ID,
        tmdbId: 999,
        title: 'Nullable Film',
        year: null,
        poster: null,
        plot: null,
        director: null,
        genre: null,
        runtime: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (db.insert as Mock).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([filmWithNulls]),
        }),
      });

      const response = await request(app)
        .post('/api/v1/films/tmdb')
        .send({
          tmdbId: 999,
          title: 'Nullable Film',
          year: null,
          poster: null,
          plot: null,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Error handling', () => {
    it('should handle database errors in GET /films', async () => {
      (db.select as Mock).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnThis(),
          orderBy: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          offset: vi.fn().mockRejectedValue(new Error('Database error')),
        }),
      });

      const response = await request(app).get('/api/v1/films').expect(500);

      expect(response.body.success).toBe(false);
    });

    it('should handle database errors in GET /films/:id', async () => {
      (db.query.films.findFirst as Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app).get(`/api/v1/films/${FILM_ID}`).expect(500);

      expect(response.body.success).toBe(false);
    });

    it('should handle database errors in POST /films/tmdb', async () => {
      (db.query.films.findFirst as Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/v1/films/tmdb')
        .send({ tmdbId: 123, title: 'Test' })
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });
});
