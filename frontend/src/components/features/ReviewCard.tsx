import { Link } from '@tanstack/react-router';
import { useState } from 'react';
import {
  Heart,
  MessageSquare,
  AlertTriangle,
  Calendar,
  MoreHorizontal,
  Send,
  Loader2,
  Trash2,
} from 'lucide-react';
import { getImageUrl, type TMDbMovie } from '@/lib/api/tmdb';
import { StarRatingDisplay } from '../ui/StarRating';
import { useReviewComments, useAddComment, useDeleteComment, type ReviewComment } from '@/hooks';

interface ReviewCardProps {
  /** Review ID for API calls */
  id?: string;
  /** The film being reviewed */
  film?: TMDbMovie;
  /** Reviewer info */
  user: {
    id: string;
    name: string;
    avatar?: string;
  };
  /** Rating (0-5) */
  rating?: number;
  /** Review text */
  content: string;
  /** Contains spoilers */
  hasSpoilers?: boolean;
  /** Watch date */
  watchedDate?: string;
  /** Review date */
  reviewDate: string;
  /** Like count */
  likes?: number;
  /** Comment count */
  comments?: number;
  /** Is liked by current user */
  isLiked?: boolean;
  /** Show film info (for review lists) */
  showFilm?: boolean;
  /** Compact mode */
  compact?: boolean;
  /** Callback when like button is clicked */
  onLike?: (reviewId: string) => void;
  /** Current user ID for comment ownership */
  currentUserId?: string;
}

/**
 * Review Card Component - Letterboxd style
 */
