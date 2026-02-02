/**
 * WatchlistButton Component
 * Add/remove films from the user's watchlist
 */

import { Bookmark, BookmarkCheck, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useIsInWatchlist, useToggleWatchlist } from '@/hooks/useWatchlist';
import { cn } from '@/lib/utils';

interface WatchlistButtonProps {
  filmId: string;
  className?: string;
  variant?: 'icon' | 'button';
  size?: 'sm' | 'md' | 'lg';
}

export function WatchlistButton({
  filmId,
  className,
  variant = 'button',
  size = 'md',
}: WatchlistButtonProps) {
  const { isAuthenticated } = useAuth();
  const { data: watchlistStatus, isLoading: isChecking } = useIsInWatchlist(
    isAuthenticated ? filmId : undefined
  );
  const { toggleWatchlist, isLoading: isToggling } = useToggleWatchlist();

  const isInWatchlist = watchlistStatus?.isInWatchlist ?? false;
  const isLoading = isChecking || isToggling;

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated || isLoading) return;

    try {
      await toggleWatchlist(filmId, isInWatchlist);
    } catch (error) {
      console.error('[Watchlist] Failed to toggle:', error);
    }
  };

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
  };

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  if (variant === 'icon') {
    return (
      <button
        onClick={handleClick}
        disabled={isLoading}
        className={cn(
          'flex items-center justify-center rounded-full transition-all',
          'bg-bg-primary/80 hover:bg-bg-primary backdrop-blur-sm',
          'border-border hover:border-letterboxd-green border',
          sizeClasses[size],
          isInWatchlist && 'border-letterboxd-green bg-letterboxd-green/20',
          className
        )}
        title={isInWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
      >
        {isLoading ? (
          <Loader2 className={cn(iconSizes[size], 'text-text-secondary animate-spin')} />
        ) : isInWatchlist ? (
          <BookmarkCheck className={cn(iconSizes[size], 'text-letterboxd-green')} />
        ) : (
          <Bookmark
            className={cn(iconSizes[size], 'text-text-secondary hover:text-letterboxd-green')}
          />
        )}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={cn(
        'btn-secondary flex items-center gap-2',
        isInWatchlist && 'border-letterboxd-green text-letterboxd-green',
        className
      )}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isInWatchlist ? (
        <BookmarkCheck className="h-4 w-4" />
      ) : (
        <Bookmark className="h-4 w-4" />
      )}
      {isInWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
    </button>
  );
}
