import { Link } from '@tanstack/react-router';
import { useState } from 'react';
import { Heart, MessageSquare, AlertTriangle, Calendar, MoreHorizontal } from 'lucide-react';
import { getImageUrl, type TMDbMovie } from '@/lib/api/tmdb';
import { StarRatingDisplay } from '../ui/StarRating';

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
}: ReviewCardProps) {
  const [spoilerRevealed, setSpoilerRevealed] = useState(false);
  const [liked, setLiked] = useState(isLiked);
  const [likeCount, setLikeCount] = useState(likes);

  const handleLike = () => {
    // Optimistic update
    setLiked(!liked);
    setLikeCount((prev) => (liked ? prev - 1 : prev + 1));

    // Call API if callback provided
    if (onLike && id) {
      onLike(id);
    }
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
          <button className="text-text-tertiary hover:text-text-secondary flex items-center gap-1.5 text-sm transition-colors">
            <MessageSquare className="h-4 w-4" />
            {comments > 0 && <span>{comments}</span>}
          </button>
        </div>

        {/* Review date */}
        <span className="text-text-tertiary text-xs">{reviewDate}</span>
      </div>
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