export function ReviewCard({
  id,
  film,
  user,
  rating,
  content,
  hasSpoilers = false,
  watchedDate,
  reviewDate,
  likes = 0,
  comments = 0,
  isLiked = false,
  showFilm = true,
  compact = false,
  onLike,
  currentUserId,
}: ReviewCardProps) {
  const [spoilerRevealed, setSpoilerRevealed] = useState(false);
  const [liked, setLiked] = useState(isLiked);
  const [likeCount, setLikeCount] = useState(likes);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');

  // Comments hooks - only fetch when comments section is open
  const { data: reviewComments, isLoading: commentsLoading } = useReviewComments(
    showComments ? id : undefined
  );
  const addCommentMutation = useAddComment(id);
  const deleteCommentMutation = useDeleteComment(id);

  const handleLike = () => {
    // Optimistic update
    setLiked(!liked);
    setLikeCount((prev) => (liked ? prev - 1 : prev + 1));

    // Call API if callback provided
    if (onLike && id) {
      onLike(id);
    }
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !id) return;

    addCommentMutation.mutate(newComment.trim(), {
      onSuccess: () => setNewComment(''),
    });
  };

  const handleDeleteComment = (commentId: string) => {
    if (!id) return;
    deleteCommentMutation.mutate(commentId);
  };

  const shouldHideContent = hasSpoilers && !spoilerRevealed;

  if (compact) {
    return (
      <div className="border-border flex gap-3 border-b py-3 last:border-0">
        {/* User avatar */}
        <div className="shrink-0">
          <div className="bg-bg-tertiary flex h-8 w-8 items-center justify-center overflow-hidden rounded-full">
            {user.avatar ? (
              <img src={user.avatar} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-text-secondary text-sm font-medium">{user.name[0]}</span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-text-primary font-medium">{user.name}</span>
            {rating && <StarRatingDisplay rating={rating} size="sm" />}
          </div>
          <p
            className={`mt-1 line-clamp-2 text-sm ${shouldHideContent ? 'select-none blur-sm' : 'text-text-secondary'}`}
          >
            {content}
          </p>
          {shouldHideContent && (
            <button
              onClick={() => setSpoilerRevealed(true)}
              className="text-letterboxd-orange mt-1 text-xs"
            >
              Show spoilers
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      {/* Header */}
      <div className="mb-4 flex items-start gap-3">
        {/* Film poster (if showing film) */}
        {showFilm && film && (
          <Link
            to="/film/$id"
            params={{ id: String(film.id) }}
            className="hidden shrink-0 sm:block"
          >
            <div className="poster-card aspect-poster bg-bg-secondary w-16">
              <img
                src={getImageUrl(film.poster_path, 'poster', 'small')}
                alt={film.title}
                className="h-full w-full object-cover"
              />
            </div>
          </Link>
        )}

        {/* User and film info */}
        <div className="min-w-0 flex-1">
          {/* User */}
          <div className="flex items-center gap-2">
            <div className="bg-bg-tertiary flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full">
              {user.avatar ? (
                <img src={user.avatar} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="text-text-secondary text-sm font-medium">{user.name[0]}</span>
              )}
            </div>
            <span className="text-text-primary font-medium">{user.name}</span>
          </div>

          {/* Film title (if showing) */}
          {showFilm && film && (
            <Link to="/film/$id" params={{ id: String(film.id) }} className="group mt-2 block">
              <h3 className="font-display text-text-primary group-hover:text-letterboxd-green font-semibold transition-colors">
                {film.title}
                {film.release_date && (
                  <span className="text-text-tertiary ml-2 font-normal">
                    {new Date(film.release_date).getFullYear()}
                  </span>
                )}
              </h3>
            </Link>
          )}

          {/* Rating and watch date */}
          <div className="mt-2 flex flex-wrap items-center gap-3">
            {rating && <StarRatingDisplay rating={rating} size="md" />}
            {watchedDate && (
              <span className="text-text-tertiary flex items-center gap-1 text-xs">
                <Calendar className="h-3 w-3" />
                Watched {watchedDate}
              </span>
            )}
          </div>
        </div>

        {/* Actions menu */}
        <button className="btn-ghost shrink-0 rounded-full p-1.5">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>

      {/* Review content */}
      <div className="relative">
        {hasSpoilers && !spoilerRevealed && (
          <div className="bg-bg-secondary/80 absolute inset-0 z-10 flex flex-col items-center justify-center rounded backdrop-blur-sm">
            <AlertTriangle className="text-letterboxd-orange mb-2 h-6 w-6" />
            <p className="text-text-secondary mb-2 text-sm">This review contains spoilers</p>
            <button onClick={() => setSpoilerRevealed(true)} className="btn-secondary text-sm">
              Reveal Spoilers
            </button>
          </div>
        )}
        <p
          className={`text-text-secondary leading-relaxed ${shouldHideContent ? 'min-h-[60px] select-none blur-md' : ''}`}
        >
          {content}
        </p>
      </div>

      {/* Footer */}
      <div className="border-border mt-4 flex items-center justify-between border-t pt-4">
        {/* Actions */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleLike}
            className={`flex items-center gap-1.5 text-sm transition-colors ${
              liked ? 'text-letterboxd-orange' : 'text-text-tertiary hover:text-text-secondary'
            }`}
          >
            <Heart className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} />
            {likeCount > 0 && <span>{likeCount}</span>}
          </button>
          <button
            onClick={() => setShowComments(!showComments)}
            className={`flex items-center gap-1.5 text-sm transition-colors ${
              showComments
                ? 'text-letterboxd-green'
                : 'text-text-tertiary hover:text-text-secondary'
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            {(reviewComments?.items?.length ?? comments) > 0 && (
              <span>{reviewComments?.items?.length ?? comments}</span>
            )}
          </button>
        </div>

        {/* Review date */}
        <span className="text-text-tertiary text-xs">{reviewDate}</span>
      </div>

      {/* Comments Section */}
      {showComments && id && (
        <div className="border-border mt-4 border-t pt-4">
          {/* Comment Input */}
          <form onSubmit={handleAddComment} className="mb-4 flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="input flex-1 text-sm"
              disabled={addCommentMutation.isPending}
            />
            <button
              type="submit"
              disabled={!newComment.trim() || addCommentMutation.isPending}
              className="btn-primary px-3"
            >
              {addCommentMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </form>

          {/* Comments List */}
          {commentsLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="text-text-tertiary h-5 w-5 animate-spin" />
            </div>
          ) : reviewComments?.items && reviewComments.items.length > 0 ? (
            <div className="space-y-3">
              {reviewComments.items.map((comment: ReviewComment) => (
                <div key={comment.id} className="bg-bg-tertiary rounded-lg p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="bg-bg-secondary flex h-6 w-6 items-center justify-center rounded-full">
                        <span className="text-text-secondary text-xs font-medium">
                          {comment.user?.username?.[0]?.toUpperCase() ?? '?'}
                        </span>
                      </div>
                      <span className="text-text-primary text-sm font-medium">
                        {comment.user?.username ?? 'Unknown'}
                      </span>
                      <span className="text-text-tertiary text-xs">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {currentUserId === comment.userId && (
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        disabled={deleteCommentMutation.isPending}
                        className="text-text-tertiary p-1 transition-colors hover:text-red-500"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                  <p className="text-text-secondary mt-2 text-sm">{comment.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-text-tertiary py-2 text-center text-sm">No comments yet</p>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Review list with film grouping
 */
export function ReviewList({ reviews }: { reviews: ReviewCardProps[] }) {
  return (
    <div className="space-y-4">
      {reviews.map((review, index) => (
        <ReviewCard key={index} {...review} />
      ))}
    </div>
  );
}
