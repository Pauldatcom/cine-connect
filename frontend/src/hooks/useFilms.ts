/**
 * useFilms - Custom hooks for film-related queries
 *
 * Encapsulates all TanStack Query logic for films from both
 * TMDb API and our backend.
 */
// src/hooks/useFilms.ts

// src/hooks/useFilms.ts
import { useQuery } from '@tanstack/react-query';
import { getRecommendations, registerFilm, type BackendFilm } from '@/lib/api/films';
import {
  getMovieCredits,
  getMovieDetails,
  getMoviesByGenre,
  getMovieVideos,
  getNowPlaying,
  getPersonDetails,
  getPersonMovieCredits,
  getPopular,
  getSimilarMovies,
  getTopRated,
  getTrending,
  getUpcoming,
  searchMovies,
  getMovieWatchProviders,
  type TMDbMovie,
  type TMDbMovieDetails,
  type TMDbPerson,
  type TMDbPersonMovieCredits,
  type TMDbSearchResponse,
  type TMDbVideo,
  type TMDbCredits,
} from '@/lib/api/tmdb';

/**
 * Fetch film details from TMDb
 */
export function useFilm(tmdbId: string | number) {
  return useQuery<TMDbMovieDetails>({
    queryKey: ['movie', String(tmdbId)],
    queryFn: () => getMovieDetails(tmdbId),
    enabled: !!tmdbId,
  });
}

/**
 * Fetch film credits (cast & crew) from TMDb
 */
export function useFilmCredits(tmdbId: string | number, enabled = true) {
  return useQuery<TMDbCredits>({
    queryKey: ['movie', String(tmdbId), 'credits'],
    queryFn: () => getMovieCredits(tmdbId),
    enabled: enabled && !!tmdbId,
  });
}

/**
 * Fetch film videos (trailers, etc.) from TMDb
 */
export function useFilmVideos(tmdbId: string | number, enabled = true) {
  return useQuery<{ results: TMDbVideo[] }>({
    queryKey: ['movie', String(tmdbId), 'videos'],
    queryFn: () => getMovieVideos(tmdbId),
    enabled: enabled && !!tmdbId,
  });
}

/**
 * Fetch similar films from TMDb
 */
export function useSimilarFilms(tmdbId: string | number, enabled = true) {
  return useQuery<TMDbSearchResponse>({
    queryKey: ['movie', String(tmdbId), 'similar'],
    queryFn: () => getSimilarMovies(tmdbId),
    enabled: enabled && !!tmdbId,
  });
}

/**
 * Personalized film recommendations from backend
 */
export function useRecommendations(enabled = true) {
  return useQuery<BackendFilm[]>({
    queryKey: ['recommendations'],
    queryFn: () => getRecommendations(20),
    enabled,
  });
}

/**
 * Type accepté par useRegisterFilm
 */
export type TMDbFilmForRegister = TMDbMovie | TMDbMovieDetails;

/**
 * Register a film in backend (get or create)
 */
export function useRegisterFilm(film: TMDbFilmForRegister | undefined, enabled = true) {
  return useQuery<BackendFilm>({
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
    staleTime: Infinity,
    retry: 1,
  });
}

/**
 * Hooks TMDb généraux
 */
export function usePopularFilms(page = 1) {
  return useQuery<TMDbSearchResponse>({
    queryKey: ['movies', 'popular', page],
    queryFn: () => getPopular(page),
  });
}

export function useTrendingFilms(timeWindow: 'day' | 'week' = 'week') {
  return useQuery<TMDbSearchResponse>({
    queryKey: ['movies', 'trending', timeWindow],
    queryFn: () => getTrending(timeWindow),
  });
}

export function useTopRatedFilms(page = 1) {
  return useQuery<TMDbSearchResponse>({
    queryKey: ['movies', 'top-rated', page],
    queryFn: () => getTopRated(page),
  });
}

export function useUpcomingFilms(page = 1) {
  return useQuery<TMDbSearchResponse>({
    queryKey: ['movies', 'upcoming', page],
    queryFn: () => getUpcoming(page),
  });
}

export function useNowPlayingFilms(page = 1) {
  return useQuery<TMDbSearchResponse>({
    queryKey: ['movies', 'now-playing', page],
    queryFn: () => getNowPlaying(page),
  });
}

export function useSearchFilms(query: string, page = 1) {
  return useQuery<TMDbSearchResponse>({
    queryKey: ['movies', 'search', query, page],
    queryFn: () => searchMovies(query, page),
    enabled: query.length > 0,
  });
}

export function useFilmsByGenre(genreId: number, page = 1) {
  return useQuery<TMDbSearchResponse>({
    queryKey: ['movies', 'genre', genreId, page],
    queryFn: () => getMoviesByGenre(genreId, page),
    enabled: genreId > 0,
  });
}

/**
 * Nouveau hook : watch providers
 */
export function useWatchProviders(tmdbId: string | number, countryCode: string = 'FR') {
  return useQuery({
    queryKey: ['movie', String(tmdbId), 'watch-providers', countryCode],
    queryFn: async () => {
      const data = await getMovieWatchProviders(tmdbId);
      return data.results[countryCode] || null;
    },
    enabled: !!tmdbId,
    staleTime: 1000 * 60 * 60,
  });
}

/**
 * Nouveau hook : person
 */
export function usePerson(personId: string | number) {
  return useQuery<TMDbPerson>({
    queryKey: ['person', String(personId)],
    queryFn: () => getPersonDetails(personId),
    enabled: !!personId,
  });
}

export function usePersonMovieCredits(personId: string | number, enabled = true) {
  return useQuery<TMDbPersonMovieCredits>({
    queryKey: ['person', String(personId), 'credits'],
    queryFn: () => getPersonMovieCredits(personId),
    enabled: enabled && !!personId,
  });
}

// --- Export des types pour TS ---
export type {
  BackendFilm,
  TMDbCredits,
  TMDbMovieDetails,
  TMDbPerson,
  TMDbPersonMovieCredits,
  TMDbSearchResponse,
  TMDbVideo,
};
