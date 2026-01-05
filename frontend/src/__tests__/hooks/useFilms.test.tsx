/**
 * useFilms Hook Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import {
  useFilm,
  useFilmCredits,
  useFilmVideos,
  useSimilarFilms,
  useRegisterFilm,
  usePopularFilms,
  useTrendingFilms,
  useTopRatedFilms,
  useUpcomingFilms,
  useNowPlayingFilms,
  useSearchFilms,
  useFilmsByGenre,
} from '@/hooks/useFilms';

// Mock the API modules
vi.mock('@/lib/api/tmdb', () => ({
  getMovieDetails: vi.fn(),
  getMovieCredits: vi.fn(),
  getMovieVideos: vi.fn(),
  getSimilarMovies: vi.fn(),
  getPopular: vi.fn(),
  searchMovies: vi.fn(),
  getTrending: vi.fn(),
  getTopRated: vi.fn(),
  getUpcoming: vi.fn(),
  getNowPlaying: vi.fn(),
  getMoviesByGenre: vi.fn(),
}));

vi.mock('@/lib/api/films', () => ({
  registerFilm: vi.fn(),
}));

import * as tmdbApi from '@/lib/api/tmdb';
import * as filmsApi from '@/lib/api/films';

const mockTmdbApi = tmdbApi as unknown as {
  getMovieDetails: ReturnType<typeof vi.fn>;
  getMovieCredits: ReturnType<typeof vi.fn>;
  getMovieVideos: ReturnType<typeof vi.fn>;
  getSimilarMovies: ReturnType<typeof vi.fn>;
  getPopular: ReturnType<typeof vi.fn>;
  searchMovies: ReturnType<typeof vi.fn>;
  getTrending: ReturnType<typeof vi.fn>;
  getTopRated: ReturnType<typeof vi.fn>;
  getUpcoming: ReturnType<typeof vi.fn>;
  getNowPlaying: ReturnType<typeof vi.fn>;
  getMoviesByGenre: ReturnType<typeof vi.fn>;
};

const mockFilmsApi = filmsApi as unknown as {
  registerFilm: ReturnType<typeof vi.fn>;
};

const mockFilm = {
  id: 12345,
  title: 'Test Movie',
  overview: 'A test movie',
  poster_path: '/poster.jpg',
  backdrop_path: '/backdrop.jpg',
  release_date: '2024-01-01',
  vote_average: 8.5,
  vote_count: 1000,
  genres: [{ id: 28, name: 'Action' }],
  runtime: 120,
};

const mockCredits = {
  id: 12345,
  cast: [{ id: 1, name: 'Actor 1', character: 'Hero', profile_path: null, order: 0 }],
  crew: [{ id: 2, name: 'Director', job: 'Director', department: 'Directing', profile_path: null }],
};

const mockVideos = {
  results: [
    { id: 'v1', key: 'abc123', name: 'Trailer', site: 'YouTube', type: 'Trailer', official: true },
  ],
};

const mockSearchResponse = {
  page: 1,
  results: [mockFilm],
  total_pages: 1,
  total_results: 1,
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

describe('useFilms hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useFilm', () => {
    it('should fetch film details', async () => {
      mockTmdbApi.getMovieDetails.mockResolvedValue(mockFilm);

      const { result } = renderHook(() => useFilm(12345), { wrapper: createWrapper() });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockTmdbApi.getMovieDetails).toHaveBeenCalledWith(12345);
      expect(result.current.data).toEqual(mockFilm);
    });

    it('should not fetch when id is empty', () => {
      renderHook(() => useFilm(''), { wrapper: createWrapper() });

      expect(mockTmdbApi.getMovieDetails).not.toHaveBeenCalled();
    });
  });

  describe('useFilmCredits', () => {
    it('should fetch film credits', async () => {
      mockTmdbApi.getMovieCredits.mockResolvedValue(mockCredits);

      const { result } = renderHook(() => useFilmCredits(12345), { wrapper: createWrapper() });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockTmdbApi.getMovieCredits).toHaveBeenCalledWith(12345);
      expect(result.current.data).toEqual(mockCredits);
    });

    it('should not fetch when disabled', () => {
      renderHook(() => useFilmCredits(12345, false), { wrapper: createWrapper() });

      expect(mockTmdbApi.getMovieCredits).not.toHaveBeenCalled();
    });
  });

  describe('useFilmVideos', () => {
    it('should fetch film videos', async () => {
      mockTmdbApi.getMovieVideos.mockResolvedValue(mockVideos);

      const { result } = renderHook(() => useFilmVideos(12345), { wrapper: createWrapper() });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockTmdbApi.getMovieVideos).toHaveBeenCalledWith(12345);
      expect(result.current.data).toEqual(mockVideos);
    });
  });

  describe('useSimilarFilms', () => {
    it('should fetch similar films', async () => {
      mockTmdbApi.getSimilarMovies.mockResolvedValue(mockSearchResponse);

      const { result } = renderHook(() => useSimilarFilms(12345), { wrapper: createWrapper() });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockTmdbApi.getSimilarMovies).toHaveBeenCalledWith(12345);
    });
  });

  describe('useRegisterFilm', () => {
    it('should register a film', async () => {
      const backendFilm = { id: 'uuid-123', tmdbId: 12345, title: 'Test Movie' };
      mockFilmsApi.registerFilm.mockResolvedValue(backendFilm);

      const { result } = renderHook(() => useRegisterFilm(mockFilm as never), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockFilmsApi.registerFilm).toHaveBeenCalled();
      expect(result.current.data).toEqual(backendFilm);
    });

    it('should not register when film is undefined', () => {
      renderHook(() => useRegisterFilm(undefined), { wrapper: createWrapper() });

      expect(mockFilmsApi.registerFilm).not.toHaveBeenCalled();
    });
  });

  describe('usePopularFilms', () => {
    it('should fetch popular films', async () => {
      mockTmdbApi.getPopular.mockResolvedValue(mockSearchResponse);

      const { result } = renderHook(() => usePopularFilms(), { wrapper: createWrapper() });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockTmdbApi.getPopular).toHaveBeenCalledWith(1);
    });

    it('should fetch with custom page', async () => {
      mockTmdbApi.getPopular.mockResolvedValue(mockSearchResponse);

      const { result } = renderHook(() => usePopularFilms(2), { wrapper: createWrapper() });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockTmdbApi.getPopular).toHaveBeenCalledWith(2);
    });
  });

  describe('useTrendingFilms', () => {
    it('should fetch trending films', async () => {
      mockTmdbApi.getTrending.mockResolvedValue(mockSearchResponse);

      const { result } = renderHook(() => useTrendingFilms(), { wrapper: createWrapper() });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockTmdbApi.getTrending).toHaveBeenCalledWith('week');
    });

    it('should fetch with custom time window', async () => {
      mockTmdbApi.getTrending.mockResolvedValue(mockSearchResponse);

      const { result } = renderHook(() => useTrendingFilms('day'), { wrapper: createWrapper() });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockTmdbApi.getTrending).toHaveBeenCalledWith('day');
    });
  });

  describe('useTopRatedFilms', () => {
    it('should fetch top rated films', async () => {
      mockTmdbApi.getTopRated.mockResolvedValue(mockSearchResponse);

      const { result } = renderHook(() => useTopRatedFilms(), { wrapper: createWrapper() });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockTmdbApi.getTopRated).toHaveBeenCalledWith(1);
    });
  });

  describe('useUpcomingFilms', () => {
    it('should fetch upcoming films', async () => {
      mockTmdbApi.getUpcoming.mockResolvedValue(mockSearchResponse);

      const { result } = renderHook(() => useUpcomingFilms(), { wrapper: createWrapper() });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockTmdbApi.getUpcoming).toHaveBeenCalledWith(1);
    });
  });

  describe('useNowPlayingFilms', () => {
    it('should fetch now playing films', async () => {
      mockTmdbApi.getNowPlaying.mockResolvedValue(mockSearchResponse);

      const { result } = renderHook(() => useNowPlayingFilms(), { wrapper: createWrapper() });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockTmdbApi.getNowPlaying).toHaveBeenCalledWith(1);
    });
  });

  describe('useSearchFilms', () => {
    it('should search films', async () => {
      mockTmdbApi.searchMovies.mockResolvedValue(mockSearchResponse);

      const { result } = renderHook(() => useSearchFilms('test'), { wrapper: createWrapper() });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockTmdbApi.searchMovies).toHaveBeenCalledWith('test', 1);
    });

    it('should not search with empty query', () => {
      renderHook(() => useSearchFilms(''), { wrapper: createWrapper() });

      expect(mockTmdbApi.searchMovies).not.toHaveBeenCalled();
    });
  });

  describe('useFilmsByGenre', () => {
    it('should fetch films by genre', async () => {
      mockTmdbApi.getMoviesByGenre.mockResolvedValue(mockSearchResponse);

      const { result } = renderHook(() => useFilmsByGenre(28), { wrapper: createWrapper() });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockTmdbApi.getMoviesByGenre).toHaveBeenCalledWith(28, 1);
    });

    it('should not fetch with invalid genre', () => {
      renderHook(() => useFilmsByGenre(0), { wrapper: createWrapper() });

      expect(mockTmdbApi.getMoviesByGenre).not.toHaveBeenCalled();
    });
  });
});
