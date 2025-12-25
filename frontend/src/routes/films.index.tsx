import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import { Search, Loader2, Grid3X3, LayoutList } from 'lucide-react';
import { searchMovies, getPopular, getTrending, getTopRated, type TMDbMovie } from '@/lib/api/tmdb';
import { FilmPoster } from '@/components/FilmPoster';
import { FilterPanel, defaultFilters, type FilmFilters } from '@/components/ui/FilterPanel';
import { FilmStrip } from '@/components/ui/FilmStrip';

/**
 * Films index - Browse and search all films with advanced filtering
 * Letterboxd-style layout with poster grid
 */
export const Route = createFileRoute('/films/')({
  component: FilmsIndexPage,
});

function FilmsIndexPage() {
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearch, setActiveSearch] = useState('');

  // Filter state
  const [filters, setFilters] = useState<FilmFilters>(defaultFilters);

  // View toggle
  const [view, setView] = useState<'popular' | 'trending' | 'top-rated'>('popular');
  const [gridSize, setGridSize] = useState<'normal' | 'compact'>('normal');

  // Search results
  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ['movies', 'search', activeSearch],
    queryFn: () => searchMovies(activeSearch),
    enabled: activeSearch.length >= 2,
  });

  // Popular movies
  const { data: popular, isLoading: popularLoading } = useQuery({
    queryKey: ['movies', 'popular'],
    queryFn: () => getPopular(),
    enabled: !activeSearch && view === 'popular',
  });

  // Trending movies
  const { data: trending, isLoading: trendingLoading } = useQuery({
    queryKey: ['movies', 'trending'],
    queryFn: () => getTrending('week'),
    enabled: !activeSearch && view === 'trending',
  });

  // Top rated movies
  const { data: topRated, isLoading: topRatedLoading } = useQuery({
    queryKey: ['movies', 'top-rated'],
    queryFn: () => getTopRated(),
    enabled: !activeSearch && view === 'top-rated',
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveSearch(searchQuery);
  };

  const handleClear = () => {
    setSearchQuery('');
    setActiveSearch('');
  };

  const handleResetFilters = () => {
    setFilters(defaultFilters);
  };

  // Get current movies based on view
  const rawMovies: TMDbMovie[] = useMemo(() => {
    if (activeSearch) return searchResults?.results || [];
    switch (view) {
      case 'trending':
        return trending?.results || [];
      case 'top-rated':
        return topRated?.results || [];
      default:
        return popular?.results || [];
    }
  }, [activeSearch, view, searchResults, trending, topRated, popular]);

  // Apply client-side filters
  const movies = useMemo(() => {
    let filtered = [...rawMovies];

    // Filter by genres
    if (filters.genres.length > 0) {
      filtered = filtered.filter((movie) =>
        filters.genres.some((g) => movie.genre_ids.includes(g))
      );
    }

    // Filter by year
    if (filters.yearFrom) {
      filtered = filtered.filter((movie) => {
        const year = movie.release_date ? new Date(movie.release_date).getFullYear() : 0;
        return year >= (filters.yearFrom || 0);
      });
    }
    if (filters.yearTo) {
      filtered = filtered.filter((movie) => {
        const year = movie.release_date ? new Date(movie.release_date).getFullYear() : 0;
        return year <= (filters.yearTo || 9999);
      });
    }

    // Filter by rating
    if (filters.ratingMin) {
      filtered = filtered.filter((movie) => movie.vote_average >= (filters.ratingMin ?? 0));
    }

    return filtered;
  }, [rawMovies, filters]);

  const isLoading = searchLoading || popularLoading || trendingLoading || topRatedLoading;

  const gridClasses =
    gridSize === 'compact'
      ? 'grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2'
      : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4';

  return (
    <div className="animate-fade-in">
      {/* Film Strip Header */}
      <FilmStrip films={rawMovies} height="md" />

      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="font-display text-text-primary text-3xl font-bold">Browse Films</h1>
          <p className="text-text-secondary mt-1">
            Discover your next favorite movie from our collection
          </p>
        </div>

        {/* Search & View Controls */}
        <div className="mb-6 flex flex-col gap-4 lg:flex-row">
          {/* Search Form */}
          <form onSubmit={handleSearch} className="flex flex-1 gap-2">
            <div className="relative flex-1">
              <Search className="text-text-tertiary absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for a film..."
                className="input pl-10"
              />
            </div>
            <button type="submit" className="btn-primary" disabled={searchQuery.length < 2}>
              Search
            </button>
            {activeSearch && (
              <button type="button" onClick={handleClear} className="btn-secondary">
                Clear
              </button>
            )}
          </form>

          {/* View Controls */}
          <div className="flex gap-2">
            {/* Category Toggle (only when not searching) */}
            {!activeSearch && (
              <div className="bg-bg-secondary flex gap-1 rounded p-1">
                {(['popular', 'trending', 'top-rated'] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    className={`rounded px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
                      view === v
                        ? 'bg-letterboxd-green text-bg-primary'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    {v.replace('-', ' ')}
                  </button>
                ))}
              </div>
            )}

            {/* Grid size toggle */}
            <div className="bg-bg-secondary flex gap-1 rounded p-1">
              <button
                onClick={() => setGridSize('normal')}
                className={`rounded p-2 transition-colors ${
                  gridSize === 'normal'
                    ? 'bg-letterboxd-green text-bg-primary'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
                aria-label="Normal grid"
              >
                <Grid3X3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setGridSize('compact')}
                className={`rounded p-2 transition-colors ${
                  gridSize === 'compact'
                    ? 'bg-letterboxd-green text-bg-primary'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
                aria-label="Compact grid"
              >
                <LayoutList className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <FilterPanel
            filters={filters}
            onFiltersChange={setFilters}
            onReset={handleResetFilters}
          />
        </div>

        {/* Search Results Info */}
        {activeSearch && searchResults && (
          <p className="text-text-secondary mb-4">
            Found{' '}
            <span className="text-text-primary font-medium">
              {searchResults.total_results.toLocaleString()}
            </span>{' '}
            results for &ldquo;<span className="text-letterboxd-green">{activeSearch}</span>&rdquo;
          </p>
        )}

        {/* Filter Results Info */}
        {!activeSearch && movies.length !== rawMovies.length && (
          <p className="text-text-secondary mb-4">
            Showing <span className="text-text-primary font-medium">{movies.length}</span> of{' '}
            {rawMovies.length} films
          </p>
        )}

        {/* Results */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="text-letterboxd-green h-8 w-8 animate-spin" />
          </div>
        ) : movies.length > 0 ? (
          <div className={`grid ${gridClasses}`}>
            {movies.map((film, index) => (
              <FilmPoster
                key={film.id}
                film={film}
                priority={index < 12}
                showTitle={gridSize === 'normal'}
                showRating={gridSize === 'normal'}
              />
            ))}
          </div>
        ) : activeSearch ? (
          <div className="py-20 text-center">
            <p className="text-text-secondary text-lg">
              No films found for &ldquo;{activeSearch}&rdquo;
            </p>
            <p className="text-text-tertiary mt-2">Try adjusting your search or filters</p>
            <button onClick={handleClear} className="btn-secondary mt-6">
              Clear Search
            </button>
          </div>
        ) : (
          <div className="py-20 text-center">
            <p className="text-text-secondary">No films match your filters</p>
            <button onClick={handleResetFilters} className="btn-secondary mt-4">
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
