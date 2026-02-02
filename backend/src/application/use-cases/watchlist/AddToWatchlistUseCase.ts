/**
 * Add To Watchlist Use Case
 * Handles business logic for adding a film to user's watchlist
 */

import { inject, injectable } from 'tsyringe';

import { IWatchlistRepository } from '../../../domain/repositories/IWatchlistRepository.js';
import { IFilmRepository } from '../../../domain/repositories/IFilmRepository.js';
import { WatchlistItem } from '../../../domain/entities/Watchlist.js';

export interface AddToWatchlistInput {
  userId: string;
  filmId: string;
}

export interface AddToWatchlistOutput {
  watchlistItem: WatchlistItem;
}

export class AddToWatchlistError extends Error {
  constructor(
    message: string,
    public code: 'FILM_NOT_FOUND' | 'ALREADY_IN_WATCHLIST'
  ) {
    super(message);
    this.name = 'AddToWatchlistError';
  }
}

@injectable()
export class AddToWatchlistUseCase {
  constructor(
    @inject(IWatchlistRepository as symbol)
    private watchlistRepository: IWatchlistRepository,
    @inject(IFilmRepository as symbol)
    private filmRepository: IFilmRepository
  ) {}

  async execute(input: AddToWatchlistInput): Promise<AddToWatchlistOutput> {
    // Check if film exists
    const film = await this.filmRepository.findById(input.filmId);
    if (!film) {
      throw new AddToWatchlistError('Film not found', 'FILM_NOT_FOUND');
    }

    // Check if already in watchlist
    const existing = await this.watchlistRepository.findByUserAndFilm(input.userId, input.filmId);
    if (existing) {
      throw new AddToWatchlistError('Film is already in your watchlist', 'ALREADY_IN_WATCHLIST');
    }

    // Add to watchlist
    const watchlistItem = await this.watchlistRepository.add({
      userId: input.userId,
      filmId: input.filmId,
    });

    return { watchlistItem };
  }
}
