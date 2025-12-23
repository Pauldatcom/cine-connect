import { useState } from 'react';
import { ChevronDown, ChevronUp, X, SlidersHorizontal } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getGenres } from '@/lib/api/tmdb';

export interface FilmFilters {
  genres: number[];
  yearFrom?: number;
  yearTo?: number;
  decade?: number;
  ratingMin?: number;
  ratingMax?: number;
  sortBy:
    | 'popularity.desc'
    | 'popularity.asc'
    | 'vote_average.desc'
    | 'vote_average.asc'
    | 'release_date.desc'
    | 'release_date.asc'
    | 'title.asc'
    | 'title.desc';
}

interface FilterPanelProps {
  filters: FilmFilters;
  onFiltersChange: (filters: FilmFilters) => void;
  onReset: () => void;
}

const DECADES = [2020, 2010, 2000, 1990, 1980, 1970, 1960, 1950, 1940, 1930];
const CURRENT_YEAR = new Date().getFullYear();

const SORT_OPTIONS = [
  { value: 'popularity.desc', label: 'Popularity (High)' },
  { value: 'popularity.asc', label: 'Popularity (Low)' },
  { value: 'vote_average.desc', label: 'Rating (High)' },
  { value: 'vote_average.asc', label: 'Rating (Low)' },
  { value: 'release_date.desc', label: 'Newest First' },
  { value: 'release_date.asc', label: 'Oldest First' },
  { value: 'title.asc', label: 'Title (A-Z)' },
  { value: 'title.desc', label: 'Title (Z-A)' },
] as const;

/**
 * Advanced Film Filter Panel - Letterboxd style
 */
