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
  useFilmsByGenre,
  useFilmVideos,
  useNowPlayingFilms,
  usePopularFilms,
  useRegisterFilm,
  useSearchFilms,
  useSimilarFilms,
  useTopRatedFilms,
  useTrendingFilms,
  useUpcomingFilms,
} from './useFilms';

// Review hooks
export {
  useAddComment,
  useCreateReview,
  useDeleteComment,
  useDeleteReview,
  useFilmReviews,
  useLikeReview,
  useReview,
  useReviewComments,
  useReviewLikes,
  useUpdateReview,
  useUserReviews,
} from './useReviews';

// Type exports
export type {
  BackendFilm,
  TMDbCredits,
  TMDbMovieDetails,
  TMDbSearchResponse,
  TMDbVideo,
} from './useFilms';

export type {
  CommentResponse,
  CreateReviewInput,
  LikeResponse,
  LikesResponse,
  PaginatedResponse,
  Review,
  ReviewComment,
  UpdateReviewInput,
} from './useReviews';

// Socket/Chat hooks
export {
  useIsUserOnline,
  useOnlineUsers,
  useSocket,
  useSocketConnected,
  useTypingIndicator,
  useTypingUsers,
} from './useSocket';

export {
  useConversations,
  useMarkMessagesRead,
  useMessages,
  useSendMessage,
} from './useConversations';

// Socket/Chat type exports
export type { SocketContextValue } from './useSocket';
export type { ChatMessage, Conversation, SendMessageInput } from './useConversations';
