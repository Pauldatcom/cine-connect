/**
 * Reviews Use Cases Unit Tests
 */

// Must import reflect-metadata FIRST before any tsyringe usage
import 'reflect-metadata';

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { container } from 'tsyringe';
import { IReviewRepository } from '@/domain/repositories/IReviewRepository';
import { IFilmRepository } from '@/domain/repositories/IFilmRepository';
import { Review } from '@/domain/entities/Review';
import { Film } from '@/domain/entities/Film';
import { ReviewComment } from '@/domain/entities/ReviewComment';
import { ReviewLike } from '@/domain/entities/ReviewLike';

import {
  CreateReviewUseCase,
  CreateReviewError,
} from '@/application/use-cases/reviews/CreateReviewUseCase';
import { GetFilmReviewsUseCase } from '@/application/use-cases/reviews/GetFilmReviewsUseCase';
import {
  LikeReviewUseCase,
  LikeReviewError,
} from '@/application/use-cases/reviews/LikeReviewUseCase';
import {
  CommentOnReviewUseCase,
  CommentOnReviewError,
} from '@/application/use-cases/reviews/CommentOnReviewUseCase';
import {
  GetReviewCommentsUseCase,
  GetReviewCommentsError,
} from '@/application/use-cases/reviews/GetReviewCommentsUseCase';

// Mock IDs
const USER_ID = '11111111-1111-1111-1111-111111111111';
const FILM_ID = '22222222-2222-2222-2222-222222222222';
const REVIEW_ID = '33333333-3333-3333-3333-333333333333';

// Mock review
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

// Mock film
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
  findAllPaginated: vi.fn(),
};

describe('CreateReviewUseCase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    container.clearInstances();
    container.registerInstance<IReviewRepository>(
      IReviewRepository as symbol,
      mockReviewRepository
    );
    container.registerInstance<IFilmRepository>(IFilmRepository as symbol, mockFilmRepository);
  });

  it('should create a new review successfully', async () => {
    vi.mocked(mockReviewRepository.findByUserAndFilm).mockResolvedValue(null);
    vi.mocked(mockFilmRepository.findById).mockResolvedValue(mockFilm);
    vi.mocked(mockReviewRepository.create).mockResolvedValue(mockReview);

    const useCase = container.resolve(CreateReviewUseCase);
    const result = await useCase.execute({
      userId: USER_ID,
      filmId: FILM_ID,
      rating: 4,
      comment: 'Great movie!',
    });

    expect(result.review).toBeDefined();
    expect(result.review.rating).toBe(4);
    expect(mockReviewRepository.create).toHaveBeenCalled();
  });

  it('should throw ALREADY_REVIEWED when user already reviewed the film', async () => {
    // Film must exist first
    vi.mocked(mockFilmRepository.findById).mockResolvedValue(mockFilm);
    // User already has a review for this film
    vi.mocked(mockReviewRepository.findByUserAndFilm).mockResolvedValue(mockReview);

    const useCase = container.resolve(CreateReviewUseCase);

    await expect(
      useCase.execute({
        userId: USER_ID,
        filmId: FILM_ID,
        rating: 4,
      })
    ).rejects.toThrow(CreateReviewError);

    try {
      await useCase.execute({ userId: USER_ID, filmId: FILM_ID, rating: 4 });
    } catch (error) {
      expect((error as CreateReviewError).code).toBe('ALREADY_REVIEWED');
    }
  });

  it('should throw FILM_NOT_FOUND when film does not exist', async () => {
    vi.mocked(mockReviewRepository.findByUserAndFilm).mockResolvedValue(null);
    vi.mocked(mockFilmRepository.findById).mockResolvedValue(null);

    const useCase = container.resolve(CreateReviewUseCase);

    await expect(
      useCase.execute({
        userId: USER_ID,
        filmId: FILM_ID,
        rating: 4,
      })
    ).rejects.toThrow(CreateReviewError);

    try {
      await useCase.execute({ userId: USER_ID, filmId: FILM_ID, rating: 4 });
    } catch (error) {
      expect((error as CreateReviewError).code).toBe('FILM_NOT_FOUND');
    }
  });

  it('should throw INVALID_RATING for rating outside 1-10 range', async () => {
    vi.mocked(mockReviewRepository.findByUserAndFilm).mockResolvedValue(null);
    vi.mocked(mockFilmRepository.findById).mockResolvedValue(mockFilm);

    const useCase = container.resolve(CreateReviewUseCase);

    await expect(
      useCase.execute({
        userId: USER_ID,
        filmId: FILM_ID,
        rating: 0,
      })
    ).rejects.toThrow(CreateReviewError);

    try {
      await useCase.execute({ userId: USER_ID, filmId: FILM_ID, rating: 11 });
    } catch (error) {
      expect((error as CreateReviewError).code).toBe('INVALID_RATING');
    }
  });

  it('should create review without comment', async () => {
    vi.mocked(mockReviewRepository.findByUserAndFilm).mockResolvedValue(null);
    vi.mocked(mockFilmRepository.findById).mockResolvedValue(mockFilm);
    vi.mocked(mockReviewRepository.create).mockResolvedValue(
      new Review({ ...mockReviewData, comment: null })
    );

    const useCase = container.resolve(CreateReviewUseCase);
    const result = await useCase.execute({
      userId: USER_ID,
      filmId: FILM_ID,
      rating: 5,
    });

    expect(result.review).toBeDefined();
    expect(mockReviewRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: USER_ID,
        filmId: FILM_ID,
        rating: 5,
      })
    );
  });
});

