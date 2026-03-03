/**
 * Get Recommendations Use Case
 * Content-based film recommendations from user's reviews (high ratings) and watchlist.
 * Scores candidate films by genre overlap; uses rating bands and diversity; can enrich
 * with TMDb similar/recommendations; fallback to TMDb popular when no preferences.
 */

import { inject, injectable } from 'tsyringe';

import type { Film } from '../../../domain/entities/Film.js';
import type { CreateFilmProps } from '../../../domain/entities/Film.js';
import { IFilmRepository } from '../../../domain/repositories/IFilmRepository.js';
import { IReviewRepository } from '../../../domain/repositories/IReviewRepository.js';
import { IWatchlistRepository } from '../../../domain/repositories/IWatchlistRepository.js';
import { ITmdbClient } from '../../../domain/repositories/ITmdbClient.js';
import type { TmdbMovieListItem } from '../../../domain/repositories/ITmdbClient.js';

/** Minimum rating (1-10) to consider a film as a positive signal for genre preference */
const HIGH_RATING_THRESHOLD = 7;

/** Rating band weights: stronger likes count more (9-10 -> 3, 8-9 -> 2, 7-8 -> 1) */
function ratingWeight(rating: number): number {
  if (rating >= 9) return 3;
  if (rating >= 8) return 2;
  if (rating >= HIGH_RATING_THRESHOLD) return 1;
  return 0;
}

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;
const CANDIDATE_POOL_SIZE = 500;
const MAX_PER_GENRE = 6;
const TOP_RATED_FILMS_FOR_SIMILAR = 3;

/** Recommend only films at least this many years old (exclude current + previous year) */
const MIN_FILM_AGE_YEARS = 2;

/**
 * Exclude films without a poster or that are too recent (no poster, or released in the last MIN_FILM_AGE_YEARS years).
 */
function isRecommendable(film: { poster: string | null; year: string | null }): boolean {
  if (!film.poster || film.poster.trim() === '') return false;
  const year = film.year ? parseInt(film.year, 10) : NaN;
  if (Number.isNaN(year)) return true; // keep if year unknown
  const currentYear = new Date().getFullYear();
  return year <= currentYear - MIN_FILM_AGE_YEARS;
}

export interface GetRecommendationsInput {
  userId: string;
  limit?: number;
}

export interface GetRecommendationsOutput {
  films: Film[];
}

/**
 * Parse comma-separated genre string into normalized tokens (trimmed, non-empty).
 */
function parseGenres(genre: string | null | undefined): string[] {
  if (!genre || typeof genre !== 'string') return [];
  return genre
    .split(',')
    .map((g) => g.trim().toLowerCase())
    .filter(Boolean);
}

/** Map TMDb list item to minimal CreateFilmProps for upsert */
function tmdbItemToCreateFilmProps(item: TmdbMovieListItem): CreateFilmProps {
  const year = item.release_date?.slice(0, 4) ?? null;
  return {
    tmdbId: item.id,
    title: item.title,
    year,
    poster: item.poster_path,
    plot: item.overview ?? null,
  };
}

@injectable()
export class GetRecommendationsUseCase {
  constructor(
    @inject(IReviewRepository as symbol)
    private reviewRepository: IReviewRepository,
    @inject(IWatchlistRepository as symbol)
    private watchlistRepository: IWatchlistRepository,
    @inject(IFilmRepository as symbol)
    private filmRepository: IFilmRepository,
    @inject(ITmdbClient as symbol)
    private tmdbClient: import('../../../domain/repositories/ITmdbClient.js').ITmdbClient
  ) {}

