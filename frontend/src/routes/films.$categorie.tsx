import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { getMoviesByGenre, getGenres, GENRE_MAP, type TMDbMovie } from '@/lib/api/tmdb';
import { FilmPoster } from '@/components/features/FilmPoster';

export const Route = createFileRoute('/films/$categorie')({
  component: FilmsCategoryPage,
});

/** Exported for unit tests; route registration uses this as `component`. */
export function FilmsCategoryPage() {
  const { categorie } = Route.useParams();

  const [page, setPage] = useState(1);
  const [movies, setMovies] = useState<TMDbMovie[]>([]);

  // 🔹 Get genres
  const { data: genresData } = useQuery({
    queryKey: ['genres'],
    queryFn: getGenres,
  });

  // 🔹 Find genre ID
  const genreId =
    GENRE_MAP[categorie.toLowerCase()] ||
    genresData?.genres.find(
      (g) => g.name.toLowerCase().replace(/ /g, '-') === categorie.toLowerCase()
    )?.id;

  const genreName = genresData?.genres.find((g) => g.id === genreId)?.name || categorie;

  // 🔹 Fetch movies with page
  const { data, isLoading, error, isFetching } = useQuery({
    queryKey: ['movies', 'genre', genreId, page],
    queryFn: () => getMoviesByGenre(genreId as number, page),
    enabled: !!genreId,
  });

  // 🔹 Reset when category changes
  useEffect(() => {
    setMovies([]);
    setPage(1);
  }, [categorie]);

  // 🔹 Append new results
  useEffect(() => {
    if (data?.results) {
      setMovies((prev) => [...prev, ...data.results]);
    }
  }, [data]);

  if (!genreId && genresData) {
    return (
      <div className="py-20 text-center">
        <h1 className="text-text-primary text-2xl font-bold">Category Not Found</h1>
        <p className="text-text-secondary mt-2">
          The category &ldquo;{categorie}&rdquo; doesn&apos;t exist.
        </p>
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

      {/* Loader initial */}
      {isLoading && page === 1 ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="text-letterboxd-green h-8 w-8 animate-spin" />
        </div>
      ) : error ? (
        <div className="card border-red-500/50 bg-red-500/10 text-red-400">
          Error loading films. Please try again.
        </div>
      ) : data?.results.filter((f) => f.poster_path).length ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {data.results
            .filter((f) => f.poster_path)
            .map((film, index) => (
              <FilmPoster key={film.id} film={film} priority={index < 12} />
            ))}
        </div>
      ) : movies.length ? (
        <>
          {/* Grid */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {movies.map((film, index) => (
              <FilmPoster key={`${film.id}-${index}`} film={film} priority={index < 12} />
            ))}
          </div>

          {/* Load more button */}
          {data && data.page < data.total_pages && (
            <div className="mt-8 flex justify-center">
              <button
                onClick={() => setPage((prev) => prev + 1)}
                className="bg-letterboxd-green flex items-center gap-2 rounded-lg px-6 py-2 font-semibold text-black transition hover:opacity-80"
                disabled={isFetching}
              >
                {isFetching ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Loading...
                  </>
                ) : (
                  '+'
                )}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-text-secondary py-20 text-center">
          No {genreName.toLowerCase()} films found.
        </div>
      )}
    </div>
  );
}
