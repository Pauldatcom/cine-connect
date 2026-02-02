/**
 * Watchlist Repository Interface
 * Defines the contract for watchlist data access
 */

import type {
  WatchlistItem,
  CreateWatchlistItemProps,
  WatchlistItemWithFilm,
} from '../entities/Watchlist.js';

export interface IWatchlistRepository {
  /**
   * Find watchlist item by ID
   */
  findById(id: string): Promise<WatchlistItem | null>;

  /**
   * Find watchlist item by user and film
   */
  findByUserAndFilm(userId: string, filmId: string): Promise<WatchlistItem | null>;

  /**
   * Get all watchlist items for a user with film details
   */
  findByUserId(userId: string): Promise<WatchlistItemWithFilm[]>;

  /**
   * Check if a film is in user's watchlist
   */
  isInWatchlist(userId: string, filmId: string): Promise<boolean>;

  /**
   * Add a film to user's watchlist
   */
  add(data: CreateWatchlistItemProps): Promise<WatchlistItem>;

  /**
   * Remove a film from user's watchlist
   */
  remove(userId: string, filmId: string): Promise<boolean>;

  /**
   * Remove by ID
   */
  removeById(id: string): Promise<boolean>;

  /**
   * Count items in user's watchlist
   */
  countByUserId(userId: string): Promise<number>;
}

// Token for dependency injection
export const IWatchlistRepository = Symbol.for('IWatchlistRepository');
