/**
 * Films API Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { registerFilm, getFilmByTmdbId, getFilmById } from '@/lib/api/films';
import { api } from '@/lib/api/client';

// Mock the API client
vi.mock('@/lib/api/client', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const mockApi = api as unknown as {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
};

const mockFilm = {
  id: 'uuid-123',
  tmdbId: 12345,
  title: 'Test Movie',
  year: '2024',
  poster: '/poster.jpg',
  plot: 'A test movie plot',
  director: null,
  genre: 'Action, Drama',
  runtime: '120 min',
  tmdbRating: '8.5',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

describe('Films API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('registerFilm', () => {
    it('should register a film with TMDb data', async () => {
      mockApi.post.mockResolvedValue(mockFilm);

      const input = {
        tmdbId: 12345,
        title: 'Test Movie',
        year: '2024',
        poster: '/poster.jpg',
        plot: 'A test movie plot',
        genre: 'Action, Drama',
        runtime: '120 min',
      };

      const result = await registerFilm(input);

      expect(mockApi.post).toHaveBeenCalledWith('/api/v1/films/tmdb', input);
      expect(result).toEqual(mockFilm);
    });

    it('should handle optional fields', async () => {
      mockApi.post.mockResolvedValue(mockFilm);

      const input = {
        tmdbId: 12345,
        title: 'Test Movie',
      };

      await registerFilm(input);

      expect(mockApi.post).toHaveBeenCalledWith('/api/v1/films/tmdb', input);
    });
  });

  describe('getFilmByTmdbId', () => {
    it('should get a film by TMDb ID', async () => {
      mockApi.get.mockResolvedValue(mockFilm);

      const result = await getFilmByTmdbId(12345);

      expect(mockApi.get).toHaveBeenCalledWith('/api/v1/films/tmdb/12345');
      expect(result).toEqual(mockFilm);
    });

    it('should return null when film not found', async () => {
      mockApi.get.mockRejectedValue(new Error('Not found'));

      const result = await getFilmByTmdbId(99999);

      expect(result).toBeNull();
    });
  });

  describe('getFilmById', () => {
    it('should get a film by internal UUID', async () => {
      mockApi.get.mockResolvedValue(mockFilm);

      const result = await getFilmById('uuid-123');

      expect(mockApi.get).toHaveBeenCalledWith('/api/v1/films/uuid-123');
      expect(result).toEqual(mockFilm);
    });
  });
});
