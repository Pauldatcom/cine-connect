/**
 * Get User Watchlist Use Case
 * Handles business logic for retrieving user's watchlist
 */

import { inject, injectable } from 'tsyringe';

import { IWatchlistRepository } from '../../../domain/repositories/IWatchlistRepository.js';
import type { WatchlistItemWithFilm } from '../../../domain/entities/Watchlist.js';

export interface GetUserWatchlistInput {
  userId: string;
}

export interface GetUserWatchlistOutput {
  items: WatchlistItemWithFilm[];
  count: number;
}

@injectable()
export class GetUserWatchlistUseCase {
  constructor(
    @inject(IWatchlistRepository as symbol)
    private watchlistRepository: IWatchlistRepository
  ) {}

  async execute(input: GetUserWatchlistInput): Promise<GetUserWatchlistOutput> {
    const items = await this.watchlistRepository.findByUserId(input.userId);
    const count = await this.watchlistRepository.countByUserId(input.userId);

    return { items, count };
  }
}
