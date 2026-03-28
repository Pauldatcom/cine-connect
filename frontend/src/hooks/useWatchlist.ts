/**
 * Watchlist Hooks
 * TanStack Query hooks for watchlist operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';

// Types
export interface WatchlistFilm {
  id: string;
  tmdbId: number;
  title: string;
  year: string | null;
  poster: string | null;
}

export interface WatchlistItem {
  id: string;
  userId: string;
  filmId: string;
  addedAt: string;
  film: WatchlistFilm;
}

interface WatchlistResponse {
  items: WatchlistItem[];
  count: number;
}

interface AddToWatchlistInput {
  filmId: string;
}

interface CheckWatchlistResponse {
  isInWatchlist: boolean;
}

/**
 * Hook to get the current user's watchlist
 */
export function useWatchlist() {
  return useQuery({
    queryKey: ['watchlist'],
    queryFn: async () => {
      const response = await api.get<WatchlistResponse>('/api/v1/watchlist');
      return response;
    },
  });
}

/**
 * Hook to check if a film is in the user's watchlist
 */
export function useIsInWatchlist(filmId: string | undefined) {
  return useQuery({
    queryKey: ['watchlist', 'check', filmId],
    queryFn: async () => {
      if (!filmId) return { isInWatchlist: false };
      const response = await api.get<CheckWatchlistResponse>(`/api/v1/watchlist/check/${filmId}`);
      return response;
    },
    enabled: !!filmId,
  });
}

/**
 * Hook to add a film to the watchlist
 */
export function useAddToWatchlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: AddToWatchlistInput) => {
      return api.post('/api/v1/watchlist', input);
    },
    onSuccess: (_data, variables) => {
      // Invalidate watchlist queries
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
      queryClient.invalidateQueries({ queryKey: ['watchlist', 'check', variables.filmId] });
    },
    onError: (error, variables) => {
      console.error('[Watchlist] Failed to add film:', variables.filmId, error);
    },
  });
}

/**
 * Hook to remove a film from the watchlist
 */
export function useRemoveFromWatchlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (filmId: string) => {
      return api.delete(`/api/v1/watchlist/${filmId}`);
    },
    onSuccess: (_data, filmId) => {
      // Invalidate watchlist queries
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
      queryClient.invalidateQueries({ queryKey: ['watchlist', 'check', filmId] });
    },
  });
}

/**
 * Hook to toggle watchlist status (add if not in, remove if in)
 */
export function useToggleWatchlist() {
  const addMutation = useAddToWatchlist();
  const removeMutation = useRemoveFromWatchlist();

  const toggleWatchlist = async (filmId: string, isCurrentlyInWatchlist: boolean) => {
    if (isCurrentlyInWatchlist) {
      await removeMutation.mutateAsync(filmId);
    } else {
      await addMutation.mutateAsync({ filmId });
    }
  };

  return {
    toggleWatchlist,
    isLoading: addMutation.isPending || removeMutation.isPending,
  };
}