describe('GetFilmReviewsUseCase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    container.clearInstances();
    container.registerInstance<IReviewRepository>(
      IReviewRepository as symbol,
      mockReviewRepository
    );
  });

  it('should return paginated reviews for a film', async () => {
    const mockPaginatedResult = {
      items: [
        {
          ...mockReviewData,
          user: { id: USER_ID, username: 'testuser', avatarUrl: null },
          likesCount: 5,
          commentsCount: 2,
          isLikedByCurrentUser: false,
        },
      ],
      total: 1,
      page: 1,
      pageSize: 20,
      totalPages: 1,
    };
    vi.mocked(mockReviewRepository.findByFilmId).mockResolvedValue(mockPaginatedResult);

    const useCase = container.resolve(GetFilmReviewsUseCase);
    const result = await useCase.execute({ filmId: FILM_ID });

    expect(result.reviews.items).toHaveLength(1);
    expect(result.reviews.total).toBe(1);
    expect(mockReviewRepository.findByFilmId).toHaveBeenCalledWith(FILM_ID, 1, 20, undefined);
  });

  it('should respect pagination parameters', async () => {
    vi.mocked(mockReviewRepository.findByFilmId).mockResolvedValue({
      items: [],
      total: 50,
      page: 3,
      pageSize: 10,
      totalPages: 5,
    });

    const useCase = container.resolve(GetFilmReviewsUseCase);
    const result = await useCase.execute({ filmId: FILM_ID, page: 3, pageSize: 10 });

    expect(result.reviews.page).toBe(3);
    expect(result.reviews.pageSize).toBe(10);
    expect(mockReviewRepository.findByFilmId).toHaveBeenCalledWith(FILM_ID, 3, 10, undefined);
  });

  it('should pass currentUserId for like status', async () => {
    vi.mocked(mockReviewRepository.findByFilmId).mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      pageSize: 20,
      totalPages: 0,
    });

    const useCase = container.resolve(GetFilmReviewsUseCase);
    await useCase.execute({ filmId: FILM_ID, currentUserId: USER_ID });

    expect(mockReviewRepository.findByFilmId).toHaveBeenCalledWith(FILM_ID, 1, 20, USER_ID);
  });
});

describe('LikeReviewUseCase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    container.clearInstances();
    container.registerInstance<IReviewRepository>(
      IReviewRepository as symbol,
      mockReviewRepository
    );
  });

  it('should add like when not already liked', async () => {
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

    const useCase = container.resolve(LikeReviewUseCase);
    const result = await useCase.execute({ userId: USER_ID, reviewId: REVIEW_ID });

    expect(result.liked).toBe(true);
    expect(result.likesCount).toBe(1);
    expect(mockReviewRepository.addLike).toHaveBeenCalled();
  });

  it('should remove like when already liked', async () => {
    vi.mocked(mockReviewRepository.findById).mockResolvedValue(mockReview);
    vi.mocked(mockReviewRepository.findLike).mockResolvedValue(
      new ReviewLike({
        id: 'existing-like',
        userId: USER_ID,
        reviewId: REVIEW_ID,
        createdAt: new Date(),
      })
    );
    vi.mocked(mockReviewRepository.removeLike).mockResolvedValue(true);
    vi.mocked(mockReviewRepository.getLikeCount).mockResolvedValue(0);

    const useCase = container.resolve(LikeReviewUseCase);
    const result = await useCase.execute({ userId: USER_ID, reviewId: REVIEW_ID });

    expect(result.liked).toBe(false);
    expect(result.likesCount).toBe(0);
    expect(mockReviewRepository.removeLike).toHaveBeenCalled();
  });

  it('should throw REVIEW_NOT_FOUND when review does not exist', async () => {
    vi.mocked(mockReviewRepository.findById).mockResolvedValue(null);

    const useCase = container.resolve(LikeReviewUseCase);

    await expect(useCase.execute({ userId: USER_ID, reviewId: REVIEW_ID })).rejects.toThrow(
      LikeReviewError
    );

    try {
      await useCase.execute({ userId: USER_ID, reviewId: REVIEW_ID });
    } catch (error) {
      expect((error as LikeReviewError).code).toBe('REVIEW_NOT_FOUND');
    }
  });
});

