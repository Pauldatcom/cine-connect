import { createFileRoute, Link, Outlet } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { getGenres } from '@/lib/api/tmdb';

/**
 * Films layout - Category navigation bar
 */
export const Route = createFileRoute('/films')({
  component: FilmsLayout,
});

function FilmsLayout() {
  const { data: genresData } = useQuery({
    queryKey: ['genres'],
    queryFn: getGenres,
  });

  const genres = genresData?.genres || [];

  return (
    <div className="min-h-screen">
      {/* Genre Navigation */}
      <div className="border-border bg-bg-secondary sticky top-14 z-40 border-b">
        <div className="mx-auto max-w-7xl px-4">
          <div className="scrollbar-hide flex gap-1 overflow-x-auto py-3">
            <Link
              to="/films"
              activeOptions={{ exact: true }}
              className="text-text-secondary hover:text-text-primary hover:bg-bg-tertiary [&.active]:bg-letterboxd-green [&.active]:text-bg-primary shrink-0 rounded px-4 py-2 text-sm font-medium transition-colors"
            >
              All Films
            </Link>
            {genres.map((genre) => (
              <Link
                key={genre.id}
                to="/films/$categorie"
                params={{ categorie: genre.name.toLowerCase().replace(/ /g, '-') }}
                className="text-text-secondary hover:text-text-primary hover:bg-bg-tertiary [&.active]:bg-letterboxd-green [&.active]:text-bg-primary shrink-0 rounded px-4 py-2 text-sm font-medium transition-colors"
              >
                {genre.name}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-4 py-8">
        <Outlet />
      </div>
    </div>
  );
}
