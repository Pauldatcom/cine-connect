import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { getMoviesByGenre, getGenres, GENRE_MAP } from '@/lib/api/tmdb';
import { FilmPoster } from '@/components/FilmPoster';

/**
 * Films by genre/category
 */
export const Route = createFileRoute('/films/$categorie')({
  component: FilmsCategoryPage,
});

function FilmsCategoryPage() {
  const { categorie } = Route.useParams();

  // Get all genres to find the matching one
  const { data: genresData } = useQuery({
    queryKey: ['genres'],
    queryFn: getGenres,
  });

  // Find genre ID from slug
  const genreId =
    GENRE_MAP[categorie.toLowerCase()] ||
    genresData?.genres.find(
      (g) => g.name.toLowerCase().replace(/ /g, '-') === categorie.toLowerCase()
    )?.id;

  const genreName = genresData?.genres.find((g) => g.id === genreId)?.name || categorie;

  const { data, isLoading, error } = useQuery({
    queryKey: ['movies', 'genre', genreId],
    queryFn: () => getMoviesByGenre(genreId!),
    enabled: !!genreId,
  });

  if (!genreId && genresData) {
    return (
      <div className="py-20 text-center">
        <h1 className="text-text-primary text-2xl font-bold">Category Not Found</h1>
        <p className="text-text-secondary mt-2">The category "{categorie}" doesn't exist.</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-text-primary text-3xl font-bold capitalize">
          {genreName} Films
        </h1>
        <p className="text-text-secondary mt-1">
          {data?.total_results
            ? `${data.total_results.toLocaleString()} films`
            : 'Browse our collection'}
        </p>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="text-letterboxd-green h-8 w-8 animate-spin" />
        </div>
      ) : error ? (
        <div className="card border-red-500/50 bg-red-500/10 text-red-400">
          Error loading films. Please try again.
        </div>
      ) : data?.results.length ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {data.results.map((film, index) => (
            <FilmPoster key={film.id} film={film} priority={index < 12} />
          ))}
        </div>
      ) : (
        <div className="text-text-secondary py-20 text-center">
          No {genreName.toLowerCase()} films found.
        </div>
      )}
    </div>
  );
}
