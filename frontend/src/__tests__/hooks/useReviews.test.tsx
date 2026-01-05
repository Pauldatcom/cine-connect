/**
 * useReviews Hook Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import {
  useFilmReviews,
  useReview,
  useUserReviews,
  useCreateReview,
  useUpdateReview,
  useDeleteReview,
  useLikeReview,
  useReviewLikes,
  useReviewComments,
  useAddComment,
  useDeleteComment,
} from '@/hooks/useReviews';

// Mock the reviews API
vi.mock('@/lib/api/reviews', () => ({
  getFilmReviews: vi.fn(),
  getReview: vi.fn(),
  getUserReviews: vi.fn(),
  createReview: vi.fn(),
  updateReview: vi.fn(),
  deleteReview: vi.fn(),
  likeReview: vi.fn(),
  getReviewLikes: vi.fn(),
  getReviewComments: vi.fn(),
  commentOnReview: vi.fn(),
  deleteComment: vi.fn(),
}));

import * as reviewsApi from '@/lib/api/reviews';

const mockReviewsApi = reviewsApi as unknown as {
  getFilmReviews: ReturnType<typeof vi.fn>;
  getReview: ReturnType<typeof vi.fn>;
  getUserReviews: ReturnType<typeof vi.fn>;
  createReview: ReturnType<typeof vi.fn>;
  updateReview: ReturnType<typeof vi.fn>;
  deleteReview: ReturnType<typeof vi.fn>;
  likeReview: ReturnType<typeof vi.fn>;
  getReviewLikes: ReturnType<typeof vi.fn>;
  getReviewComments: ReturnType<typeof vi.fn>;
  commentOnReview: ReturnType<typeof vi.fn>;
  deleteComment: ReturnType<typeof vi.fn>;
};

const mockReview = {
  id: 'review-1',
  userId: 'user-1',
  filmId: 'film-1',
  rating: 4,
  comment: 'Great movie!',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const mockPaginatedReviews = {
  items: [mockReview],
  total: 1,
  page: 1,
  pageSize: 20,
  totalPages: 1,
};

const mockComment = {
  id: 'comment-1',
  userId: 'user-1',
  reviewId: 'review-1',
  content: 'Nice review!',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  user: { id: 'user-1', username: 'test', avatarUrl: null },
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('useReviews hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useFilmReviews', () => {
    it('should fetch film reviews', async () => {
      mockReviewsApi.getFilmReviews.mockResolvedValue(mockPaginatedReviews);

      const { result } = renderHook(() => useFilmReviews('film-1'), { wrapper: createWrapper() });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockReviewsApi.getFilmReviews).toHaveBeenCalledWith('film-1', 1, 20);
      expect(result.current.data).toEqual(mockPaginatedReviews);
    });

    it('should not fetch when filmId is undefined', () => {
      renderHook(() => useFilmReviews(undefined), { wrapper: createWrapper() });

      expect(mockReviewsApi.getFilmReviews).not.toHaveBeenCalled();
    });
  });

  describe('useReview', () => {
    it('should fetch a single review', async () => {
      mockReviewsApi.getReview.mockResolvedValue(mockReview);

      const { result } = renderHook(() => useReview('review-1'), { wrapper: createWrapper() });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockReviewsApi.getReview).toHaveBeenCalledWith('review-1');
      expect(result.current.data).toEqual(mockReview);
    });

    it('should not fetch when reviewId is undefined', () => {
      renderHook(() => useReview(undefined), { wrapper: createWrapper() });

      expect(mockReviewsApi.getReview).not.toHaveBeenCalled();
    });
  });

  describe('useUserReviews', () => {
    it('should fetch user reviews', async () => {
      mockReviewsApi.getUserReviews.mockResolvedValue([mockReview]);

      const { result } = renderHook(() => useUserReviews('user-1'), { wrapper: createWrapper() });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockReviewsApi.getUserReviews).toHaveBeenCalledWith('user-1');
    });

    it('should not fetch when userId is undefined', () => {
      renderHook(() => useUserReviews(undefined), { wrapper: createWrapper() });

      expect(mockReviewsApi.getUserReviews).not.toHaveBeenCalled();
    });
  });

  describe('useCreateReview', () => {
    it('should create a review', async () => {
      mockReviewsApi.createReview.mockResolvedValue(mockReview);

      const { result } = renderHook(() => useCreateReview('film-1'), { wrapper: createWrapper() });

      result.current.mutate({ filmId: 'film-1', rating: 4, comment: 'Great!' });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockReviewsApi.createReview).toHaveBeenCalledWith({
        filmId: 'film-1',
        rating: 4,
        comment: 'Great!',
      });
    });
  });

  describe('useUpdateReview', () => {
    it('should update a review', async () => {
      mockReviewsApi.updateReview.mockResolvedValue(mockReview);

      const { result } = renderHook(() => useUpdateReview('film-1'), { wrapper: createWrapper() });

      result.current.mutate({ reviewId: 'review-1', input: { rating: 5 } });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockReviewsApi.updateReview).toHaveBeenCalledWith('review-1', { rating: 5 });
    });
  });

  describe('useDeleteReview', () => {
    it('should delete a review', async () => {
      mockReviewsApi.deleteReview.mockResolvedValue(undefined);

      const { result } = renderHook(() => useDeleteReview('film-1'), { wrapper: createWrapper() });

      result.current.mutate('review-1');

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockReviewsApi.deleteReview).toHaveBeenCalledWith('review-1');
    });
  });

  describe('useLikeReview', () => {
    it('should like a review', async () => {
      mockReviewsApi.likeReview.mockResolvedValue({ liked: true, likesCount: 1 });

      const { result } = renderHook(() => useLikeReview('film-1'), { wrapper: createWrapper() });

      result.current.mutate('review-1');

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockReviewsApi.likeReview).toHaveBeenCalledWith('review-1');
    });
  });

  describe('useReviewLikes', () => {
    it('should fetch review likes', async () => {
      const mockLikes = { users: [], count: 5 };
      mockReviewsApi.getReviewLikes.mockResolvedValue(mockLikes);

      const { result } = renderHook(() => useReviewLikes('review-1'), { wrapper: createWrapper() });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockReviewsApi.getReviewLikes).toHaveBeenCalledWith('review-1', 10);
    });

    it('should not fetch when reviewId is undefined', () => {
      renderHook(() => useReviewLikes(undefined), { wrapper: createWrapper() });

      expect(mockReviewsApi.getReviewLikes).not.toHaveBeenCalled();
    });
  });

  describe('useReviewComments', () => {
    it('should fetch review comments', async () => {
      const mockComments = { items: [mockComment], total: 1, page: 1, pageSize: 20, totalPages: 1 };
      mockReviewsApi.getReviewComments.mockResolvedValue(mockComments);

      const { result } = renderHook(() => useReviewComments('review-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockReviewsApi.getReviewComments).toHaveBeenCalledWith('review-1', 1, 20);
    });

    it('should not fetch when reviewId is undefined', () => {
      renderHook(() => useReviewComments(undefined), { wrapper: createWrapper() });

      expect(mockReviewsApi.getReviewComments).not.toHaveBeenCalled();
    });
  });

  describe('useAddComment', () => {
    it('should add a comment', async () => {
      mockReviewsApi.commentOnReview.mockResolvedValue({ comment: mockComment, commentsCount: 1 });

      const { result } = renderHook(() => useAddComment('review-1'), { wrapper: createWrapper() });

      result.current.mutate('Nice review!');

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockReviewsApi.commentOnReview).toHaveBeenCalledWith('review-1', 'Nice review!');
    });
  });

  describe('useDeleteComment', () => {
    it('should delete a comment', async () => {
      mockReviewsApi.deleteComment.mockResolvedValue(undefined);

      const { result } = renderHook(() => useDeleteComment('review-1'), {
        wrapper: createWrapper(),
      });

      result.current.mutate('comment-1');

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockReviewsApi.deleteComment).toHaveBeenCalledWith('review-1', 'comment-1');
    });
  });
});
