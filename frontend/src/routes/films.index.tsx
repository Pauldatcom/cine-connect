import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Loader2,
  Grid3X3,
  LayoutList,
  Star,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { useRecommendations } from '@/hooks';
import type { BackendFilm } from '@/lib/api/films';
import { searchMovies, getPopular, getTrending, getTopRated, type TMDbMovie } from '@/lib/api/tmdb';
import { FilmPoster } from '@/components/features/FilmPoster';
import { FilterPanel, defaultFilters, type FilmFilters } from '@/components/ui/FilterPanel';
import { FilmStrip } from '@/components/ui/FilmStrip';

const viewEnum = z.enum(['popular', 'trending', 'top-rated', 'for-you']);
const filmsSearchSchema = z.object({
  page: z.coerce.number().int().min(1).optional().catch(1),
  view: viewEnum.optional().catch('popular'),
});

function backendFilmToTMDbMovie(f: BackendFilm): TMDbMovie {
  return {
    id: f.tmdbId,
    title: f.title,
    original_title: f.title,
    overview: f.plot ?? '',
    poster_path: f.poster ?? null,
    backdrop_path: null,
    release_date: f.year ? `${f.year}-01-01` : '',
    vote_average: f.tmdbRating ? parseFloat(f.tmdbRating) : 0,
    vote_count: 0,
    popularity: 0,
    genre_ids: [],
    adult: false,
    original_language: 'en',
  };
}

/**
 * Films index - Browse and search all films with advanced filtering and pagination
 * Letterboxd-style layout with poster grid
 */
export const Route = createFileRoute('/films/')({
  component: FilmsIndexPage,
  validateSearch: filmsSearchSchema,
});

const RESULTS_PER_PAGE = 20;

