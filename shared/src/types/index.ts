/**
 * Shared type definitions for CinéConnect
 */

// ============================================
// User Types
// ============================================

export interface User {
  id: string;
  email: string;
  username: string;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPublic {
  id: string;
  username: string;
  avatarUrl?: string;
}

// ============================================
// Film Types
// ============================================

export interface Film {
  id: string;
  imdbId: string;
  title: string;
  year: string;
  poster: string;
  plot: string;
  director: string;
  actors: string;
  genre: string;
  runtime: string;
  imdbRating: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FilmCard {
  id: string;
  imdbId: string;
  title: string;
  year: string;
  poster: string;
  genre: string;
  imdbRating: string;
}

// ============================================
// Category Types
// ============================================

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export const FILM_CATEGORIES = [
  'action',
  'comedy',
  'drama',
  'horror',
  'sci-fi',
  'thriller',
  'romance',
  'animation',
  'documentary',
  'adventure',
] as const;

export type FilmCategory = (typeof FILM_CATEGORIES)[number];

// ============================================
// Review Types
// ============================================

export interface Review {
  id: string;
  userId: string;
  filmId: string;
  rating: number; // 1-5 stars
  comment?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReviewWithUser extends Review {
  user: UserPublic;
}

// ============================================
// Message Types (Chat)
// ============================================

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  read: boolean;
  createdAt: Date;
}

export interface MessageWithSender extends Message {
  sender: UserPublic;
}

// ============================================
// Friend Types
// ============================================

export interface FriendRequest {
  id: string;
  senderId: string;
  receiverId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

export interface Friend {
  id: string;
  user: UserPublic;
  since: Date;
}

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ============================================
// Auth Types
// ============================================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

// ============================================
// TMDb API Types (The Movie Database)
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
  genres: TMDbGenre[];
  production_companies: { id: number; name: string; logo_path: string | null }[];
  production_countries: { iso_3166_1: string; name: string }[];
  spoken_languages: { iso_639_1: string; name: string }[];
  imdb_id: string | null;
  homepage: string | null;
}

export interface TMDbGenre {
  id: number;
  name: string;
}

export interface TMDbSearchResponse {
  page: number;
  results: TMDbMovie[];
  total_pages: number;
  total_results: number;
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

// ============================================
// OMDb API Types (Legacy - for reference)
// ============================================

export interface OMDbSearchResult {
  Title: string;
  Year: string;
  imdbID: string;
  Type: string;
  Poster: string;
}

export interface OMDbSearchResponse {
  Search: OMDbSearchResult[];
  totalResults: string;
  Response: string;
  Error?: string;
}

export interface OMDbFilmDetails {
  Title: string;
  Year: string;
  Rated: string;
  Released: string;
  Runtime: string;
  Genre: string;
  Director: string;
  Writer: string;
  Actors: string;
  Plot: string;
  Language: string;
  Country: string;
  Awards: string;
  Poster: string;
  Ratings: { Source: string; Value: string }[];
  Metascore: string;
  imdbRating: string;
  imdbVotes: string;
  imdbID: string;
  Type: string;
  DVD: string;
  BoxOffice: string;
  Production: string;
  Website: string;
  Response: string;
}

// ============================================
// WebSocket Event Types
// ============================================

export interface WsMessageEvent {
  type: 'message';
  payload: Message;
}

export interface WsTypingEvent {
  type: 'typing';
  payload: {
    userId: string;
    isTyping: boolean;
  };
}

export interface WsOnlineEvent {
  type: 'online';
  payload: {
    userId: string;
    online: boolean;
  };
}

export type WsEvent = WsMessageEvent | WsTypingEvent | WsOnlineEvent;