export function FilterPanel({ filters, onFiltersChange, onReset }: FilterPanelProps) {
  const [expanded, setExpanded] = useState(false);

  const { data: genresData } = useQuery({
    queryKey: ['genres'],
    queryFn: getGenres,
  });

  const genres = genresData?.genres || [];
  const activeFilterCount = countActiveFilters(filters);

  const toggleGenre = (genreId: number) => {
    const newGenres = filters.genres.includes(genreId)
      ? filters.genres.filter((id) => id !== genreId)
      : [...filters.genres, genreId];
    onFiltersChange({ ...filters, genres: newGenres });
  };

  const setDecade = (decade: number | undefined) => {
    if (decade) {
      onFiltersChange({
        ...filters,
        decade,
        yearFrom: decade,
        yearTo: decade + 9,
      });
    } else {
      onFiltersChange({
        ...filters,
        decade: undefined,
        yearFrom: undefined,
        yearTo: undefined,
      });
    }
  };

  return (
    <div className="card overflow-hidden p-0">
      {/* Header - Always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="hover:bg-bg-tertiary flex w-full items-center justify-between p-4 transition-colors"
      >
        <div className="flex items-center gap-3">
          <SlidersHorizontal className="text-letterboxd-green h-5 w-5" />
          <span className="text-text-primary font-medium">Filters</span>
          {activeFilterCount > 0 && (
            <span className="bg-letterboxd-green text-bg-primary rounded-full px-2 py-0.5 text-xs font-medium">
              {activeFilterCount}
            </span>
          )}
        </div>
        {expanded ? (
          <ChevronUp className="text-text-tertiary h-5 w-5" />
        ) : (
          <ChevronDown className="text-text-tertiary h-5 w-5" />
        )}
      </button>

      {/* Expanded filters */}
      {expanded && (
        <div className="animate-fade-in space-y-6 p-4 pt-0">
          {/* Sort By */}
          <div>
            <label className="text-text-secondary mb-2 block text-sm font-medium">Sort By</label>
            <select
              value={filters.sortBy}
              onChange={(e) =>
                onFiltersChange({ ...filters, sortBy: e.target.value as FilmFilters['sortBy'] })
              }
              className="input"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Genres */}
          <div>
            <label className="text-text-secondary mb-2 block text-sm font-medium">Genres</label>
            <div className="flex flex-wrap gap-2">
              {genres.map((genre) => (
                <button
                  key={genre.id}
                  onClick={() => toggleGenre(genre.id)}
                  className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                    filters.genres.includes(genre.id)
                      ? 'bg-letterboxd-green text-bg-primary'
                      : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {genre.name}
                </button>
              ))}
            </div>
          </div>

          {/* Decades */}
          <div>
            <label className="text-text-secondary mb-2 block text-sm font-medium">Decade</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setDecade(undefined)}
                className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                  !filters.decade
                    ? 'bg-letterboxd-green text-bg-primary'
                    : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'
                }`}
              >
                All
              </button>
              {DECADES.map((decade) => (
                <button
                  key={decade}
                  onClick={() => setDecade(decade)}
                  className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                    filters.decade === decade
                      ? 'bg-letterboxd-green text-bg-primary'
                      : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {decade}s
                </button>
              ))}
            </div>
          </div>

          {/* Year Range (custom) */}
          {!filters.decade && (
            <div>
              <label className="text-text-secondary mb-2 block text-sm font-medium">
                Year Range
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={1900}
                  max={CURRENT_YEAR}
                  placeholder="From"
                  value={filters.yearFrom || ''}
                  onChange={(e) =>
                    onFiltersChange({
                      ...filters,
                      yearFrom: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  className="input w-28"
                />
                <span className="text-text-tertiary">to</span>
                <input
                  type="number"
                  min={1900}
                  max={CURRENT_YEAR}
                  placeholder="To"
                  value={filters.yearTo || ''}
                  onChange={(e) =>
                    onFiltersChange({
                      ...filters,
                      yearTo: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  className="input w-28"
                />
              </div>
            </div>
          )}

          {/* Rating Range */}
          <div>
            <label className="text-text-secondary mb-2 block text-sm font-medium">
              Minimum Rating
            </label>
            <div className="flex gap-2">
              {[0, 5, 6, 7, 8, 9].map((rating) => (
                <button
                  key={rating}
                  onClick={() =>
                    onFiltersChange({
                      ...filters,
                      ratingMin: filters.ratingMin === rating ? undefined : rating,
                    })
                  }
                  className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                    filters.ratingMin === rating
                      ? 'bg-letterboxd-green text-bg-primary'
                      : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {rating === 0 ? 'Any' : `${rating}+`}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="border-border flex gap-3 border-t pt-2">
            <button
              onClick={onReset}
              className="btn-ghost flex-1"
              disabled={activeFilterCount === 0}
            >
              <X className="h-4 w-4" />
              Clear All
            </button>
          </div>
        </div>
      )}

      {/* Active filter tags (shown when collapsed) */}
      {!expanded && activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2 px-4 pb-4">
          {filters.genres.map((genreId) => {
            const genre = genres.find((g) => g.id === genreId);
            return genre ? (
              <span
                key={genreId}
                className="bg-bg-tertiary text-text-secondary inline-flex items-center gap-1 rounded px-2 py-1 text-xs"
              >
                {genre.name}
                <button onClick={() => toggleGenre(genreId)}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            ) : null;
          })}
          {filters.decade && (
            <span className="bg-bg-tertiary text-text-secondary inline-flex items-center gap-1 rounded px-2 py-1 text-xs">
              {filters.decade}s
              <button onClick={() => setDecade(undefined)}>
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {filters.ratingMin !== undefined && filters.ratingMin > 0 && (
            <span className="bg-bg-tertiary text-text-secondary inline-flex items-center gap-1 rounded px-2 py-1 text-xs">
              {filters.ratingMin}+ rating
              <button onClick={() => onFiltersChange({ ...filters, ratingMin: undefined })}>
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Count active filters
 */
function countActiveFilters(filters: FilmFilters): number {
  let count = 0;
  if (filters.genres.length > 0) count += filters.genres.length;
  if (filters.decade) count += 1;
  else if (filters.yearFrom || filters.yearTo) count += 1;
  if (filters.ratingMin !== undefined && filters.ratingMin > 0) count += 1;
  if (filters.sortBy !== 'popularity.desc') count += 1;
  return count;
}

/**
 * Default filter state
 */
export const defaultFilters: FilmFilters = {
  genres: [],
  sortBy: 'popularity.desc',
};
