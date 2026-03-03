/**
 * TMDb API client port.
 * DTOs only; no domain entities or DB dependencies.
 */

export interface TmdbMovieListItem {
  id: number;
  title: string;
  release_date?: string;
  poster_path: string | null;
  overview?: string;
}

export interface TmdbDiscoverResult {
  page: number;
  results: TmdbMovieListItem[];
  total_pages: number;
  total_results: number;
}

export interface TmdbMovieDetails extends TmdbMovieListItem {
  runtime?: number | null;
  genres?: Array<{ id: number; name: string }>;
}

export interface ITmdbClient {
  discoverByYear(year: number, page: number): Promise<TmdbDiscoverResult>;
  getMovieById(tmdbId: number): Promise<TmdbMovieDetails | null>;
  nowPlaying(page: number): Promise<TmdbDiscoverResult>;
  upcoming(page: number): Promise<TmdbDiscoverResult>;
  popular(page: number): Promise<TmdbDiscoverResult>;
  /** Similar movies for a TMDb film (for recommendations) */
  getSimilar(tmdbId: number, page?: number): Promise<TmdbDiscoverResult>;
  /** TMDb recommendations for a film */
  getRecommendations(tmdbId: number, page?: number): Promise<TmdbDiscoverResult>;
}

export const ITmdbClient = Symbol.for('ITmdbClient');
