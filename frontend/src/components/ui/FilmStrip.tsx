import { useQuery } from '@tanstack/react-query';
import { getPopular, getImageUrl, type TMDbMovie } from '@/lib/api/tmdb';

interface FilmStripProps {
  /** Films to display in the strip (or uses popular if not provided) */
  films?: TMDbMovie[];
  /** Number of posters to show */
  count?: number;
  /** Height of the film strip */
  height?: 'sm' | 'md' | 'lg';
  /** Add gradient overlay */
  overlay?: boolean;
  /** Custom class */
  className?: string;
}

/**
 * Film Strip Header - Iconic Letterboxd component
 * Shows a row of film posters as a decorative header element
 */
export function FilmStrip({
  films: providedFilms,
  count = 8,
  height = 'md',
  overlay = true,
  className = '',
}: FilmStripProps) {
  // Fetch popular films if none provided
  const { data: popularData } = useQuery({
    queryKey: ['movies', 'popular', 'strip'],
    queryFn: () => getPopular(),
    enabled: !providedFilms,
    staleTime: 1000 * 60 * 10, // Cache for 10 minutes
  });

  const films = providedFilms || popularData?.results || [];
  const displayFilms = films.slice(0, count);

  const heightClasses = {
    sm: 'h-24',
    md: 'h-36',
    lg: 'h-48',
  };

  if (!displayFilms.length) {
    return <div className={`${heightClasses[height]} bg-bg-secondary ${className}`} />;
  }

  return (
    <div className={`relative overflow-hidden ${heightClasses[height]} ${className}`}>
      {/* Film posters */}
      <div className="flex h-full">
        {displayFilms.map((film, index) => (
          <div
            key={film.id}
            className="h-full shrink-0"
            style={{
              width: `${100 / count}%`,
              animationDelay: `${index * 50}ms`,
            }}
          >
            <img
              src={getImageUrl(film.poster_path, 'poster', 'medium')}
              alt=""
              className="h-full w-full object-cover object-top"
              loading="lazy"
            />
          </div>
        ))}
      </div>

      {/* Gradient overlay (Letterboxd style) */}
      {overlay && (
        <div className="from-bg-primary/80 to-bg-primary absolute inset-0 bg-gradient-to-b via-transparent" />
      )}

      {/* Film strip perforations (decorative) */}
      <div className="bg-bg-primary/90 absolute left-0 right-0 top-0 flex h-2 items-center justify-around">
        {Array.from({ length: 24 }).map((_, i) => (
          <div key={i} className="bg-bg-secondary h-1 w-2 rounded-sm" />
        ))}
      </div>
      <div className="bg-bg-primary/90 absolute bottom-0 left-0 right-0 flex h-2 items-center justify-around">
        {Array.from({ length: 24 }).map((_, i) => (
          <div key={i} className="bg-bg-secondary h-1 w-2 rounded-sm" />
        ))}
      </div>
    </div>
  );
}

/**
 * Compact film strip for section headers
 */
export function FilmStripMini({
  films,
  className = '',
}: {
  films?: TMDbMovie[];
  className?: string;
}) {
  return <FilmStrip films={films} count={12} height="sm" className={className} />;
}
