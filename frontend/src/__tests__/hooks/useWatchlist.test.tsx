/**
 * useWatchlist Hook Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import {
  useWatchlist,
  useIsInWatchlist,
  useAddToWatchlist,
  useRemoveFromWatchlist,
  useToggleWatchlist,
} from '@/hooks/useWatchlist';

vi.mock('@/lib/api/client', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

import { api } from '@/lib/api/client';

const mockApi = api as unknown as {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
};

const mockWatchlistResponse = {
  items: [
    {
      id: 'wl-1',
      userId: 'user-1',
      filmId: 'film-1',
      addedAt: '2024-01-01T00:00:00Z',
      film: {
        id: 'film-1',
        tmdbId: 550,
        title: 'Fight Club',
        year: '1999',
        poster: '/poster.jpg',
      },
    },
  ],
  count: 1,
};

const mockCheckResponse = { isInWatchlist: true };

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

describe('useWatchlist hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useWatchlist', () => {
    it('should fetch watchlist', async () => {
      mockApi.get.mockResolvedValue(mockWatchlistResponse);

      const { result } = renderHook(() => useWatchlist(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockWatchlistResponse);
      expect(mockApi.get).toHaveBeenCalledWith('/api/v1/watchlist');
    });

    it('should return undefined while loading', () => {
      mockApi.get.mockImplementation(() => new Promise(() => {}));

      const { result } = renderHook(() => useWatchlist(), { wrapper: createWrapper() });

      expect(result.current.data).toBeUndefined();
      expect(result.current.isLoading).toBe(true);
    });
  });

  describe('useIsInWatchlist', () => {
    it('should fetch check result when filmId is provided', async () => {
      mockApi.get.mockResolvedValue(mockCheckResponse);

      const { result } = renderHook(() => useIsInWatchlist('film-123'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual({ isInWatchlist: true });
      expect(mockApi.get).toHaveBeenCalledWith('/api/v1/watchlist/check/film-123');
    });

    it('should not run query when filmId is undefined', () => {
      const { result } = renderHook(() => useIsInWatchlist(undefined), {
        wrapper: createWrapper(),
      });

      expect(result.current.isFetching).toBe(false);
      expect(mockApi.get).not.toHaveBeenCalled();
    });

    it('should return isInWatchlist: false when API returns false', async () => {
      mockApi.get.mockResolvedValue({ isInWatchlist: false });

      const { result } = renderHook(() => useIsInWatchlist('film-456'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual({ isInWatchlist: false });
    });
  });

  describe('useAddToWatchlist', () => {
    it('should add film to watchlist', async () => {
      mockApi.post.mockResolvedValue({});

      const { result } = renderHook(() => useAddToWatchlist(), { wrapper: createWrapper() });

      result.current.mutate({ filmId: 'film-789' });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApi.post).toHaveBeenCalledWith('/api/v1/watchlist', { filmId: 'film-789' });
    });
  });

  describe('useRemoveFromWatchlist', () => {
    it('should remove film from watchlist', async () => {
      mockApi.delete.mockResolvedValue(undefined);

      const { result } = renderHook(() => useRemoveFromWatchlist(), { wrapper: createWrapper() });

      result.current.mutate('film-999');

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApi.delete).toHaveBeenCalledWith('/api/v1/watchlist/film-999');
    });
  });

  describe('useToggleWatchlist', () => {
    it('should call remove when currently in watchlist', async () => {
      mockApi.delete.mockResolvedValue(undefined);

      const { result } = renderHook(() => useToggleWatchlist(), { wrapper: createWrapper() });

      await result.current.toggleWatchlist('film-1', true);

      expect(mockApi.delete).toHaveBeenCalledWith('/api/v1/watchlist/film-1');
      expect(mockApi.post).not.toHaveBeenCalled();
    });

    it('should call add when not in watchlist', async () => {
      mockApi.post.mockResolvedValue({});

      const { result } = renderHook(() => useToggleWatchlist(), { wrapper: createWrapper() });

      await result.current.toggleWatchlist('film-2', false);

      expect(mockApi.post).toHaveBeenCalledWith('/api/v1/watchlist', { filmId: 'film-2' });
      expect(mockApi.delete).not.toHaveBeenCalled();
    });

    it('should expose isLoading from add and remove mutations', async () => {
      mockApi.post.mockImplementation(() => new Promise(() => {}));

      const { result } = renderHook(() => useToggleWatchlist(), { wrapper: createWrapper() });

      result.current.toggleWatchlist('film-3', false);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(true);
      });
    });
  });
});
