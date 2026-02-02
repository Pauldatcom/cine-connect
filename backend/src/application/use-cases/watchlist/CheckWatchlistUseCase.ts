/**
 * Check Watchlist Use Case
 * Handles business logic for checking if a film is in user's watchlist
 */

import { inject, injectable } from 'tsyringe';

import { IWatchlistRepository } from '../../../domain/repositories/IWatchlistRepository.js';

export interface CheckWatchlistInput {
  userId: string;
  filmId: string;
}

export interface CheckWatchlistOutput {
  isInWatchlist: boolean;
}

@injectable()
export class CheckWatchlistUseCase {
  constructor(
    @inject(IWatchlistRepository as symbol)
    private watchlistRepository: IWatchlistRepository
  ) {}

  async execute(input: CheckWatchlistInput): Promise<CheckWatchlistOutput> {
    const isInWatchlist = await this.watchlistRepository.isInWatchlist(input.userId, input.filmId);

    return { isInWatchlist };
  }
}
