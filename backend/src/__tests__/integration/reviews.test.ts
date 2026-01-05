/**
 * Reviews Routes Unit Tests
 */

// Must import reflect-metadata FIRST before any tsyringe usage
import 'reflect-metadata';

import jwt from 'jsonwebtoken';
import request from 'supertest';
import { container } from 'tsyringe';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '@/app';
import { Film } from '@/domain/entities/Film.js';
import { Review } from '@/domain/entities/Review.js';
import { ReviewComment } from '@/domain/entities/ReviewComment.js';
import { ReviewLike } from '@/domain/entities/ReviewLike.js';
import { IFilmRepository } from '@/domain/repositories/IFilmRepository.js';
import { IReviewRepository } from '@/domain/repositories/IReviewRepository.js';

// Valid UUIDs for testing
const USER_ID = '11111111-1111-1111-1111-111111111111';
const OTHER_USER_ID = '22222222-2222-2222-2222-222222222222';
const FILM_ID = '33333333-3333-3333-3333-333333333333';
const REVIEW_ID = '44444444-4444-4444-4444-444444444444';
const NONEXISTENT_ID = '99999999-9999-9999-9999-999999999999';

// Mock review entity
const mockReviewData = {
  id: REVIEW_ID,
  userId: USER_ID,
  filmId: FILM_ID,
  rating: 4,
  comment: 'Great movie!',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockReview = new Review(mockReviewData);

// Mock film entity
const mockFilmData = {
  id: FILM_ID,
  tmdbId: 12345,
  title: 'Test Movie',
  year: '2024',
  poster: null,
  plot: null,
  director: null,
  actors: null,
  genre: null,
  runtime: null,
  tmdbRating: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockFilm = new Film(mockFilmData);

// Create mock repositories
const mockReviewRepository: IReviewRepository = {
  findById: vi.fn(),
  findByIdWithRelations: vi.fn(),
  findByUserAndFilm: vi.fn(),
  findByFilmId: vi.fn(),
  findByUserId: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  findLike: vi.fn(),
  addLike: vi.fn(),
  removeLike: vi.fn(),
  getLikeCount: vi.fn(),
  getLikeUsers: vi.fn(),
  findCommentById: vi.fn(),
  getComments: vi.fn(),
  addComment: vi.fn(),
  deleteComment: vi.fn(),
  getCommentCount: vi.fn(),
};

const mockFilmRepository: IFilmRepository = {
  findById: vi.fn(),
  findByTmdbId: vi.fn(),
  create: vi.fn(),
  upsertByTmdbId: vi.fn(),
  searchByTitle: vi.fn(),
  findByGenre: vi.fn(),
};

describe('Reviews Routes', () => {
  let app: ReturnType<typeof createApp>;
  const JWT_SECRET =
    process.env.JWT_SECRET || 'test-secret-key-for-testing-purposes-only-minimum-32-chars';

  const mockUser = {
    id: USER_ID,
    email: 'test@example.com',
  };

  const generateToken = (userId: string, email: string) => {
    return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '7d' });
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Clear and re-register mock repositories for each test
    container.clearInstances();
    container.registerInstance<IReviewRepository>(
      IReviewRepository as symbol,
      mockReviewRepository
    );
    container.registerInstance<IFilmRepository>(IFilmRepository as symbol, mockFilmRepository);
    app = createApp();
  });

  describe('POST /api/v1/reviews', () => {
    it('should create a new review', async () => {
      const token = generateToken(mockUser.id, mockUser.email);

      // No existing review
      vi.mocked(mockReviewRepository.findByUserAndFilm).mockResolvedValue(null);
      // Film exists
      vi.mocked(mockFilmRepository.findById).mockResolvedValue(mockFilm);
      // Create returns new review
      vi.mocked(mockReviewRepository.create).mockResolvedValue(mockReview);

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
      // Film exists
      vi.mocked(mockFilmRepository.findById).mockResolvedValue(mockFilm);
      // User already reviewed this film
      vi.mocked(mockReviewRepository.findByUserAndFilm).mockResolvedValue(mockReview);

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
      vi.mocked(mockReviewRepository.findByUserAndFilm).mockResolvedValue(null);
      vi.mocked(mockFilmRepository.findById).mockResolvedValue(null);

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

    // This should not happend anyway, we are block by IMDB obvisouly, useless test only here for the coverage

    it('should return 400 for invalid rating', async () => {
      const token = generateToken(mockUser.id, mockUser.email);

      const response = await request(app)
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({
          filmId: FILM_ID,
          rating: 11, // Invalid - max is 10
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/reviews/film/:filmId', () => {
    it('should return reviews for a film', async () => {
      vi.mocked(mockReviewRepository.findByFilmId).mockResolvedValue({
        items: [
          { ...mockReviewData, user: { id: USER_ID, username: 'testuser', avatarUrl: null } },
        ],
        total: 1,
        page: 1,
        pageSize: 20,
        totalPages: 1,
      });

      const response = await request(app).get(`/api/v1/reviews/film/${FILM_ID}`).expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toHaveLength(1);
    });

    it('should handle pagination', async () => {
      vi.mocked(mockReviewRepository.findByFilmId).mockResolvedValue({
        items: [],
        total: 0,
        page: 2,
        pageSize: 20,
        totalPages: 0,
      });

      const response = await request(app).get(`/api/v1/reviews/film/${FILM_ID}?page=2`).expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.page).toBe(2);
    });
  });

  describe('GET /api/v1/reviews/user/:userId', () => {
    it('should return reviews by user', async () => {
      vi.mocked(mockReviewRepository.findByUserId).mockResolvedValue([
        { ...mockReviewData, film: mockFilmData },
      ]);

      const response = await request(app).get(`/api/v1/reviews/user/${USER_ID}`).expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('PATCH /api/v1/reviews/:id', () => {
    it('should update own review', async () => {
      const token = generateToken(mockUser.id, mockUser.email);
      vi.mocked(mockReviewRepository.findById).mockResolvedValue(mockReview);

      const updatedReview = new Review({ ...mockReviewData, rating: 5 });
      vi.mocked(mockReviewRepository.update).mockResolvedValue(updatedReview);

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
      vi.mocked(mockReviewRepository.findById).mockResolvedValue(null);

      const response = await request(app)
        .patch(`/api/v1/reviews/${NONEXISTENT_ID}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ rating: 5 })
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should return 403 for other user review', async () => {
      const token = generateToken(OTHER_USER_ID, 'other@example.com');
      vi.mocked(mockReviewRepository.findById).mockResolvedValue(mockReview);

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
      vi.mocked(mockReviewRepository.findById).mockResolvedValue(mockReview);
      vi.mocked(mockReviewRepository.delete).mockResolvedValue(true);

      await request(app)
        .delete(`/api/v1/reviews/${REVIEW_ID}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(204);
    });

    it('should return 404 if review not found', async () => {
      const token = generateToken(mockUser.id, mockUser.email);
      vi.mocked(mockReviewRepository.findById).mockResolvedValue(null);

      const response = await request(app)
        .delete(`/api/v1/reviews/${NONEXISTENT_ID}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should return 403 for other user review', async () => {
      const token = generateToken(OTHER_USER_ID, 'other@example.com');
      vi.mocked(mockReviewRepository.findById).mockResolvedValue(mockReview);

      const response = await request(app)
        .delete(`/api/v1/reviews/${REVIEW_ID}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/reviews/:id/like', () => {
    it('should toggle like on a review', async () => {
      const token = generateToken(mockUser.id, mockUser.email);
      vi.mocked(mockReviewRepository.findById).mockResolvedValue(mockReview);
      vi.mocked(mockReviewRepository.findLike).mockResolvedValue(null);
      vi.mocked(mockReviewRepository.addLike).mockResolvedValue(
        new ReviewLike({
          id: 'like-id',
          userId: USER_ID,
          reviewId: REVIEW_ID,
          createdAt: new Date(),
        })
      );
      vi.mocked(mockReviewRepository.getLikeCount).mockResolvedValue(1);

      const response = await request(app)
        .post(`/api/v1/reviews/${REVIEW_ID}/like`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.liked).toBe(true);
      expect(response.body.data.likesCount).toBe(1);
    });

    it('should return 401 without token', async () => {
      const response = await request(app).post(`/api/v1/reviews/${REVIEW_ID}/like`).expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return 404 if review not found', async () => {
      const token = generateToken(mockUser.id, mockUser.email);
      vi.mocked(mockReviewRepository.findById).mockResolvedValue(null);

      const response = await request(app)
        .post(`/api/v1/reviews/${NONEXISTENT_ID}/like`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/reviews/:id/comments', () => {
    it('should add a comment to a review', async () => {
      const token = generateToken(mockUser.id, mockUser.email);
      vi.mocked(mockReviewRepository.findById).mockResolvedValue(mockReview);
      vi.mocked(mockReviewRepository.addComment).mockResolvedValue(
        new ReviewComment({
          id: 'comment-id',
          userId: USER_ID,
          reviewId: REVIEW_ID,
          content: 'Nice review!',
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      );
      vi.mocked(mockReviewRepository.getCommentCount).mockResolvedValue(1);

      const response = await request(app)
        .post(`/api/v1/reviews/${REVIEW_ID}/comments`)
        .set('Authorization', `Bearer ${token}`)
        .send({ content: 'Nice review!' })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.commentsCount).toBe(1);
    });

    it('should return 401 without token', async () => {
      const response = await request(app)
        .post(`/api/v1/reviews/${REVIEW_ID}/comments`)
        .send({ content: 'Nice review!' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return 404 if review not found', async () => {
      const token = generateToken(mockUser.id, mockUser.email);
      vi.mocked(mockReviewRepository.findById).mockResolvedValue(null);

      const response = await request(app)
        .post(`/api/v1/reviews/${NONEXISTENT_ID}/comments`)
        .set('Authorization', `Bearer ${token}`)
        .send({ content: 'Nice review!' })
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/reviews/:id', () => {
    it('should return a single review', async () => {
      vi.mocked(mockReviewRepository.findByIdWithRelations).mockResolvedValue({
        ...mockReviewData,
        user: { id: USER_ID, username: 'testuser', avatarUrl: null },
        film: { id: FILM_ID, title: 'Test Movie', poster: null, year: '2024' },
        likesCount: 5,
        commentsCount: 2,
        isLikedByCurrentUser: false,
      });

      const response = await request(app).get(`/api/v1/reviews/${REVIEW_ID}`).expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(REVIEW_ID);
      expect(response.body.data.likesCount).toBe(5);
    });

    it('should return 404 if review not found', async () => {
      vi.mocked(mockReviewRepository.findByIdWithRelations).mockResolvedValue(null);

      const response = await request(app).get(`/api/v1/reviews/${NONEXISTENT_ID}`).expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should include currentUser like status when authenticated', async () => {
      const token = generateToken(mockUser.id, mockUser.email);
      vi.mocked(mockReviewRepository.findByIdWithRelations).mockResolvedValue({
        ...mockReviewData,
        user: { id: USER_ID, username: 'testuser', avatarUrl: null },
        film: { id: FILM_ID, title: 'Test Movie', poster: null, year: '2024' },
        likesCount: 5,
        commentsCount: 2,
        isLikedByCurrentUser: true,
      });

      const response = await request(app)
        .get(`/api/v1/reviews/${REVIEW_ID}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isLikedByCurrentUser).toBe(true);
    });
  });

  describe('GET /api/v1/reviews/:id/likes', () => {
    it('should return users who liked a review', async () => {
      vi.mocked(mockReviewRepository.getLikeUsers).mockResolvedValue([
        { id: USER_ID, username: 'testuser', avatarUrl: null },
        { id: OTHER_USER_ID, username: 'otheruser', avatarUrl: null },
      ]);
      vi.mocked(mockReviewRepository.getLikeCount).mockResolvedValue(2);

      const response = await request(app).get(`/api/v1/reviews/${REVIEW_ID}/likes`).expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.users).toHaveLength(2);
      expect(response.body.data.count).toBe(2);
    });

    it('should respect limit parameter', async () => {
      vi.mocked(mockReviewRepository.getLikeUsers).mockResolvedValue([
        { id: USER_ID, username: 'testuser', avatarUrl: null },
      ]);
      vi.mocked(mockReviewRepository.getLikeCount).mockResolvedValue(5);

      const response = await request(app)
        .get(`/api/v1/reviews/${REVIEW_ID}/likes?limit=1`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.users).toHaveLength(1);
      expect(response.body.data.count).toBe(5);
    });
  });

  describe('GET /api/v1/reviews/:id/comments', () => {
    it('should return comments for a review', async () => {
      vi.mocked(mockReviewRepository.findById).mockResolvedValue(mockReview);
      vi.mocked(mockReviewRepository.getComments).mockResolvedValue({
        items: [
          {
            id: 'comment-1',
            userId: USER_ID,
            reviewId: REVIEW_ID,
            content: 'Great review!',
            createdAt: new Date(),
            updatedAt: new Date(),
            user: { id: USER_ID, username: 'testuser', avatarUrl: null },
          },
        ],
        total: 1,
        page: 1,
        pageSize: 20,
        totalPages: 1,
      });

      const response = await request(app).get(`/api/v1/reviews/${REVIEW_ID}/comments`).expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toHaveLength(1);
    });

    it('should handle pagination', async () => {
      vi.mocked(mockReviewRepository.findById).mockResolvedValue(mockReview);
      vi.mocked(mockReviewRepository.getComments).mockResolvedValue({
        items: [],
        total: 50,
        page: 3,
        pageSize: 20,
        totalPages: 3,
      });

      const response = await request(app)
        .get(`/api/v1/reviews/${REVIEW_ID}/comments?page=3&pageSize=20`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.page).toBe(3);
    });

    it('should return 404 if review not found', async () => {
      vi.mocked(mockReviewRepository.findById).mockResolvedValue(null);

      const response = await request(app)
        .get(`/api/v1/reviews/${NONEXISTENT_ID}/comments`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/v1/reviews/:reviewId/comments/:commentId', () => {
    const COMMENT_ID = '55555555-5555-5555-5555-555555555555';

    it('should delete own comment', async () => {
      const token = generateToken(mockUser.id, mockUser.email);
      vi.mocked(mockReviewRepository.findCommentById).mockResolvedValue(
        new ReviewComment({
          id: COMMENT_ID,
          userId: USER_ID,
          reviewId: REVIEW_ID,
          content: 'My comment',
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      );
      vi.mocked(mockReviewRepository.deleteComment).mockResolvedValue(true);

      await request(app)
        .delete(`/api/v1/reviews/${REVIEW_ID}/comments/${COMMENT_ID}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(204);

      expect(mockReviewRepository.deleteComment).toHaveBeenCalledWith(COMMENT_ID);
    });

    it('should return 404 if comment not found', async () => {
      const token = generateToken(mockUser.id, mockUser.email);
      vi.mocked(mockReviewRepository.findCommentById).mockResolvedValue(null);

      const response = await request(app)
        .delete(`/api/v1/reviews/${REVIEW_ID}/comments/${NONEXISTENT_ID}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should return 403 for other user comment', async () => {
      const token = generateToken(OTHER_USER_ID, 'other@example.com');
      vi.mocked(mockReviewRepository.findCommentById).mockResolvedValue(
        new ReviewComment({
          id: COMMENT_ID,
          userId: USER_ID, // Belongs to different user
          reviewId: REVIEW_ID,
          content: 'Their comment',
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      );

      const response = await request(app)
        .delete(`/api/v1/reviews/${REVIEW_ID}/comments/${COMMENT_ID}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should return 401 without token', async () => {
      const response = await request(app)
        .delete(`/api/v1/reviews/${REVIEW_ID}/comments/${COMMENT_ID}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/reviews/:id/like - toggle unlike', () => {
    it('should unlike a previously liked review', async () => {
      const token = generateToken(mockUser.id, mockUser.email);
      vi.mocked(mockReviewRepository.findById).mockResolvedValue(mockReview);
      vi.mocked(mockReviewRepository.findLike).mockResolvedValue(
        new ReviewLike({
          id: 'existing-like-id',
          userId: USER_ID,
          reviewId: REVIEW_ID,
          createdAt: new Date(),
        })
      );
      vi.mocked(mockReviewRepository.removeLike).mockResolvedValue(true);
      vi.mocked(mockReviewRepository.getLikeCount).mockResolvedValue(0);

      const response = await request(app)
        .post(`/api/v1/reviews/${REVIEW_ID}/like`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.liked).toBe(false);
      expect(response.body.data.likesCount).toBe(0);
    });
  });
});
