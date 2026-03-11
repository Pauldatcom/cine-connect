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

/**
 * Fetch independent/arthouse films
 * Filter: Recent releases with lower vote counts (excludes blockbusters)
 */
export async function getIndependentFilms(page = 1): Promise<TMDbSearchResponse> {
  const today = new Date().toISOString().split('T')[0];
  const twoMonthsAgo = new Date();
  twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
  const formattedDate = twoMonthsAgo.toISOString().split('T')[0];

  const response = await fetch(
    `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&language=en-US&sort_by=release_date.desc&include_adult=false&include_video=false&page=${page}&release_date.gte=${formattedDate}&release_date.lte=${today}&vote_count.lte=100`
  );

  if (!response.ok) {
    throw new Error('Failed to fetch independent films');
  }

  return response.json();
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

// --- Add these types at the top of the file ---

export interface TMDbWatchProvider {
  logo_path: string;
  provider_id: number;
  provider_name: string;
  display_priority: number;
}

export interface TMDbWatchProvidersResult {
  link: string;
  flatrate?: TMDbWatchProvider[]; // Streaming (Netflix, Disney+, etc.)
  rent?: TMDbWatchProvider[]; // Location (Apple TV, Google Play)
  buy?: TMDbWatchProvider[]; // Achat
  free?: TMDbWatchProvider[]; // Gratuit
  ads?: TMDbWatchProvider[]; // Avec pubs
}

export interface TMDbWatchProvidersResponse {
  id: number;
  results: Record<string, TMDbWatchProvidersResult>; // Key = country code (FR, US, etc.)
}

/** Resolved watch data for UI: chosen region, optional JustWatch link from TMDb, TMDb watch page. */
export interface WatchProvidersPick {
  /** Provider rows for `region` (may exist with only `link` and no lists) */
  result: TMDbWatchProvidersResult | null;
  /** ISO region used (e.g. FR, US) or null if TMDb returned no rows */
  region: string | null;
  /** True when `region` is not the preferred country (e.g. used US after empty FR) */
  isFallback: boolean;
  /** TMDb “where to watch” page — always safe to show */
  tmdbWatchPageUrl: string;
  /** True when flatrate/rent/buy/free/ads has at least one provider */
  hasLists: boolean;
}

function getWatchResultForRegion(
  results: Record<string, TMDbWatchProvidersResult>,
  code: string
): TMDbWatchProvidersResult | undefined {
  const upper = code.toUpperCase();
  if (results[upper]) return results[upper];
  const key = Object.keys(results).find((k) => k.toUpperCase() === upper);
  return key !== undefined ? results[key] : undefined;
}

/** True if TMDb returned at least one provider in any category */
export function hasAnyWatchProviderLists(r: TMDbWatchProvidersResult | null | undefined): boolean {
  if (!r) return false;
  return (
    (r.flatrate?.length ?? 0) > 0 ||
    (r.rent?.length ?? 0) > 0 ||
    (r.buy?.length ?? 0) > 0 ||
    (r.free?.length ?? 0) > 0 ||
    (r.ads?.length ?? 0) > 0
  );
}

/**
 * Prefer `preferred` (e.g. FR), then US, then any region with provider lists.
 * Falls back to a result that only has `link` (JustWatch) if no lists anywhere.
 */
export function pickWatchProvidersForRegion(
  data: TMDbWatchProvidersResponse,
  preferred: string
): Omit<WatchProvidersPick, 'tmdbWatchPageUrl' | 'hasLists'> {
  const preferredUpper = preferred.toUpperCase();

  const tryPick = (code: string): { result: TMDbWatchProvidersResult; region: string } | null => {
    const r = getWatchResultForRegion(data.results, code);
    if (r && hasAnyWatchProviderLists(r)) {
      return { result: r, region: code.toUpperCase() };
    }
    return null;
  };

  let picked = tryPick(preferredUpper);
  if (!picked && preferredUpper !== 'US') {
    picked = tryPick('US');
  }
  if (!picked) {
    for (const code of Object.keys(data.results)) {
      const r = data.results[code];
      if (r && hasAnyWatchProviderLists(r)) {
        picked = { result: r, region: code.toUpperCase() };
        break;
      }
    }
  }

  if (picked) {
    return {
      result: picked.result,
      region: picked.region,
      isFallback: picked.region !== preferredUpper,
    };
  }

  // No provider lists: still expose JustWatch/TMDb link if present for preferred → US → any
  const linkPick = (code: string): TMDbWatchProvidersResult | undefined =>
    getWatchResultForRegion(data.results, code);

  let r = linkPick(preferredUpper);
  let region: string | null = r?.link ? preferredUpper : null;
  if (!r?.link && preferredUpper !== 'US') {
    r = linkPick('US');
    region = r?.link ? 'US' : null;
  }
  if (!r?.link) {
    for (const code of Object.keys(data.results)) {
      const row = data.results[code];
      if (row?.link) {
        r = row;
        region = code.toUpperCase();
        break;
      }
    }
  }

  if (r?.link) {
    return {
      result: r,
      region,
      isFallback: region !== null && region !== preferredUpper,
    };
  }

  return { result: null, region: null, isFallback: false };
}

/**
 * Fetch watch providers (streaming, rent, buy) for a movie
 */
export async function getMovieWatchProviders(
  tmdbId: string | number
): Promise<TMDbWatchProvidersResponse> {
  const response = await fetch(
    `${TMDB_BASE_URL}/movie/${tmdbId}/watch/providers?api_key=${TMDB_API_KEY}`
  );

  if (!response.ok) {
    throw new Error('Failed to fetch watch providers');
  }

  return response.json();
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

export interface TMDbPerson {
  id: number;
  name: string;
  biography: string;
  birthday: string | null;
  deathday: string | null;
  place_of_birth: string | null;
  profile_path: string | null;
  known_for_department: string;
  also_known_as: string[];
}

export interface TMDbPersonMovieCredits {
  id: number;
  cast: (TMDbMovie & { character: string; credit_id: string })[];
  crew: (TMDbMovie & { job: string; department: string; credit_id: string })[];
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
 * Get trending movies (day or week) with optional page
 */
export async function getTrending(
  timeWindow: 'day' | 'week' = 'week',
  page = 1
): Promise<TMDbSearchResponse> {
  return fetchTMDb(`/trending/movie/${timeWindow}`, { page: String(page) });
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
// À la fin de src/lib/api/tmdb.ts ou dans les exports nommés

/**
 * Get person details by ID
 */
export async function getPersonDetails(personId: number | string): Promise<TMDbPerson> {
  return fetchTMDb(`/person/${personId}`);
}

/**
 * Get person movie credits (filmography)
 */
export async function getPersonMovieCredits(
  personId: number | string
): Promise<TMDbPersonMovieCredits> {
  return fetchTMDb(`/person/${personId}/movie_credits`);
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
