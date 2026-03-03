/**
 * TMDb API client implementation.
 * Rate-limited and retries on 429 (exponential backoff).
 */

import { injectable } from 'tsyringe';

import { env } from '../../config/env.js';
import type {
  ITmdbClient,
  TmdbDiscoverResult,
  TmdbMovieDetails,
} from '../../domain/repositories/ITmdbClient.js';

const MAX_RETRIES = 3;
const BACKOFF_MS = [1000, 2000, 4000];

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

interface RawDiscoverResponse {
  page: number;
  results: Array<{
    id: number;
    title: string;
    release_date?: string;
    poster_path: string | null;
    overview?: string;
  }>;
  total_pages: number;
  total_results: number;
}

@injectable()
export class TmdbApiClient implements ITmdbClient {
  private lastCallTime = 0;

  private get baseUrl(): string {
    return env.TMDB_BASE_URL;
  }

  private get apiKey(): string {
    return env.TMDB_API_KEY ?? process.env.VITE_TMDB_API_KEY ?? '';
  }

  private get rateLimitMs(): number {
    return env.TMDB_RATE_LIMIT_MS;
  }

  private async waitRateLimit(): Promise<void> {
    const elapsed = Date.now() - this.lastCallTime;
    if (elapsed < this.rateLimitMs) {
      await sleep(this.rateLimitMs - elapsed);
    }
    this.lastCallTime = Date.now();
  }

  private async fetchWithRetry<T>(
    endpoint: string,
    params: Record<string, string> = {}
  ): Promise<T> {
    await this.waitRateLimit();
    const url = new URL(`${this.baseUrl.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`);
    url.searchParams.set('api_key', this.apiKey);
    url.searchParams.set('language', 'en-US');
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

    let lastError: Error | null = null;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      if (attempt > 0) {
        await sleep(BACKOFF_MS[attempt - 1] ?? 4000);
      }
      const res = await fetch(url.toString());
      if (res.status === 429) {
        lastError = new Error(`TMDb rate limit (429): ${endpoint}`);
        continue;
      }
      if (!res.ok) {
        throw new Error(`TMDb ${res.status}: ${endpoint}`);
      }
      return res.json() as Promise<T>;
    }
    throw lastError ?? new Error(`TMDb failed after ${MAX_RETRIES + 1} attempts: ${endpoint}`);
  }

  private mapResult(raw: RawDiscoverResponse): TmdbDiscoverResult {
    return {
      page: raw.page,
      total_pages: raw.total_pages,
      total_results: raw.total_results,
      results: raw.results.map((r) => ({
        id: r.id,
        title: r.title,
        release_date: r.release_date,
        poster_path: r.poster_path,
        overview: r.overview,
      })),
    };
  }

  async discoverByYear(year: number, page: number): Promise<TmdbDiscoverResult> {
    const gte = `${year}-01-01`;
    const lte = `${year}-12-31`;
    const raw = await this.fetchWithRetry<RawDiscoverResponse>('/discover/movie', {
      'primary_release_date.gte': gte,
      'primary_release_date.lte': lte,
      page: String(page),
      sort_by: 'popularity.desc',
      include_adult: 'false',
    });
    return this.mapResult(raw);
  }

  async getMovieById(tmdbId: number): Promise<TmdbMovieDetails | null> {
    const raw = await this.fetchWithRetry<{
      id: number;
      title?: string;
      release_date?: string;
      poster_path?: string | null;
      overview?: string;
      runtime?: number | null;
      genres?: Array<{ id: number; name: string }>;
    }>(`/movie/${tmdbId}`);
    if (!raw?.id) return null;
    return {
      id: raw.id,
      title: raw.title ?? '',
      release_date: raw.release_date,
      poster_path: raw.poster_path ?? null,
      overview: raw.overview,
      runtime: raw.runtime,
      genres: raw.genres,
    };
  }

  async nowPlaying(page: number): Promise<TmdbDiscoverResult> {
    const raw = await this.fetchWithRetry<RawDiscoverResponse>('/movie/now_playing', {
      page: String(page),
    });
    return this.mapResult(raw);
  }

  async upcoming(page: number): Promise<TmdbDiscoverResult> {
    const raw = await this.fetchWithRetry<RawDiscoverResponse>('/movie/upcoming', {
      page: String(page),
    });
    return this.mapResult(raw);
  }

  async popular(page: number): Promise<TmdbDiscoverResult> {
    const raw = await this.fetchWithRetry<RawDiscoverResponse>('/movie/popular', {
      page: String(page),
    });
    return this.mapResult(raw);
  }

  async getSimilar(tmdbId: number, page = 1): Promise<TmdbDiscoverResult> {
    const raw = await this.fetchWithRetry<RawDiscoverResponse>(`/movie/${tmdbId}/similar`, {
      page: String(page),
    });
    return this.mapResult(raw);
  }

  async getRecommendations(tmdbId: number, page = 1): Promise<TmdbDiscoverResult> {
    const raw = await this.fetchWithRetry<RawDiscoverResponse>(`/movie/${tmdbId}/recommendations`, {
      page: String(page),
    });
    return this.mapResult(raw);
  }
}
