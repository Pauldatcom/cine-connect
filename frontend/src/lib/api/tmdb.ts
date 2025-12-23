/**
 * TMDb (The Movie Database) API Client
 *
 * Get your free API key at: https://www.themoviedb.org/settings/api
 * TMDb is what Letterboxd uses for their film data.
 */

const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY || '';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

// Image size helpers
export const IMAGE_SIZES = {
  poster: {
    small: 'w185',
    medium: 'w342',
    large: 'w500',
    original: 'original',
  },
  backdrop: {
    small: 'w300',
    medium: 'w780',
    large: 'w1280',
    original: 'original',
  },
  profile: {
    small: 'w45',
    medium: 'w185',
    large: 'h632',
    original: 'original',
  },
} as const;

/**
 * Get full image URL from TMDb path
 */
export function getImageUrl(
  path: string | null,
  type: 'poster' | 'backdrop' | 'profile' = 'poster',
  size: 'small' | 'medium' | 'large' | 'original' = 'medium'
): string {
  if (!path) return '/placeholder-poster.jpg';
  return `${TMDB_IMAGE_BASE}/${IMAGE_SIZES[type][size]}${path}`;
}

// ============================================
// Types
// ============================================

export interface TMDbMovie {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  genre_ids: number[];
  adult: boolean;
  original_language: string;
}

export interface TMDbMovieDetails extends TMDbMovie {
  runtime: number;
  budget: number;
  revenue: number;
  status: string;
  tagline: string;
  genres: { id: number; name: string }[];
  production_companies: { id: number; name: string; logo_path: string | null }[];
  production_countries: { iso_3166_1: string; name: string }[];
  spoken_languages: { iso_639_1: string; name: string }[];
  imdb_id: string | null;
  homepage: string | null;
}

export interface TMDbCredits {
  id: number;
  cast: TMDbCastMember[];
  crew: TMDbCrewMember[];
}

export interface TMDbCastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
}

export interface TMDbCrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_path: string | null;
}

export interface TMDbVideo {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
  official: boolean;
}

export interface TMDbSearchResponse {
  page: number;
  results: TMDbMovie[];
  total_pages: number;
  total_results: number;
}

export interface TMDbGenre {
  id: number;
  name: string;
}

// ============================================
// API Functions
// ============================================

async function fetchTMDb<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
  url.searchParams.set('api_key', TMDB_API_KEY);

  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(`TMDb API error: ${response.status}`);
  }

  return response.json();
}

/**
 * Search movies by query
 */
export async function searchMovies(query: string, page = 1): Promise<TMDbSearchResponse> {
  return fetchTMDb('/search/movie', {
    query,
    page: String(page),
    include_adult: 'false',
  });
}

/**
 * Get trending movies (day or week)
 */
export async function getTrending(
  timeWindow: 'day' | 'week' = 'week'
): Promise<TMDbSearchResponse> {
  return fetchTMDb(`/trending/movie/${timeWindow}`);
}

/**
 * Get popular movies
 */
export async function getPopular(page = 1): Promise<TMDbSearchResponse> {
  return fetchTMDb('/movie/popular', { page: String(page) });
}

/**
 * Get top rated movies
 */
export async function getTopRated(page = 1): Promise<TMDbSearchResponse> {
  return fetchTMDb('/movie/top_rated', { page: String(page) });
}

/**
 * Get upcoming movies
 */
export async function getUpcoming(page = 1): Promise<TMDbSearchResponse> {
  return fetchTMDb('/movie/upcoming', { page: String(page) });
}

/**
 * Get now playing movies
 */
export async function getNowPlaying(page = 1): Promise<TMDbSearchResponse> {
  return fetchTMDb('/movie/now_playing', { page: String(page) });
}

/**
 * Get movies by genre
 */
export async function getMoviesByGenre(genreId: number, page = 1): Promise<TMDbSearchResponse> {
  return fetchTMDb('/discover/movie', {
    with_genres: String(genreId),
    page: String(page),
    sort_by: 'popularity.desc',
  });
}

/**
 * Get movie details by ID
 */
export async function getMovieDetails(movieId: number | string): Promise<TMDbMovieDetails> {
  return fetchTMDb(`/movie/${movieId}`);
}

/**
 * Get movie credits (cast & crew)
 */
export async function getMovieCredits(movieId: number | string): Promise<TMDbCredits> {
  return fetchTMDb(`/movie/${movieId}/credits`);
}

/**
 * Get movie videos (trailers, teasers, etc.)
 */
export async function getMovieVideos(movieId: number | string): Promise<{ results: TMDbVideo[] }> {
  return fetchTMDb(`/movie/${movieId}/videos`);
}

/**
 * Get similar movies
 */
export async function getSimilarMovies(movieId: number | string): Promise<TMDbSearchResponse> {
  return fetchTMDb(`/movie/${movieId}/similar`);
}

/**
 * Get movie recommendations
 */
export async function getRecommendations(movieId: number | string): Promise<TMDbSearchResponse> {
  return fetchTMDb(`/movie/${movieId}/recommendations`);
}

/**
 * Get all genres
 */
export async function getGenres(): Promise<{ genres: TMDbGenre[] }> {
  return fetchTMDb('/genre/movie/list');
}

// ============================================
// Genre mapping (for URL-friendly slugs)
// ============================================

export const GENRE_MAP: Record<string, number> = {
  action: 28,
  adventure: 12,
  animation: 16,
  comedy: 35,
  crime: 80,
  documentary: 99,
  drama: 18,
  family: 10751,
  fantasy: 14,
  history: 36,
  horror: 27,
  music: 10402,
  mystery: 9648,
  romance: 10749,
  'sci-fi': 878,
  'science-fiction': 878,
  thriller: 53,
  war: 10752,
  western: 37,
};

export const GENRE_ID_TO_SLUG: Record<number, string> = Object.fromEntries(
  Object.entries(GENRE_MAP).map(([slug, id]) => [id, slug])
);
