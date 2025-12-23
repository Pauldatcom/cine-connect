/**
 * Reviews Routes Unit Tests
 */

import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../app.js';

// Valid UUIDs for testing
const USER_ID = '11111111-1111-1111-1111-111111111111';
const OTHER_USER_ID = '22222222-2222-2222-2222-222222222222';
const FILM_ID = '33333333-3333-3333-3333-333333333333';
const REVIEW_ID = '44444444-4444-4444-4444-444444444444';
const NONEXISTENT_ID = '99999999-9999-9999-9999-999999999999';

// Mock the database module
vi.mock('../db/index.js', () => ({
  db: {
    query: {
      reviews: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
      films: {
        findFirst: vi.fn(),
      },
    },
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  schema: {
    reviews: {
      id: 'id',
      userId: 'userId',
      filmId: 'filmId',
      rating: 'rating',
      comment: 'comment',
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
    },
    films: {
      id: 'id',
      title: 'title',
      poster: 'poster',
      year: 'year',
    },
  },
}));

import { db } from '../db/index.js';

describe('Reviews Routes', () => {
  const app = createApp();
  const JWT_SECRET =
    process.env.JWT_SECRET || 'test-secret-key-for-testing-purposes-only-minimum-32-chars';

  const mockUser = {
    id: USER_ID,
    email: 'test@example.com',
  };

  const mockReview = {
    id: REVIEW_ID,
    userId: USER_ID,
    filmId: FILM_ID,
    rating: 4,
    comment: 'Great movie!',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const generateToken = (userId: string, email: string) => {
    return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '7d' });
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/v1/reviews', () => {
    it('should create a new review', async () => {
      const token = generateToken(mockUser.id, mockUser.email);

      // No existing review
      (db.query.reviews.findFirst as Mock).mockResolvedValue(null);
      // Film exists
      (db.query.films.findFirst as Mock).mockResolvedValue({ id: FILM_ID });
      // Insert returns new review
      (db.insert as Mock).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockReview]),
        }),
      });

      const response = await request(app)
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({
          filmId: FILM_ID,
          rating: 4,
          comment: 'Great movie!',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.rating).toBe(4);
    });

    it('should return 401 without token', async () => {
      const response = await request(app)
        .post('/api/v1/reviews')
        .send({
          filmId: FILM_ID,
          rating: 4,
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return 409 for duplicate review', async () => {
      const token = generateToken(mockUser.id, mockUser.email);
      (db.query.reviews.findFirst as Mock).mockResolvedValue(mockReview);

      const response = await request(app)
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({
          filmId: FILM_ID,
          rating: 4,
        })
        .expect(409);

      expect(response.body.success).toBe(false);
    });

    it('should return 404 if film not found', async () => {
      const token = generateToken(mockUser.id, mockUser.email);
      (db.query.reviews.findFirst as Mock).mockResolvedValue(null);
      (db.query.films.findFirst as Mock).mockResolvedValue(null);

      const response = await request(app)
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({
          filmId: NONEXISTENT_ID,
          rating: 4,
        })
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid rating', async () => {
      const token = generateToken(mockUser.id, mockUser.email);

      const response = await request(app)
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({
          filmId: FILM_ID,
          rating: 10, // Invalid - max is 5
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/reviews/film/:filmId', () => {
    it('should return reviews for a film', async () => {
      (db.query.reviews.findMany as Mock).mockResolvedValue([mockReview]);

      const response = await request(app).get(`/api/v1/reviews/film/${FILM_ID}`).expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toHaveLength(1);
    });

    it('should handle pagination', async () => {
      (db.query.reviews.findMany as Mock).mockResolvedValue([]);

      const response = await request(app).get(`/api/v1/reviews/film/${FILM_ID}?page=2`).expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.page).toBe(2);
    });
  });

  describe('GET /api/v1/reviews/user/:userId', () => {
    it('should return reviews by user', async () => {
      (db.query.reviews.findMany as Mock).mockResolvedValue([mockReview]);

      const response = await request(app).get(`/api/v1/reviews/user/${USER_ID}`).expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('PATCH /api/v1/reviews/:id', () => {
    it('should update own review', async () => {
      const token = generateToken(mockUser.id, mockUser.email);
      (db.query.reviews.findFirst as Mock).mockResolvedValue(mockReview);

      const updatedReview = { ...mockReview, rating: 5 };
      (db.update as Mock).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([updatedReview]),
          }),
        }),
      });

      const response = await request(app)
        .patch(`/api/v1/reviews/${REVIEW_ID}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ rating: 5 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.rating).toBe(5);
    });

    it('should return 404 if review not found', async () => {
      const token = generateToken(mockUser.id, mockUser.email);
      (db.query.reviews.findFirst as Mock).mockResolvedValue(null);

      const response = await request(app)
        .patch(`/api/v1/reviews/${NONEXISTENT_ID}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ rating: 5 })
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should return 403 for other user review', async () => {
      const token = generateToken(OTHER_USER_ID, 'other@example.com');
      (db.query.reviews.findFirst as Mock).mockResolvedValue(mockReview);

      const response = await request(app)
        .patch(`/api/v1/reviews/${REVIEW_ID}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ rating: 5 })
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/v1/reviews/:id', () => {
    it('should delete own review', async () => {
      const token = generateToken(mockUser.id, mockUser.email);
      (db.query.reviews.findFirst as Mock).mockResolvedValue(mockReview);
      (db.delete as Mock).mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      });

      await request(app)
        .delete(`/api/v1/reviews/${REVIEW_ID}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(204);
    });

    it('should return 404 if review not found', async () => {
      const token = generateToken(mockUser.id, mockUser.email);
      (db.query.reviews.findFirst as Mock).mockResolvedValue(null);

      const response = await request(app)
        .delete(`/api/v1/reviews/${NONEXISTENT_ID}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should return 403 for other user review', async () => {
      const token = generateToken(OTHER_USER_ID, 'other@example.com');
      (db.query.reviews.findFirst as Mock).mockResolvedValue(mockReview);

      const response = await request(app)
        .delete(`/api/v1/reviews/${REVIEW_ID}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });
});
