/**
 * TmdbApiClient unit tests.
 * Mocks fetch and relies on test env (env.ts returns test defaults when NODE_ENV=test).
 */

import 'reflect-metadata';

import { TmdbApiClient } from '@/infrastructure/tmdb/TmdbApiClient';
import { container } from 'tsyringe';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockFetch = vi.fn();

describe('TmdbApiClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    container.clearInstances();
    vi.stubGlobal('fetch', mockFetch);
    // Client uses env.TMDB_API_KEY ?? process.env.VITE_TMDB_API_KEY; in test env.TMDB_API_KEY is undefined
    process.env.VITE_TMDB_API_KEY = 'test-api-key';
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should call discoverByYear with correct params and return mapped result', async () => {
    const rawResponse = {
      page: 1,
      total_pages: 10,
      total_results: 200,
      results: [
        {
          id: 1,
          title: 'Movie One',
          release_date: '2024-01-15',
          poster_path: '/p1.jpg',
          overview: 'Overview 1',
        },
      ],
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(rawResponse),
    });

    const client = container.resolve(TmdbApiClient);
    const result = await client.discoverByYear(2024, 1);

    expect(result.page).toBe(1);
    expect(result.total_pages).toBe(10);
    expect(result.total_results).toBe(200);
    expect(result.results).toHaveLength(1);
    expect(result.results[0]).toEqual({
      id: 1,
      title: 'Movie One',
      release_date: '2024-01-15',
      poster_path: '/p1.jpg',
      overview: 'Overview 1',
    });
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const call0 = mockFetch.mock.calls[0];
    expect(call0).toBeDefined();
    const [url] = call0!;
    expect(url).toContain('discover/movie');
    expect(url).toContain('primary_release_date.gte=2024-01-01');
    expect(url).toContain('primary_release_date.lte=2024-12-31');
    expect(url).toContain('page=1');
    expect(url).toContain('api_key=test-api-key');
  });

  it('should return getMovieById mapped details', async () => {
    const rawMovie = {
      id: 42,
      title: 'Inception',
      release_date: '2010-07-16',
      poster_path: '/inception.jpg',
      overview: 'A mind heist.',
      runtime: 148,
      genres: [{ id: 1, name: 'Sci-Fi' }],
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(rawMovie),
    });

    const client = container.resolve(TmdbApiClient);
    const result = await client.getMovieById(42);

    expect(result).not.toBeNull();
    expect(result!.id).toBe(42);
    expect(result!.title).toBe('Inception');
    expect(result!.runtime).toBe(148);
    expect(result!.genres).toEqual([{ id: 1, name: 'Sci-Fi' }]);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const call0 = mockFetch.mock.calls[0];
    expect(call0).toBeDefined();
    const [url] = call0!;
    expect(url).toContain('movie/42');
  });

  it('should return null from getMovieById when response has no id', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
    });

    const client = container.resolve(TmdbApiClient);
    const result = await client.getMovieById(999);

    expect(result).toBeNull();
  });

  it('should retry on 429 and succeed on second attempt', async () => {
    const rawResponse = {
      page: 1,
      total_pages: 1,
      total_results: 1,
      results: [{ id: 1, title: 'X', release_date: null, poster_path: null, overview: null }],
    };
    mockFetch.mockResolvedValueOnce({ ok: false, status: 429 }).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(rawResponse),
    });

    const client = container.resolve(TmdbApiClient);
    const result = await client.discoverByYear(2024, 1);

    expect(result.results).toHaveLength(1);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('should throw on non-429 error without retry', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });

    const client = container.resolve(TmdbApiClient);

    await expect(client.discoverByYear(2024, 1)).rejects.toThrow(/TMDb 500/);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('should call nowPlaying with page param', async () => {
    const raw = {
      page: 1,
      total_pages: 1,
      total_results: 5,
      results: [],
    };
    mockFetch.mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve(raw) });

    const client = container.resolve(TmdbApiClient);
    await client.nowPlaying(2);

    const call0 = mockFetch.mock.calls[0];
    expect(call0).toBeDefined();
    const [url] = call0!;
    expect(url).toContain('now_playing');
    expect(url).toContain('page=2');
  });

  it('should call upcoming and popular with page', async () => {
    const raw = { page: 1, total_pages: 1, total_results: 0, results: [] };
    mockFetch.mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve(raw) });

    const client = container.resolve(TmdbApiClient);
    await client.upcoming(1);
    await client.popular(1);

    expect(mockFetch).toHaveBeenCalledTimes(2);
    const call0 = mockFetch.mock.calls[0];
    const call1 = mockFetch.mock.calls[1];
    expect(call0).toBeDefined();
    expect(call1).toBeDefined();
    expect(call0![0]).toContain('upcoming');
    expect(call1![0]).toContain('popular');
  });
});
