/**
 * Custom Hooks - Re-export all hooks for easy importing
 *
 * Usage:
 * import { useFilm, useFilmReviews } from '@/hooks';
 */

// Film hooks
export {
  useFilm,
  useFilmCredits,
  useFilmVideos,
  useSimilarFilms,
  useRegisterFilm,
  usePopularFilms,
  useTrendingFilms,
  useTopRatedFilms,
  useUpcomingFilms,
  useNowPlayingFilms,
  useSearchFilms,
  useFilmsByGenre,
} from './useFilms';

// Review hooks
export {
  useFilmReviews,
  useReview,
  useUserReviews,
  useCreateReview,
  useUpdateReview,
  useDeleteReview,
  useLikeReview,
  useReviewLikes,
  useReviewComments,
  useAddComment,
  useDeleteComment,
} from './useReviews';

// Type exports
export type {
  TMDbMovieDetails,
  TMDbCredits,
  TMDbVideo,
  TMDbSearchResponse,
  BackendFilm,
} from './useFilms';

export type {
  Review,
  CreateReviewInput,
  UpdateReviewInput,
  PaginatedResponse,
  ReviewComment,
  LikeResponse,
  CommentResponse,
  LikesResponse,
} from './useReviews';
