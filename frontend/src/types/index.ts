/**
 * Frontend Type Definitions
 *
 * This file centralizes all frontend-specific types and re-exports
 * shared types from @cine-connect/shared for convenience.
 */

// Re-export shared types (when needed)
// export type { User, Film, Review } from '@cine-connect/shared';

// TMDb API types - re-exported from api module
export type {
  TMDbCastMember,
  TMDbCredits,
  TMDbCrewMember,
  TMDbGenre,
  TMDbMovie,
  TMDbMovieDetails,
  TMDbSearchResponse,
  TMDbVideo,
} from '@/lib/api/tmdb';

// Backend Film types
export type { BackendFilm, RegisterFilmInput, RegisterFilmResponse } from '@/lib/api/films';

// Review types
export type {
  CommentResponse,
  CreateReviewInput,
  LikeResponse,
  LikesResponse,
  PaginatedResponse,
  Review,
  ReviewComment,
  ReviewFilm,
  ReviewUser,
  UpdateReviewInput,
} from '@/lib/api/reviews';

// Auth types
export type { AuthResponse, LoginCredentials, RegisterCredentials, User } from '@/lib/api/auth';

// Chat/Conversation types
export interface Conversation {
  userId: string;
  username: string;
  avatarUrl: string | null;
  lastMessage: ChatMessage | null;
  unreadCount: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  read: boolean;
  createdAt: string;
}

// Film with credits (frontend composition)
export interface FilmWithCredits {
  film: import('@/lib/api/tmdb').TMDbMovieDetails;
  credits: import('@/lib/api/tmdb').TMDbCredits;
  videos: { results: import('@/lib/api/tmdb').TMDbVideo[] };
}

// Review with expanded user info
export interface ReviewWithUser {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    username: string;
    avatarUrl: string | null;
  };
  likesCount: number;
  commentsCount: number;
  isLikedByCurrentUser: boolean;
}

// Filter state type
export interface FilmFilters {
  sortBy: 'popular' | 'rating' | 'recent' | 'title';
  genre: string | null;
  year: number | null;
  minRating: number;
}

// Pagination params
export interface PaginationParams {
  page: number;
  pageSize: number;
}

// API response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
