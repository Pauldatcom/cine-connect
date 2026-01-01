import { Link } from '@tanstack/react-router';
import { Eye, Heart, MessageSquare, Calendar, Clock } from 'lucide-react';
import { getImageUrl, type TMDbMovie } from '@/lib/api/tmdb';
import { StarRatingDisplay } from '../ui/StarRating';

interface FilmActivityCardProps {
  film: TMDbMovie;
  /** Activity type */
  activity: 'watched' | 'liked' | 'reviewed' | 'logged';
  /** User who performed the action */
  user?: { name: string; avatar?: string };
  /** Rating given (if reviewed/logged) */
  rating?: number;
  /** Review text (if reviewed) */
  reviewText?: string;
  /** When this activity happened */
  date?: string;
  /** Show as compact card */
  compact?: boolean;
}

/**
 * Film Activity Card - Shows a film with user activity (Letterboxd style)
 */
export function FilmActivityCard({
  film,
  activity,
  user,
  rating,
  reviewText,
  date,
  compact = false,
}: FilmActivityCardProps) {
  const year = film.release_date ? new Date(film.release_date).getFullYear() : null;

  const ActivityIcon = {
    watched: Eye,
    liked: Heart,
    reviewed: MessageSquare,
    logged: Calendar,
  }[activity];

  const activityColors = {
    watched: 'text-letterboxd-green',
    liked: 'text-letterboxd-orange',
    reviewed: 'text-letterboxd-blue',
    logged: 'text-text-secondary',
  };

  if (compact) {
    return (
      <Link
        to="/film/$id"
        params={{ id: String(film.id) }}
        className="hover:bg-bg-tertiary group flex items-center gap-3 rounded-lg p-3 transition-colors"
      >
        {/* Poster */}
        <div className="w-12 shrink-0">
          <div className="aspect-poster bg-bg-secondary overflow-hidden rounded">
            <img
              src={getImageUrl(film.poster_path, 'poster', 'small')}
              alt={film.title}
              className="h-full w-full object-cover"
            />
          </div>
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <h3 className="text-text-primary group-hover:text-letterboxd-green truncate font-medium transition-colors">
            {film.title}
          </h3>
          <div className="text-text-tertiary flex items-center gap-2 text-xs">
            {year && <span>{year}</span>}
            {rating && <StarRatingDisplay rating={rating} size="sm" />}
          </div>
        </div>

        {/* Activity indicator */}
        <ActivityIcon className={`h-4 w-4 shrink-0 ${activityColors[activity]}`} />
      </Link>
    );
  }

  return (
    <div className="card hover:bg-bg-tertiary/50 transition-colors">
      <div className="flex gap-4">
        {/* Poster */}
        <Link to="/film/$id" params={{ id: String(film.id) }} className="shrink-0">
          <div className="poster-card aspect-poster bg-bg-secondary w-20 md:w-24">
            <img
              src={getImageUrl(film.poster_path, 'poster', 'small')}
              alt={film.title}
              className="h-full w-full object-cover"
            />
          </div>
        </Link>

        {/* Content */}
        <div className="min-w-0 flex-1 py-1">
          {/* User info (if provided) */}
          {user && (
            <div className="mb-2 flex items-center gap-2">
              <div className="bg-bg-tertiary text-text-secondary flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt=""
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  (user.name[0] ?? 'U').toUpperCase()
                )}
              </div>
              <span className="text-text-primary text-sm font-medium">{user.name}</span>
              <ActivityIcon className={`h-3.5 w-3.5 ${activityColors[activity]}`} />
            </div>
          )}

          {/* Film title */}
          <Link to="/film/$id" params={{ id: String(film.id) }} className="group">
            <h3 className="font-display text-text-primary group-hover:text-letterboxd-green text-lg font-semibold transition-colors">
              {film.title}
              {year && (
                <span className="text-text-tertiary ml-2 text-base font-normal">{year}</span>
              )}
            </h3>
          </Link>

          {/* Rating */}
          {rating && (
            <div className="mt-2">
              <StarRatingDisplay rating={rating} size="md" />
            </div>
          )}

          {/* Review text */}
          {reviewText && (
            <p className="text-text-secondary mt-2 line-clamp-3 text-sm">{reviewText}</p>
          )}

          {/* Date */}
          {date && (
            <p className="text-text-tertiary mt-2 flex items-center gap-1 text-xs">
              <Clock className="h-3 w-3" />
              {date}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Horizontal scroll film row (like Letterboxd home sections)
 */
export function FilmRow({
  films,
  showRating = false,
  className = '',
}: {
  films: TMDbMovie[];
  showRating?: boolean;
  className?: string;
}) {
  return (
    <div className={`-mx-4 px-4 ${className}`}>
      <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-2">
        {films.map((film) => (
          <Link
            key={film.id}
            to="/film/$id"
            params={{ id: String(film.id) }}
            className="group w-[70px] shrink-0 md:w-[90px]"
          >
            <div className="poster-card aspect-poster bg-bg-secondary">
              <img
                src={getImageUrl(film.poster_path, 'poster', 'small')}
                alt={film.title}
                className="h-full w-full object-cover"
              />
            </div>
            {showRating && film.vote_average > 0 && (
              <div className="mt-1 flex justify-center">
                <StarRatingDisplay rating={film.vote_average / 2} size="sm" />
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
