/**
 * TMDb API Client Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getImageUrl,
  IMAGE_SIZES,
  GENRE_MAP,
  GENRE_ID_TO_SLUG,
  searchMovies,
  sortMoviesBySearchProminence,
  getTrending,
  getPopular,
  getTopRated,
  getUpcoming,
  getNowPlaying,
  getMoviesByGenre,
  getMovieDetails,
  getMovieCredits,
  getMovieVideos,
  getSimilarMovies,
  getRecommendations,
  getGenres,
} from '@/lib/api/tmdb';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('TMDb API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ results: [], page: 1, total_pages: 1, total_results: 0 }),
    });
  });

  describe('getImageUrl', () => {
    it('returns full URL for valid path', () => {
      const url = getImageUrl('/abc123.jpg');

      expect(url).toBe('https://image.tmdb.org/t/p/w342/abc123.jpg');
    });

    it('returns placeholder for null path', () => {
      const url = getImageUrl(null);

      expect(url).toBe('/placeholder-poster.jpg');
    });

    it('uses correct size for poster small', () => {
      const url = getImageUrl('/test.jpg', 'poster', 'small');

      expect(url).toContain('w185');
    });

    it('uses correct size for poster medium', () => {
      const url = getImageUrl('/test.jpg', 'poster', 'medium');

      expect(url).toContain('w342');
    });

    it('uses correct size for poster large', () => {
      const url = getImageUrl('/test.jpg', 'poster', 'large');

      expect(url).toContain('w500');
    });

    it('uses correct size for poster original', () => {
      const url = getImageUrl('/test.jpg', 'poster', 'original');

      expect(url).toContain('original');
    });

    it('uses correct size for backdrop small', () => {
      const url = getImageUrl('/test.jpg', 'backdrop', 'small');

      expect(url).toContain('w300');
    });

    it('uses correct size for backdrop large', () => {
      const url = getImageUrl('/test.jpg', 'backdrop', 'large');

      expect(url).toContain('w1280');
    });

    it('uses correct size for profile', () => {
      const url = getImageUrl('/test.jpg', 'profile', 'medium');

      expect(url).toContain('w185');
    });
  });

  describe('IMAGE_SIZES', () => {
    it('has poster sizes defined', () => {
      expect(IMAGE_SIZES.poster).toBeDefined();
      expect(IMAGE_SIZES.poster.small).toBe('w185');
      expect(IMAGE_SIZES.poster.medium).toBe('w342');
      expect(IMAGE_SIZES.poster.large).toBe('w500');
    });

    it('has backdrop sizes defined', () => {
      expect(IMAGE_SIZES.backdrop).toBeDefined();
      expect(IMAGE_SIZES.backdrop.small).toBe('w300');
      expect(IMAGE_SIZES.backdrop.large).toBe('w1280');
    });

    it('has profile sizes defined', () => {
      expect(IMAGE_SIZES.profile).toBeDefined();
      expect(IMAGE_SIZES.profile.small).toBe('w45');
    });
  });

  describe('GENRE_MAP', () => {
    it('maps action to correct ID', () => {
      expect(GENRE_MAP.action).toBe(28);
    });

    it('maps comedy to correct ID', () => {
      expect(GENRE_MAP.comedy).toBe(35);
    });

    it('maps drama to correct ID', () => {
      expect(GENRE_MAP.drama).toBe(18);
    });

    it('maps sci-fi to correct ID', () => {
      expect(GENRE_MAP['sci-fi']).toBe(878);
    });
  });

  describe('GENRE_ID_TO_SLUG', () => {
    it('maps ID 28 to action', () => {
      expect(GENRE_ID_TO_SLUG[28]).toBe('action');
    });

    it('maps ID 35 to comedy', () => {
      expect(GENRE_ID_TO_SLUG[35]).toBe('comedy');
    });
  });

  describe('API functions', () => {
    describe('searchMovies', () => {
      it('calls TMDb search endpoint', async () => {
        await searchMovies('Matrix');

        expect(mockFetch).toHaveBeenCalled();
        const url = mockFetch.mock.calls[0]![0];
        expect(url).toContain('/search/movie');
        expect(url).toContain('query=Matrix');
      });

      it('passes page parameter', async () => {
        await searchMovies('Matrix', 2);

        const url = mockFetch.mock.calls[0]![0];
        expect(url).toContain('page=2');
      });

      it('reorders results by popularity then vote count', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            page: 1,
            total_pages: 1,
            total_results: 3,
            results: [
              {
                id: 99,
                title: 'Tiny doc',
                original_title: 'Tiny doc',
                overview: '',
                poster_path: null,
                backdrop_path: null,
                release_date: '',
                vote_average: 8,
                vote_count: 12,
                popularity: 0.5,
                genre_ids: [],
                adult: false,
                original_language: 'en',
              },
              {
                id: 603,
                title: 'The Matrix',
                original_title: 'The Matrix',
                overview: '',
                poster_path: '/p.jpg',
                backdrop_path: null,
                release_date: '1999-03-31',
                vote_average: 8.2,
                vote_count: 20_000,
                popularity: 45.2,
                genre_ids: [28],
                adult: false,
                original_language: 'en',
              },
              {
                id: 604,
                title: 'The Matrix Reloaded',
                original_title: 'The Matrix Reloaded',
                overview: '',
                poster_path: '/p2.jpg',
                backdrop_path: null,
                release_date: '2003-05-15',
                vote_average: 7.1,
                vote_count: 12_000,
                popularity: 30.1,
                genre_ids: [28],
                adult: false,
                original_language: 'en',
              },
            ],
          }),
        });

        const res = await searchMovies('Matrix', 1);

        expect(res.results.map((m) => m.id)).toEqual([603, 604, 99]);
      });
    });

    describe('sortMoviesBySearchProminence', () => {
      it('sorts by popularity, then vote_count, then vote_average', () => {
        const a = {
          id: 1,
          title: 'A',
          original_title: 'A',
          overview: '',
          poster_path: null,
          backdrop_path: null,
          release_date: '',
          vote_average: 9,
          vote_count: 100,
          popularity: 10,
          genre_ids: [],
          adult: false,
          original_language: 'en',
        };
        const b = {
          ...a,
          id: 2,
          popularity: 20,
          vote_count: 50,
        };
        const c = {
          ...a,
          id: 3,
          popularity: 20,
          vote_count: 100,
          vote_average: 8,
        };
        const out = sortMoviesBySearchProminence([a, b, c]);
        expect(out.map((m) => m.id)).toEqual([3, 2, 1]);
      });
    });

    describe('getTrending', () => {
      it('calls trending endpoint with week by default', async () => {
        await getTrending();

        const url = mockFetch.mock.calls[0]![0];
        expect(url).toContain('/trending/movie/week');
      });

      it('calls trending endpoint with day when specified', async () => {
        await getTrending('day');

        const url = mockFetch.mock.calls[0]![0];
        expect(url).toContain('/trending/movie/day');
      });
    });

    describe('getPopular', () => {
      it('calls popular endpoint', async () => {
        await getPopular();

        const url = mockFetch.mock.calls[0]![0];
        expect(url).toContain('/movie/popular');
      });

      it('passes page parameter', async () => {
        await getPopular(3);

        const url = mockFetch.mock.calls[0]![0];
        expect(url).toContain('page=3');
      });
    });

    describe('getTopRated', () => {
      it('calls top_rated endpoint', async () => {
        await getTopRated();

        const url = mockFetch.mock.calls[0]![0];
        expect(url).toContain('/movie/top_rated');
      });
    });

    describe('getUpcoming', () => {
      it('calls upcoming endpoint', async () => {
        await getUpcoming();

        const url = mockFetch.mock.calls[0]![0];
        expect(url).toContain('/movie/upcoming');
      });
    });

    describe('getNowPlaying', () => {
      it('calls now_playing endpoint', async () => {
        await getNowPlaying();

        const url = mockFetch.mock.calls[0]![0];
        expect(url).toContain('/movie/now_playing');
      });
    });

    describe('getMoviesByGenre', () => {
      it('calls discover endpoint with genre', async () => {
        await getMoviesByGenre(28);

        const url = mockFetch.mock.calls[0]![0];
        expect(url).toContain('/discover/movie');
        expect(url).toContain('with_genres=28');
      });
    });

    describe('getMovieDetails', () => {
      it('calls movie details endpoint', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: 123, title: 'Test' }),
        });

        await getMovieDetails(123);

        const url = mockFetch.mock.calls[0]![0];
        expect(url).toContain('/movie/123');
      });

      it('accepts string ID', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: 456, title: 'Test' }),
        });

        await getMovieDetails('456');

        const url = mockFetch.mock.calls[0]![0];
        expect(url).toContain('/movie/456');
      });
    });

    describe('getMovieCredits', () => {
      it('calls credits endpoint', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ cast: [], crew: [] }),
        });

        await getMovieCredits(123);

        const url = mockFetch.mock.calls[0]![0];
        expect(url).toContain('/movie/123/credits');
      });
    });

    describe('getMovieVideos', () => {
      it('calls videos endpoint', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ results: [] }),
        });

        await getMovieVideos(123);

        const url = mockFetch.mock.calls[0]![0];
        expect(url).toContain('/movie/123/videos');
      });
    });

    describe('getSimilarMovies', () => {
      it('calls similar endpoint', async () => {
        await getSimilarMovies(123);

        const url = mockFetch.mock.calls[0]![0];
        expect(url).toContain('/movie/123/similar');
      });
    });

    describe('getRecommendations', () => {
      it('calls recommendations endpoint', async () => {
        await getRecommendations(123);

        const url = mockFetch.mock.calls[0]![0];
        expect(url).toContain('/movie/123/recommendations');
      });
    });

    describe('getGenres', () => {
      it('calls genre list endpoint', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ genres: [] }),
        });

        await getGenres();

        const url = mockFetch.mock.calls[0]![0];
        expect(url).toContain('/genre/movie/list');
      });
    });

    describe('error handling', () => {
      it('throws error on non-ok response', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 404,
        });

        await expect(getPopular()).rejects.toThrow('TMDb API error: 404');
      });

      it('throws error on 401', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 401,
        });

        await expect(getPopular()).rejects.toThrow('TMDb API error: 401');
      });
    });
  });
});