  async execute(input: GetRecommendationsInput): Promise<GetRecommendationsOutput> {
    const limit = Math.min(MAX_LIMIT, Math.max(1, input.limit ?? DEFAULT_LIMIT));

    const [reviews, watchlistItems] = await Promise.all([
      this.reviewRepository.findByUserId(input.userId, 200),
      this.watchlistRepository.findByUserId(input.userId),
    ]);

    const excludedFilmIds = new Set<string>();
    const excludedTmdbIds = new Set<number>();
    const genreWeights: Record<string, number> = {};

    // Collect excluded IDs and build genre weights (rating-band weighted for reviews)
    const highRatedFilmsForSimilar: { tmdbId: number }[] = [];
    for (const review of reviews) {
      excludedFilmIds.add(review.filmId);
      if (review.film?.tmdbId !== null && review.film?.tmdbId !== undefined)
        excludedTmdbIds.add(review.film.tmdbId);
      const weight = ratingWeight(review.rating);
      if (weight > 0 && review.film?.genre) {
        for (const g of parseGenres(review.film.genre)) {
          genreWeights[g] = (genreWeights[g] ?? 0) + weight;
        }
        if (
          review.film.tmdbId !== null &&
          review.film.tmdbId !== undefined &&
          highRatedFilmsForSimilar.length < TOP_RATED_FILMS_FOR_SIMILAR &&
          review.rating >= 8
        ) {
          highRatedFilmsForSimilar.push({ tmdbId: review.film.tmdbId });
        }
      }
    }

    // Add watchlist films to excluded set and to genre preferences (weight 1)
    for (const item of watchlistItems) {
      excludedFilmIds.add(item.filmId);
      const film = item.film as { tmdbId?: number; genre?: string | null };
      if (film?.tmdbId !== null && film?.tmdbId !== undefined) excludedTmdbIds.add(film.tmdbId);
      if (film?.genre) {
        for (const g of parseGenres(film.genre)) {
          genreWeights[g] = (genreWeights[g] ?? 0) + 1;
        }
      }
    }

    const hasPreferences = Object.keys(genreWeights).length > 0;

    if (!hasPreferences) {
      // Fallback: TMDb popular so new users get good defaults
      const popularResult = await this.tmdbClient.popular(1);
      const films: Film[] = [];
      for (const item of popularResult.results.slice(0, limit * 2)) {
        if (excludedTmdbIds.has(item.id)) continue;
        try {
          const film = await this.filmRepository.upsertByTmdbId(tmdbItemToCreateFilmProps(item));
          if (isRecommendable(film)) films.push(film);
        } catch {
          // Skip if upsert fails (e.g. invalid data)
        }
      }
      return { films: films.slice(0, limit) };
    }

    // Fetch a pool of candidate films (paginate to get enough)
    const candidates: Film[] = [];
    let page = 1;
    const pageSize = 100;
    while (candidates.length < CANDIDATE_POOL_SIZE) {
      const { items } = await this.filmRepository.findAllPaginated({
        page,
        limit: pageSize,
        search: undefined,
        genre: undefined,
      });
      if (items.length === 0) break;
      for (const film of items) {
        if (!excludedFilmIds.has(film.id) && isRecommendable(film)) {
          candidates.push(film);
        }
      }
      if (items.length < pageSize) break;
      page++;
    }

    // Enrich with TMDb similar/recommendations for top-rated films
    const similarFilmIds = new Set<string>();
    for (const { tmdbId } of highRatedFilmsForSimilar) {
      try {
        const [similarRes, recRes] = await Promise.all([
          this.tmdbClient.getSimilar(tmdbId, 1),
          this.tmdbClient.getRecommendations(tmdbId, 1),
        ]);
        for (const item of [...similarRes.results, ...recRes.results]) {
          if (excludedTmdbIds.has(item.id)) continue;
          try {
            const film = await this.filmRepository.upsertByTmdbId(tmdbItemToCreateFilmProps(item));
            if (isRecommendable(film) && !excludedFilmIds.has(film.id)) {
              similarFilmIds.add(film.id);
              if (!candidates.some((c) => c.id === film.id)) {
                candidates.push(film);
              }
            }
          } catch {
            // Skip upsert failures
          }
        }
      } catch {
        // Skip TMDb errors (rate limit, etc.)
      }
    }

    if (candidates.length === 0) {
      return { films: [] };
    }

    // Score each candidate by genre overlap; bonus for TMDb similar
    const scored = candidates.map((film) => {
      const filmGenres = parseGenres(film.genre);
      let score = 0;
      for (const g of filmGenres) {
        score += genreWeights[g] ?? 0;
      }
      if (similarFilmIds.has(film.id)) score += 10;
      return { film, score };
    });

    scored.sort((a, b) => b.score - a.score);

    // Diversity: cap per-genre so one genre doesn't flood the list
    const genreCount: Record<string, number> = {};
    const topFilms: Film[] = [];
    for (const { film } of scored) {
      if (topFilms.length >= limit) break;
      const filmGenres = parseGenres(film.genre);
      const overCap =
        filmGenres.length > 0 && filmGenres.every((g) => (genreCount[g] ?? 0) >= MAX_PER_GENRE);
      if (overCap) continue;
      topFilms.push(film);
      for (const g of filmGenres) {
        genreCount[g] = (genreCount[g] ?? 0) + 1;
      }
    }

    return { films: topFilms };
  }
}
