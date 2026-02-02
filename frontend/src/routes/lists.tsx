import { FilmStrip } from '@/components/ui/FilmStrip';
import { useAuth } from '@/contexts/AuthContext';
import { useRemoveFromWatchlist, useWatchlist, type WatchlistItem } from '@/hooks';
import { getImageUrl } from '@/lib/api/tmdb';
import { createFileRoute, Link } from '@tanstack/react-router';
import { Bookmark, Clock, Film, Loader2, Trash2 } from 'lucide-react';
import { useState } from 'react';

/**
 * Lists/Watchlist page - User's personal watchlist
 */
export const Route = createFileRoute('/lists')({
  component: ListsPage,
});

function ListsPage() {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <UnauthenticatedView />;
  }

  return <WatchlistView username={user?.username} />;
}

function UnauthenticatedView() {
  return (
    <div className="animate-fade-in">
      <FilmStrip height="md" />

      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <div className="bg-bg-secondary mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full">
          <Bookmark className="text-letterboxd-green h-10 w-10" />
        </div>
        <h1 className="font-display text-text-primary mb-4 text-3xl font-bold">Your Watchlist</h1>
        <p className="text-text-secondary mx-auto mb-8 max-w-lg">
          Keep track of films you want to watch. Sign in to create your personal watchlist and never
          forget a film recommendation again.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link to="/profil" search={{ mode: 'login' }} className="btn-primary px-8 py-3">
            Sign In
          </Link>
          <Link to="/profil" search={{ mode: 'register' }} className="btn-secondary px-8 py-3">
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
}

function WatchlistView({ username }: { username?: string }) {
  const { data: watchlistData, isLoading, error } = useWatchlist();
  const [sortBy, setSortBy] = useState<'added' | 'title'>('added');

  const items = watchlistData?.items ?? [];

  // Sort items
  const sortedItems = [...items].sort((a, b) => {
    if (sortBy === 'title') {
      return a.film.title.localeCompare(b.film.title);
    }
    return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
  });

  return (
    <div className="animate-fade-in">
      <FilmStrip height="md" />

      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Page Header */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="font-display text-text-primary flex items-center gap-3 text-3xl font-bold">
              <Bookmark className="text-letterboxd-green h-8 w-8" />
              {username ? `${username}'s Watchlist` : 'My Watchlist'}
            </h1>
            <p className="text-text-secondary mt-1">
              {items.length} {items.length === 1 ? 'film' : 'films'} to watch
            </p>
          </div>

          {/* Sort Toggle */}
          {items.length > 1 && (
            <div className="bg-bg-secondary flex gap-1 rounded p-1">
              <button
                onClick={() => setSortBy('added')}
                className={`flex items-center gap-2 rounded px-4 py-2 text-sm font-medium transition-colors ${
                  sortBy === 'added'
                    ? 'bg-letterboxd-green text-bg-primary'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <Clock className="h-4 w-4" />
                Recently Added
              </button>
              <button
                onClick={() => setSortBy('title')}
                className={`flex items-center gap-2 rounded px-4 py-2 text-sm font-medium transition-colors ${
                  sortBy === 'title'
                    ? 'bg-letterboxd-green text-bg-primary'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <Film className="h-4 w-4" />
                Title
              </button>
            </div>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="text-letterboxd-green h-8 w-8 animate-spin" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="py-16 text-center">
            <p className="text-text-secondary">Failed to load watchlist. Please try again.</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && items.length === 0 && (
          <div className="py-16 text-center">
            <div className="bg-bg-secondary mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full">
              <Bookmark className="text-text-tertiary h-10 w-10" />
            </div>
            <h2 className="text-text-primary mb-2 text-xl font-semibold">
              Your watchlist is empty
            </h2>
            <p className="text-text-secondary mx-auto mb-8 max-w-md">
              Start adding films to your watchlist by clicking the bookmark icon on any film.
            </p>
            <Link to="/films" className="btn-primary px-8 py-3">
              Browse Films
            </Link>
          </div>
        )}

        {/* Watchlist Grid */}
        {!isLoading && !error && items.length > 0 && (
          <div
            className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
            data-testid="watchlist-grid"
          >
            {sortedItems.map((item) => (
              <WatchlistCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function WatchlistCard({ item }: { item: WatchlistItem }) {
  const removeMutation = useRemoveFromWatchlist();
  const [isHovered, setIsHovered] = useState(false);

  const handleRemove = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      await removeMutation.mutateAsync(item.filmId);
    } catch (error) {
      console.error('[Watchlist] Failed to remove:', error);
    }
  };

  // Use TMDb image URL format since poster is stored as path
  const posterUrl = item.film.poster
    ? `https://image.tmdb.org/t/p/w342${item.film.poster}`
    : getImageUrl(null, 'poster', 'medium');

  return (
    <div
      className="group relative"
      data-testid="watchlist-card"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link
        to="/film/$id"
        params={{ id: String(item.film.tmdbId) }}
        className="block"
        aria-label={item.film.title}
      >
        <div className="bg-bg-tertiary relative aspect-[2/3] overflow-hidden rounded-lg">
          <img
            src={posterUrl}
            alt={item.film.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />

          {/* Hover overlay */}
          <div
            className={`absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity ${
              isHovered ? 'opacity-100' : 'opacity-0'
            }`}
          />

          {/* Film info on hover */}
          <div
            className={`absolute bottom-0 left-0 right-0 p-3 transition-opacity ${
              isHovered ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <h3 className="line-clamp-2 text-sm font-semibold text-white">{item.film.title}</h3>
            {item.film.year && <p className="text-text-secondary mt-1 text-xs">{item.film.year}</p>}
          </div>

          {/* Remove button */}
          <button
            onClick={handleRemove}
            disabled={removeMutation.isPending}
            className={`absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-red-500/80 text-white transition-all hover:bg-red-600 ${
              isHovered ? 'opacity-100' : 'opacity-0'
            }`}
            title="Remove from Watchlist"
          >
            {removeMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </button>
        </div>
      </Link>

      {/* Title below poster (always visible) */}
      <div className="mt-2">
        <h3 className="text-text-primary line-clamp-1 text-sm font-medium">{item.film.title}</h3>
        {item.film.year && <p className="text-text-tertiary text-xs">{item.film.year}</p>}
      </div>
    </div>
  );
}
