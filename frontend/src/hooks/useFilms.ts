/**
 * useFilms - Custom hooks for film-related queries
 *
 * Encapsulates all TanStack Query logic for films from both
 * TMDb API and our backend.
 */

import { registerFilm, type BackendFilm } from '@/lib/api/films';
import {
  getMovieCredits,
  getMovieDetails,
  getMoviesByGenre,
  getMovieVideos,
  getNowPlaying,
  getPopular,
  getSimilarMovies,
  getTopRated,
  getTrending,
  getUpcoming,
  searchMovies,
  type TMDbCredits,
  type TMDbMovie,
  type TMDbMovieDetails,
  type TMDbSearchResponse,
  type TMDbVideo,
} from '@/lib/api/tmdb';
import { useQuery } from '@tanstack/react-query';

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
 * Film type accepted by useRegisterFilm (list item or full details).
 * Accepts TMDbMovie (e.g. from trending) or TMDbMovieDetails (from film detail).
 */
export type TMDbFilmForRegister = TMDbMovie | TMDbMovieDetails;

/**
 * Register a film in our backend (get or create)
 * Returns the internal UUID for use with reviews
 */
export function useRegisterFilm(film: TMDbFilmForRegister | undefined, enabled = true) {
  return useQuery({
    queryKey: ['backend-film', film?.id],
    queryFn: () => {
      if (!film) throw new Error('Film is required');
      const details = film as TMDbMovieDetails;
      return registerFilm({
        tmdbId: film.id,
        title: film.title,
        year: film.release_date?.split('-')[0] ?? null,
        poster: film.poster_path ?? null,
        plot: film.overview ?? null,
        genre:
          'genres' in details && details.genres
            ? details.genres.map((g) => g.name).join(', ')
            : null,
        runtime: 'runtime' in details && details.runtime ? `${details.runtime} min` : null,
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
export type { BackendFilm, TMDbCredits, TMDbMovieDetails, TMDbSearchResponse, TMDbVideo };
