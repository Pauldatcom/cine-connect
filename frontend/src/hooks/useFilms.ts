/**
 * useFilms - Custom hooks for film-related queries
 *
 * Encapsulates all TanStack Query logic for films from both
 * TMDb API and our backend.
 */

import { useQuery } from '@tanstack/react-query';
import {
  getMovieDetails,
  getMovieCredits,
  getMovieVideos,
  getSimilarMovies,
  getPopular,
  searchMovies,
  getTrending,
  getTopRated,
  getUpcoming,
  getNowPlaying,
  getMoviesByGenre,
  type TMDbMovieDetails,
  type TMDbCredits,
  type TMDbVideo,
  type TMDbSearchResponse,
} from '@/lib/api/tmdb';
import { registerFilm, type BackendFilm } from '@/lib/api/films';

/**
 * Fetch film details from TMDb
 */
export function useFilm(tmdbId: string | number) {
  return useQuery({
    queryKey: ['movie', String(tmdbId)],
    queryFn: () => getMovieDetails(tmdbId),
    enabled: !!tmdbId,
  });
}

/**
 * Fetch film credits (cast & crew) from TMDb
 */
export function useFilmCredits(tmdbId: string | number, enabled = true) {
  return useQuery({
    queryKey: ['movie', String(tmdbId), 'credits'],
    queryFn: () => getMovieCredits(tmdbId),
    enabled: enabled && !!tmdbId,
  });
}

/**
 * Fetch film videos (trailers, etc.) from TMDb
 */
export function useFilmVideos(tmdbId: string | number, enabled = true) {
  return useQuery({
    queryKey: ['movie', String(tmdbId), 'videos'],
    queryFn: () => getMovieVideos(tmdbId),
    enabled: enabled && !!tmdbId,
  });
}

/**
 * Fetch similar films from TMDb
 */
export function useSimilarFilms(tmdbId: string | number, enabled = true) {
  return useQuery({
    queryKey: ['movie', String(tmdbId), 'similar'],
    queryFn: () => getSimilarMovies(tmdbId),
    enabled: enabled && !!tmdbId,
  });
}

/**
 * Register a film in our backend (get or create)
 * Returns the internal UUID for use with reviews
 */
export function useRegisterFilm(film: TMDbMovieDetails | undefined, enabled = true) {
  return useQuery({
    queryKey: ['backend-film', film?.id],
    queryFn: () => {
      if (!film) throw new Error('Film is required');
      return registerFilm({
        tmdbId: film.id,
        title: film.title,
        year: film.release_date?.split('-')[0] ?? null,
        poster: film.poster_path ?? null,
        plot: film.overview ?? null,
        genre: film.genres?.map((g) => g.name).join(', ') ?? null,
        runtime: film.runtime ? `${film.runtime} min` : null,
      });
    },
    enabled: enabled && !!film,
    staleTime: Infinity, // Film data doesn't change
    retry: 1,
  });
}

/**
 * Fetch popular films from TMDb
 */
export function usePopularFilms(page = 1) {
  return useQuery({
    queryKey: ['movies', 'popular', page],
    queryFn: () => getPopular(page),
  });
}

/**
 * Fetch trending films from TMDb
 */
export function useTrendingFilms(timeWindow: 'day' | 'week' = 'week') {
  return useQuery({
    queryKey: ['movies', 'trending', timeWindow],
    queryFn: () => getTrending(timeWindow),
  });
}

/**
 * Fetch top rated films from TMDb
 */
export function useTopRatedFilms(page = 1) {
  return useQuery({
    queryKey: ['movies', 'top-rated', page],
    queryFn: () => getTopRated(page),
  });
}

/**
 * Fetch upcoming films from TMDb
 */
export function useUpcomingFilms(page = 1) {
  return useQuery({
    queryKey: ['movies', 'upcoming', page],
    queryFn: () => getUpcoming(page),
  });
}

/**
 * Fetch now playing films from TMDb
 */
export function useNowPlayingFilms(page = 1) {
  return useQuery({
    queryKey: ['movies', 'now-playing', page],
    queryFn: () => getNowPlaying(page),
  });
}

/**
 * Search films from TMDb
 */
export function useSearchFilms(query: string, page = 1) {
  return useQuery({
    queryKey: ['movies', 'search', query, page],
    queryFn: () => searchMovies(query, page),
    enabled: query.length > 0,
  });
}

/**
 * Fetch films by genre from TMDb
 */
export function useFilmsByGenre(genreId: number, page = 1) {
  return useQuery({
    queryKey: ['movies', 'genre', genreId, page],
    queryFn: () => getMoviesByGenre(genreId, page),
    enabled: genreId > 0,
  });
}

// Type exports for convenience
export type { TMDbMovieDetails, TMDbCredits, TMDbVideo, TMDbSearchResponse, BackendFilm };
