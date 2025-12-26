/**
 * Domain Entities Unit Tests
 */

import { describe, it, expect } from 'vitest';
import { Film } from './Film.js';
import { User } from './User.js';
import { Review } from './Review.js';
import { ReviewComment } from './ReviewComment.js';
import { ReviewLike } from './ReviewLike.js';

describe('Film Entity', () => {
  const mockFilmProps = {
    id: 'film-123',
    tmdbId: 12345,
    title: 'Test Movie',
    year: '2024',
    poster: '/poster.jpg',
    plot: 'A test movie plot',
    director: 'Test Director',
    actors: 'Actor 1, Actor 2',
    genre: 'Action, Drama',
    runtime: '120 min',
    tmdbRating: '8.5',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15'),
  };

  it('should create a Film entity with all properties', () => {
    const film = new Film(mockFilmProps);

    expect(film.id).toBe(mockFilmProps.id);
    expect(film.tmdbId).toBe(mockFilmProps.tmdbId);
    expect(film.title).toBe(mockFilmProps.title);
    expect(film.year).toBe(mockFilmProps.year);
    expect(film.poster).toBe(mockFilmProps.poster);
    expect(film.plot).toBe(mockFilmProps.plot);
    expect(film.director).toBe(mockFilmProps.director);
    expect(film.actors).toBe(mockFilmProps.actors);
    expect(film.genre).toBe(mockFilmProps.genre);
    expect(film.runtime).toBe(mockFilmProps.runtime);
    expect(film.tmdbRating).toBe(mockFilmProps.tmdbRating);
    expect(film.createdAt).toEqual(mockFilmProps.createdAt);
    expect(film.updatedAt).toEqual(mockFilmProps.updatedAt);
  });

  it('should return correct summary via toSummary()', () => {
    const film = new Film(mockFilmProps);
    const summary = film.toSummary();

    expect(summary).toEqual({
      id: 'film-123',
      title: 'Test Movie',
      year: '2024',
      poster: '/poster.jpg',
    });
  });

  it('should handle null values in toSummary()', () => {
    const filmWithNulls = new Film({
      ...mockFilmProps,
      year: null,
      poster: null,
    });
    const summary = filmWithNulls.toSummary();

    expect(summary).toEqual({
      id: 'film-123',
      title: 'Test Movie',
      year: null,
      poster: null,
    });
  });
});

describe('User Entity', () => {
  const mockUserProps = {
    id: 'user-123',
    email: 'test@example.com',
    username: 'testuser',
    passwordHash: '$2a$10$hashedpassword',
    avatarUrl: '/avatar.jpg',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15'),
  };

  it('should create a User entity with all properties', () => {
    const user = new User(mockUserProps);

    expect(user.id).toBe(mockUserProps.id);
    expect(user.email).toBe(mockUserProps.email);
    expect(user.username).toBe(mockUserProps.username);
    expect(user.passwordHash).toBe(mockUserProps.passwordHash);
    expect(user.avatarUrl).toBe(mockUserProps.avatarUrl);
    expect(user.createdAt).toEqual(mockUserProps.createdAt);
    expect(user.updatedAt).toEqual(mockUserProps.updatedAt);
  });

  it('should return public representation via toPublic() without password hash', () => {
    const user = new User(mockUserProps);
    const publicUser = user.toPublic();

    expect(publicUser).toEqual({
      id: 'user-123',
      email: 'test@example.com',
      username: 'testuser',
      avatarUrl: '/avatar.jpg',
      createdAt: mockUserProps.createdAt,
      updatedAt: mockUserProps.updatedAt,
    });
    expect(publicUser).not.toHaveProperty('passwordHash');
  });

  it('should return summary via toSummary()', () => {
    const user = new User(mockUserProps);
    const summary = user.toSummary();

    expect(summary).toEqual({
      id: 'user-123',
      username: 'testuser',
      avatarUrl: '/avatar.jpg',
    });
  });

  it('should handle null avatarUrl', () => {
    const userWithoutAvatar = new User({
      ...mockUserProps,
      avatarUrl: null,
    });
    const summary = userWithoutAvatar.toSummary();

    expect(summary.avatarUrl).toBeNull();
  });
});

