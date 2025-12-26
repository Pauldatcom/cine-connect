/**
 * Films Routes Unit Tests
 */

// Must import reflect-metadata FIRST before any tsyringe usage
import 'reflect-metadata';

import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';

// Valid UUIDs for testing
const FILM_ID = '11111111-1111-1111-1111-111111111111';
const NONEXISTENT_ID = '99999999-9999-9999-9999-999999999999';

// Mock the database module
vi.mock('../db/index.js', () => {
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

import { db } from '../db/index.js';

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

    it('should return 400 for invalid TMDb ID format', async () => {
      const response = await request(app).get('/api/v1/films/tmdb/not-a-number').expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});