export function FilmsIndexPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { page: urlPage, view: urlView } = useSearch({ from: '/films/' });
  const page = urlPage ?? 1;
  const view = (urlView ?? 'popular') as 'popular' | 'trending' | 'top-rated' | 'for-you';

  // Search state

  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [filters, setFilters] = useState<FilmFilters>(defaultFilters);
  const [gridSize, setGridSize] = useState<'normal' | 'compact'>('normal');

  // Debounced search-on-type: update activeSearch after 350ms of no typing (min 2 chars)
  const SEARCH_DEBOUNCE_MS = 350;
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setActiveSearch((prev) => (prev ? '' : prev));
      return;
    }
    const timer = setTimeout(() => {
      setActiveSearch(searchQuery.trim());
      navigate({ from: '/films/', search: (prev) => ({ ...prev, page: 1 }) });
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchQuery, navigate]);

  const { data: recommendations, isLoading: recLoading } = useRecommendations(isAuthenticated);

  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ['movies', 'search', activeSearch, page],
    queryFn: () => searchMovies(activeSearch, page),
    enabled: activeSearch.length >= 2,
  });

  // Popular movies
  const { data: popular, isLoading: popularLoading } = useQuery({
    queryKey: ['movies', 'popular', page],
    queryFn: () => getPopular(page),
    enabled: !activeSearch && view === 'popular',
  });

  // Trending movies
  const { data: trending, isLoading: trendingLoading } = useQuery({
    queryKey: ['movies', 'trending', page],
    queryFn: () => getTrending('week', page),
    enabled: !activeSearch && view === 'trending',
  });

  const { data: topRated, isLoading: topRatedLoading } = useQuery({
    queryKey: ['movies', 'top-rated', page],
    queryFn: () => getTopRated(page),
    enabled: !activeSearch && view === 'top-rated',
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveSearch(searchQuery);
    navigate({ from: '/films/', search: { page: 1 } });
  };

  const handleClear = () => {
    setSearchQuery('');
    setActiveSearch('');
    navigate({ from: '/films/', search: { page: 1 } });
  };

  const handleResetFilters = () => {
    setFilters(defaultFilters);
  };

  const setPage = (newPage: number) => {
    navigate({ from: '/films/', search: (prev) => ({ ...prev, page: newPage }) });
  };

  const setViewAndResetPage = (newView: 'popular' | 'trending' | 'top-rated' | 'for-you') => {
    navigate({ from: '/films/', search: { view: newView, page: 1 } });
  };

  const rawMovies: TMDbMovie[] = useMemo(() => {
    let results: TMDbMovie[] = [];
    if (activeSearch) results = searchResults?.results || [];
    else if (view === 'for-you' && recommendations?.length) {
      results = recommendations.map(backendFilmToTMDbMovie);
    } else {
      switch (view) {
        case 'trending':
          results = trending?.results || [];
          break;
        case 'top-rated':
          results = topRated?.results || [];
          break;
        default:
          results = popular?.results || [];
      }
    }
    // Filter out films without posters
    return results.filter((m) => m.poster_path);
  }, [activeSearch, view, searchResults, trending, topRated, popular, recommendations]);

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

  const isLoading =
    searchLoading ||
    popularLoading ||
    trendingLoading ||
    topRatedLoading ||
    (view === 'for-you' && recLoading);

  const paginationMeta = useMemo(() => {
    if (activeSearch && searchResults) {
      return { totalPages: searchResults.total_pages, totalResults: searchResults.total_results };
    }
    if (view === 'popular' && popular) {
      return { totalPages: popular.total_pages, totalResults: popular.total_results };
    }
    if (view === 'trending' && trending) {
      return { totalPages: trending.total_pages, totalResults: trending.total_results };
    }
    if (view === 'top-rated' && topRated) {
      return { totalPages: topRated.total_pages, totalResults: topRated.total_results };
    }
    return null;
  }, [activeSearch, view, searchResults, popular, trending, topRated]);

  const showPagination = paginationMeta && paginationMeta.totalPages > 1 && view !== 'for-you';
  const startItem = (page - 1) * RESULTS_PER_PAGE + 1;
  const endItem = Math.min(page * RESULTS_PER_PAGE, paginationMeta?.totalResults ?? 0);

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
                {(
                  [
                    'popular',
                    'trending',
                    'top-rated',
                    ...(isAuthenticated ? (['for-you'] as const) : []),
                  ] as const
                ).map((v) => (
                  <button
                    key={v}
                    onClick={() => setViewAndResetPage(v)}
                    className={`flex items-center gap-1 rounded px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
                      view === v
                        ? 'bg-letterboxd-green text-bg-primary'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    {v === 'for-you' ? (
                      <>
                        <Star className="h-3.5 w-3.5" />
                        For you
                      </>
                    ) : (
                      v.replace('-', ' ')
                    )}
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
          <>
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
            {showPagination && paginationMeta && (
              <div className="border-border mt-8 flex flex-wrap items-center justify-center gap-4 border-t pt-8">
                <p className="text-text-secondary text-sm">
                  Showing <span className="text-text-primary font-medium">{startItem}</span>–
                  <span className="text-text-primary font-medium">{endItem}</span> of{' '}
                  <span className="text-text-primary font-medium">
                    {paginationMeta.totalResults.toLocaleString()}
                  </span>
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPage(page - 1)}
                    disabled={page <= 1}
                    className="btn-secondary flex items-center gap-1 px-3 py-2 text-sm disabled:opacity-50"
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </button>
                  <span className="text-text-secondary px-2 text-sm">
                    Page {page} of {paginationMeta.totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPage(page + 1)}
                    disabled={page >= paginationMeta.totalPages}
                    className="btn-secondary flex items-center gap-1 px-3 py-2 text-sm disabled:opacity-50"
                    aria-label="Next page"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
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
        ) : view === 'for-you' ? (
          <div className="py-20 text-center">
            <p className="text-text-secondary">
              Rate or add films to your watchlist to get personalized recommendations.
            </p>
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
