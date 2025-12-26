/**
 * Reviews API Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api } from './client';
import {
  createReview,
  getFilmReviews,
  getReview,
  getUserReviews,
  updateReview,
  deleteReview,
  likeReview,
  getReviewLikes,
  commentOnReview,
  getReviewComments,
  deleteComment,
  reviewsApi,
} from './reviews';

// Mock the api client
vi.mock('./client', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockReview = {
  id: 'review-123',
  userId: 'user-123',
  filmId: 'film-123',
  rating: 4,
  comment: 'Great movie!',
  createdAt: '2024-01-15T00:00:00Z',
  updatedAt: '2024-01-15T00:00:00Z',
  user: { id: 'user-123', username: 'testuser', avatarUrl: null },
  likesCount: 5,
  commentsCount: 2,
  isLikedByCurrentUser: false,
};

const mockComment = {
  id: 'comment-123',
  userId: 'user-123',
  reviewId: 'review-123',
  content: 'Nice review!',
  createdAt: '2024-01-15T00:00:00Z',
  updatedAt: '2024-01-15T00:00:00Z',
  user: { id: 'user-123', username: 'testuser', avatarUrl: null },
};

describe('Reviews API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createReview', () => {
    it('should create a review', async () => {
      vi.mocked(api.post).mockResolvedValue(mockReview);

      const result = await createReview({
        filmId: 'film-123',
        rating: 4,
        comment: 'Great movie!',
      });

      expect(api.post).toHaveBeenCalledWith('/api/v1/reviews', {
        filmId: 'film-123',
        rating: 4,
        comment: 'Great movie!',
      });
      expect(result).toEqual(mockReview);
    });

    it('should create a review without comment', async () => {
      vi.mocked(api.post).mockResolvedValue(mockReview);

      await createReview({
        filmId: 'film-123',
        rating: 5,
      });

      expect(api.post).toHaveBeenCalledWith('/api/v1/reviews', {
        filmId: 'film-123',
        rating: 5,
      });
    });
  });

  describe('getFilmReviews', () => {
    it('should get reviews for a film with default pagination', async () => {
      const mockResponse = {
        items: [mockReview],
        total: 1,
        page: 1,
        pageSize: 20,
        totalPages: 1,
      };
      vi.mocked(api.get).mockResolvedValue(mockResponse);

      const result = await getFilmReviews('film-123');

      expect(api.get).toHaveBeenCalledWith('/api/v1/reviews/film/film-123?page=1&pageSize=20');
      expect(result).toEqual(mockResponse);
    });

    it('should get reviews with custom pagination', async () => {
      const mockResponse = {
        items: [],
        total: 50,
        page: 3,
        pageSize: 10,
        totalPages: 5,
      };
      vi.mocked(api.get).mockResolvedValue(mockResponse);

      const result = await getFilmReviews('film-123', 3, 10);

      expect(api.get).toHaveBeenCalledWith('/api/v1/reviews/film/film-123?page=3&pageSize=10');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getReview', () => {
    it('should get a single review', async () => {
      vi.mocked(api.get).mockResolvedValue(mockReview);

      const result = await getReview('review-123');

      expect(api.get).toHaveBeenCalledWith('/api/v1/reviews/review-123');
      expect(result).toEqual(mockReview);
    });
  });

  describe('getUserReviews', () => {
    it('should get reviews by a user', async () => {
      vi.mocked(api.get).mockResolvedValue([mockReview]);

      const result = await getUserReviews('user-123');

      expect(api.get).toHaveBeenCalledWith('/api/v1/reviews/user/user-123');
      expect(result).toEqual([mockReview]);
    });
  });

  describe('updateReview', () => {
    it('should update a review rating', async () => {
      const updatedReview = { ...mockReview, rating: 5 };
      vi.mocked(api.patch).mockResolvedValue(updatedReview);

      const result = await updateReview('review-123', { rating: 5 });

      expect(api.patch).toHaveBeenCalledWith('/api/v1/reviews/review-123', { rating: 5 });
      expect(result).toEqual(updatedReview);
    });

    it('should update a review comment', async () => {
      const updatedReview = { ...mockReview, comment: 'Updated comment' };
      vi.mocked(api.patch).mockResolvedValue(updatedReview);

      const result = await updateReview('review-123', { comment: 'Updated comment' });

      expect(api.patch).toHaveBeenCalledWith('/api/v1/reviews/review-123', {
        comment: 'Updated comment',
      });
      expect(result).toEqual(updatedReview);
    });
  });

  describe('deleteReview', () => {
    it('should delete a review', async () => {
      vi.mocked(api.delete).mockResolvedValue(undefined);

      await deleteReview('review-123');

      expect(api.delete).toHaveBeenCalledWith('/api/v1/reviews/review-123');
    });
  });

  describe('likeReview', () => {
    it('should toggle like on a review', async () => {
      const mockResponse = { liked: true, likesCount: 6 };
      vi.mocked(api.post).mockResolvedValue(mockResponse);

      const result = await likeReview('review-123');

      expect(api.post).toHaveBeenCalledWith('/api/v1/reviews/review-123/like');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getReviewLikes', () => {
    it('should get users who liked a review with default limit', async () => {
      const mockResponse = {
        users: [{ id: 'user-123', username: 'testuser', avatarUrl: null }],
        count: 5,
      };
      vi.mocked(api.get).mockResolvedValue(mockResponse);

      const result = await getReviewLikes('review-123');

      expect(api.get).toHaveBeenCalledWith('/api/v1/reviews/review-123/likes?limit=10');
      expect(result).toEqual(mockResponse);
    });

    it('should get likes with custom limit', async () => {
      const mockResponse = {
        users: [],
        count: 50,
      };
      vi.mocked(api.get).mockResolvedValue(mockResponse);

      const result = await getReviewLikes('review-123', 5);

      expect(api.get).toHaveBeenCalledWith('/api/v1/reviews/review-123/likes?limit=5');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('commentOnReview', () => {
    it('should add a comment to a review', async () => {
      const mockResponse = {
        comment: mockComment,
        commentsCount: 3,
      };
      vi.mocked(api.post).mockResolvedValue(mockResponse);

      const result = await commentOnReview('review-123', 'Nice review!');

      expect(api.post).toHaveBeenCalledWith('/api/v1/reviews/review-123/comments', {
        content: 'Nice review!',
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getReviewComments', () => {
    it('should get comments for a review with default pagination', async () => {
      const mockResponse = {
        items: [mockComment],
        total: 1,
        page: 1,
        pageSize: 20,
        totalPages: 1,
      };
      vi.mocked(api.get).mockResolvedValue(mockResponse);

      const result = await getReviewComments('review-123');

      expect(api.get).toHaveBeenCalledWith(
        '/api/v1/reviews/review-123/comments?page=1&pageSize=20'
      );
      expect(result).toEqual(mockResponse);
    });

    it('should get comments with custom pagination', async () => {
      const mockResponse = {
        items: [],
        total: 100,
        page: 5,
        pageSize: 10,
        totalPages: 10,
      };
      vi.mocked(api.get).mockResolvedValue(mockResponse);

      const result = await getReviewComments('review-123', 5, 10);

      expect(api.get).toHaveBeenCalledWith(
        '/api/v1/reviews/review-123/comments?page=5&pageSize=10'
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('deleteComment', () => {
    it('should delete a comment', async () => {
      vi.mocked(api.delete).mockResolvedValue(undefined);

      await deleteComment('review-123', 'comment-123');

      expect(api.delete).toHaveBeenCalledWith('/api/v1/reviews/review-123/comments/comment-123');
    });
  });

  describe('reviewsApi object', () => {
    it('should export all functions', () => {
      expect(reviewsApi.createReview).toBe(createReview);
      expect(reviewsApi.getFilmReviews).toBe(getFilmReviews);
      expect(reviewsApi.getReview).toBe(getReview);
      expect(reviewsApi.getUserReviews).toBe(getUserReviews);
      expect(reviewsApi.updateReview).toBe(updateReview);
      expect(reviewsApi.deleteReview).toBe(deleteReview);
      expect(reviewsApi.likeReview).toBe(likeReview);
      expect(reviewsApi.getReviewLikes).toBe(getReviewLikes);
      expect(reviewsApi.commentOnReview).toBe(commentOnReview);
      expect(reviewsApi.getReviewComments).toBe(getReviewComments);
      expect(reviewsApi.deleteComment).toBe(deleteComment);
    });
  });
});