describe('Review Entity', () => {
  const mockReviewProps = {
    id: 'review-123',
    userId: 'user-123',
    filmId: 'film-123',
    rating: 4,
    comment: 'Great movie!',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15'),
  };

  it('should create a Review entity', () => {
    const review = new Review(mockReviewProps);

    expect(review.id).toBe(mockReviewProps.id);
    expect(review.userId).toBe(mockReviewProps.userId);
    expect(review.filmId).toBe(mockReviewProps.filmId);
    expect(review.rating).toBe(mockReviewProps.rating);
    expect(review.comment).toBe(mockReviewProps.comment);
  });

  it('should validate rating correctly', () => {
    expect(Review.isValidRating(1)).toBe(true);
    expect(Review.isValidRating(5)).toBe(true);
    expect(Review.isValidRating(3)).toBe(true);
    expect(Review.isValidRating(0)).toBe(false);
    expect(Review.isValidRating(6)).toBe(false);
    expect(Review.isValidRating(-1)).toBe(false);
    expect(Review.isValidRating(3.5)).toBe(false);
  });

  it('should serialize to JSON correctly', () => {
    const review = new Review(mockReviewProps);
    const json = review.toJSON();

    expect(json).toEqual({
      id: 'review-123',
      userId: 'user-123',
      filmId: 'film-123',
      rating: 4,
      comment: 'Great movie!',
      createdAt: mockReviewProps.createdAt,
      updatedAt: mockReviewProps.updatedAt,
    });
  });

  it('should handle null comment', () => {
    const reviewNoComment = new Review({
      ...mockReviewProps,
      comment: null,
    });

    expect(reviewNoComment.comment).toBeNull();
    expect(reviewNoComment.toJSON().comment).toBeNull();
  });
});

describe('ReviewComment Entity', () => {
  const mockCommentProps = {
    id: 'comment-123',
    userId: 'user-123',
    reviewId: 'review-123',
    content: 'Nice review!',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15'),
  };

  it('should create a ReviewComment entity', () => {
    const comment = new ReviewComment(mockCommentProps);

    expect(comment.id).toBe(mockCommentProps.id);
    expect(comment.userId).toBe(mockCommentProps.userId);
    expect(comment.reviewId).toBe(mockCommentProps.reviewId);
    expect(comment.content).toBe(mockCommentProps.content);
    expect(comment.createdAt).toEqual(mockCommentProps.createdAt);
    expect(comment.updatedAt).toEqual(mockCommentProps.updatedAt);
  });

  it('should validate content correctly with isValidContent()', () => {
    // Valid content
    expect(ReviewComment.isValidContent('Hello')).toBe(true);
    expect(ReviewComment.isValidContent('A')).toBe(true);
    expect(ReviewComment.isValidContent('a'.repeat(1000))).toBe(true);

    // Invalid content
    expect(ReviewComment.isValidContent('')).toBe(false);
    expect(ReviewComment.isValidContent('a'.repeat(1001))).toBe(false);
  });

  it('should serialize to JSON correctly', () => {
    const comment = new ReviewComment(mockCommentProps);
    const json = comment.toJSON();

    expect(json).toEqual({
      id: 'comment-123',
      userId: 'user-123',
      reviewId: 'review-123',
      content: 'Nice review!',
      createdAt: mockCommentProps.createdAt,
      updatedAt: mockCommentProps.updatedAt,
    });
  });
});

describe('ReviewLike Entity', () => {
  const mockLikeProps = {
    id: 'like-123',
    userId: 'user-123',
    reviewId: 'review-123',
    createdAt: new Date('2024-01-01'),
  };

  it('should create a ReviewLike entity', () => {
    const like = new ReviewLike(mockLikeProps);

    expect(like.id).toBe(mockLikeProps.id);
    expect(like.userId).toBe(mockLikeProps.userId);
    expect(like.reviewId).toBe(mockLikeProps.reviewId);
    expect(like.createdAt).toEqual(mockLikeProps.createdAt);
  });

  it('should serialize to JSON correctly', () => {
    const like = new ReviewLike(mockLikeProps);
    const json = like.toJSON();

    expect(json).toEqual({
      id: 'like-123',
      userId: 'user-123',
      reviewId: 'review-123',
      createdAt: mockLikeProps.createdAt,
    });
  });
});
