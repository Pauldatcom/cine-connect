/**
 * Remove From Watchlist Use Case
 * Handles business logic for removing a film from user's watchlist
 */

import { inject, injectable } from 'tsyringe';

import { IWatchlistRepository } from '../../../domain/repositories/IWatchlistRepository.js';

export interface RemoveFromWatchlistInput {
  userId: string;
  filmId: string;
}

export interface RemoveFromWatchlistOutput {
  success: boolean;
}

export class RemoveFromWatchlistError extends Error {
  constructor(
    message: string,
    public code: 'NOT_IN_WATCHLIST'
  ) {
    super(message);
    this.name = 'RemoveFromWatchlistError';
  }
}

@injectable()
export class RemoveFromWatchlistUseCase {
  constructor(
    @inject(IWatchlistRepository as symbol)
    private watchlistRepository: IWatchlistRepository
  ) {}

  async execute(input: RemoveFromWatchlistInput): Promise<RemoveFromWatchlistOutput> {
    // Check if in watchlist
    const existing = await this.watchlistRepository.findByUserAndFilm(input.userId, input.filmId);
    if (!existing) {
      throw new RemoveFromWatchlistError('Film is not in your watchlist', 'NOT_IN_WATCHLIST');
    }

    // Remove from watchlist
    const removed = await this.watchlistRepository.remove(input.userId, input.filmId);

    return { success: removed };
  }
}
