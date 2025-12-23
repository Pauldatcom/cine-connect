import { Link } from '@tanstack/react-router';
import { Star } from 'lucide-react';
import { getImageUrl, type TMDbMovie } from '@/lib/api/tmdb';

interface FilmPosterProps {
  film: TMDbMovie;
  showRating?: boolean;
  showTitle?: boolean;
  priority?: boolean;
}

/**
 * Film poster card component - Letterboxd style
 */
export function FilmPoster({
  film,
  showRating = true,
  showTitle = true,
  priority = false,
}: FilmPosterProps) {
  const year = film.release_date ? new Date(film.release_date).getFullYear() : null;

  return (
    <Link to="/film/$id" params={{ id: String(film.id) }} className="group block">
      {/* Poster Container */}
      <div className="poster-card aspect-poster bg-bg-secondary">
        <img
          src={getImageUrl(film.poster_path, 'poster', 'medium')}
          alt={film.title}
          loading={priority ? 'eager' : 'lazy'}
          className="h-full w-full object-cover"
        />

        {/* Hover Overlay */}
        <div className="bg-bg-primary/0 group-hover:bg-bg-primary/40 absolute inset-0 flex items-center justify-center transition-colors duration-300">
          <div className="opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            {showRating && film.vote_average > 0 && (
              <div className="bg-bg-primary/80 flex items-center gap-1.5 rounded-full px-3 py-1.5">
                <Star className="text-letterboxd-green fill-letterboxd-green h-4 w-4" />
                <span className="text-sm font-semibold text-white">
                  {film.vote_average.toFixed(1)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Title & Year */}
      {showTitle && (
        <div className="mt-2 space-y-0.5">
          <h3 className="text-text-primary group-hover:text-letterboxd-green line-clamp-1 text-sm font-medium transition-colors">
            {film.title}
          </h3>
          {year && <p className="text-text-tertiary text-xs">{year}</p>}
        </div>
      )}
    </Link>
  );
}

/**
 * Compact poster for lists/grids without title
 */
export function FilmPosterCompact({ film }: { film: TMDbMovie }) {
  return (
    <Link to="/film/$id" params={{ id: String(film.id) }} className="block">
      <div className="poster-card aspect-poster bg-bg-secondary">
        <img
          src={getImageUrl(film.poster_path, 'poster', 'small')}
          alt={film.title}
          loading="lazy"
          className="h-full w-full object-cover"
        />
      </div>
    </Link>
  );
}

/**
 * Large poster for featured sections
 */
export function FilmPosterLarge({ film }: { film: TMDbMovie }) {
  const year = film.release_date ? new Date(film.release_date).getFullYear() : null;

  return (
    <Link to="/film/$id" params={{ id: String(film.id) }} className="group block">
      <div className="poster-card aspect-poster bg-bg-secondary">
        <img
          src={getImageUrl(film.poster_path, 'poster', 'large')}
          alt={film.title}
          className="h-full w-full object-cover"
        />

        {/* Gradient overlay */}
        <div className="bg-gradient-poster absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {/* Info on hover */}
        <div className="absolute bottom-0 left-0 right-0 translate-y-4 p-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <h3 className="line-clamp-2 text-lg font-bold text-white">{film.title}</h3>
          <div className="mt-1 flex items-center gap-2 text-sm">
            {year && <span className="text-text-secondary">{year}</span>}
            {film.vote_average > 0 && (
              <span className="text-letterboxd-green flex items-center gap-1">
                <Star className="h-3 w-3 fill-current" />
                {film.vote_average.toFixed(1)}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