describe('CommentOnReviewUseCase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    container.clearInstances();
    container.registerInstance<IReviewRepository>(
      IReviewRepository as symbol,
      mockReviewRepository
    );
  });

  it('should add a comment successfully', async () => {
    const mockComment = new ReviewComment({
      id: 'comment-id',
      userId: USER_ID,
      reviewId: REVIEW_ID,
      content: 'Nice review!',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(mockReviewRepository.findById).mockResolvedValue(mockReview);
    vi.mocked(mockReviewRepository.addComment).mockResolvedValue(mockComment);
    vi.mocked(mockReviewRepository.getCommentCount).mockResolvedValue(1);

    const useCase = container.resolve(CommentOnReviewUseCase);
    const result = await useCase.execute({
      userId: USER_ID,
      reviewId: REVIEW_ID,
      content: 'Nice review!',
    });

    expect(result.comment).toBeDefined();
    expect(result.commentsCount).toBe(1);
  });

  it('should throw REVIEW_NOT_FOUND when review does not exist', async () => {
    vi.mocked(mockReviewRepository.findById).mockResolvedValue(null);

    const useCase = container.resolve(CommentOnReviewUseCase);

    await expect(
      useCase.execute({ userId: USER_ID, reviewId: REVIEW_ID, content: 'Test' })
    ).rejects.toThrow(CommentOnReviewError);

    try {
      await useCase.execute({ userId: USER_ID, reviewId: REVIEW_ID, content: 'Test' });
    } catch (error) {
      expect((error as CommentOnReviewError).code).toBe('REVIEW_NOT_FOUND');
    }
  });

  it('should throw INVALID_CONTENT for empty content', async () => {
    const useCase = container.resolve(CommentOnReviewUseCase);

    await expect(
      useCase.execute({ userId: USER_ID, reviewId: REVIEW_ID, content: '' })
    ).rejects.toThrow(CommentOnReviewError);

    try {
      await useCase.execute({ userId: USER_ID, reviewId: REVIEW_ID, content: '   ' });
    } catch (error) {
      expect((error as CommentOnReviewError).code).toBe('INVALID_CONTENT');
    }
  });

  it('should throw INVALID_CONTENT for content exceeding max length', async () => {
    const useCase = container.resolve(CommentOnReviewUseCase);
    const longContent = 'a'.repeat(1001);

    await expect(
      useCase.execute({ userId: USER_ID, reviewId: REVIEW_ID, content: longContent })
    ).rejects.toThrow(CommentOnReviewError);

    try {
      await useCase.execute({ userId: USER_ID, reviewId: REVIEW_ID, content: longContent });
    } catch (error) {
      expect((error as CommentOnReviewError).code).toBe('INVALID_CONTENT');
    }
  });
});

describe('GetReviewCommentsUseCase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    container.clearInstances();
    container.registerInstance<IReviewRepository>(
      IReviewRepository as symbol,
      mockReviewRepository
    );
  });

  it('should return paginated comments for a review', async () => {
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

    const useCase = container.resolve(GetReviewCommentsUseCase);
    const result = await useCase.execute({ reviewId: REVIEW_ID });

    expect(result.comments.items).toHaveLength(1);
    expect(result.comments.total).toBe(1);
    expect(mockReviewRepository.getComments).toHaveBeenCalledWith(REVIEW_ID, 1, 20);
  });

  it('should respect pagination parameters', async () => {
    vi.mocked(mockReviewRepository.findById).mockResolvedValue(mockReview);
    vi.mocked(mockReviewRepository.getComments).mockResolvedValue({
      items: [],
      total: 100,
      page: 5,
      pageSize: 10,
      totalPages: 10,
    });

    const useCase = container.resolve(GetReviewCommentsUseCase);
    const result = await useCase.execute({ reviewId: REVIEW_ID, page: 5, pageSize: 10 });

    expect(result.comments.page).toBe(5);
    expect(mockReviewRepository.getComments).toHaveBeenCalledWith(REVIEW_ID, 5, 10);
  });

  it('should enforce maximum page size', async () => {
    vi.mocked(mockReviewRepository.findById).mockResolvedValue(mockReview);
    vi.mocked(mockReviewRepository.getComments).mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      pageSize: 100,
      totalPages: 0,
    });

    const useCase = container.resolve(GetReviewCommentsUseCase);
    await useCase.execute({ reviewId: REVIEW_ID, pageSize: 500 });

    // Should cap at 100
    expect(mockReviewRepository.getComments).toHaveBeenCalledWith(REVIEW_ID, 1, 100);
  });

  it('should enforce minimum page number', async () => {
    vi.mocked(mockReviewRepository.findById).mockResolvedValue(mockReview);
    vi.mocked(mockReviewRepository.getComments).mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      pageSize: 20,
      totalPages: 0,
    });

    const useCase = container.resolve(GetReviewCommentsUseCase);
    await useCase.execute({ reviewId: REVIEW_ID, page: 0 });

    // Should be at least 1
    expect(mockReviewRepository.getComments).toHaveBeenCalledWith(REVIEW_ID, 1, 20);
  });

  it('should throw REVIEW_NOT_FOUND when review does not exist', async () => {
    vi.mocked(mockReviewRepository.findById).mockResolvedValue(null);

    const useCase = container.resolve(GetReviewCommentsUseCase);

    await expect(useCase.execute({ reviewId: REVIEW_ID })).rejects.toThrow(GetReviewCommentsError);

    try {
      await useCase.execute({ reviewId: REVIEW_ID });
    } catch (error) {
      expect((error as GetReviewCommentsError).code).toBe('REVIEW_NOT_FOUND');
    }
  });
});
