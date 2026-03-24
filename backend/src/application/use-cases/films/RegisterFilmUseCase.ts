/**
 * Register Film Use Case
 * Upserts a film by TMDb ID; returns the film and whether it was created.
 */

import { inject, injectable } from 'tsyringe';

import type { CreateFilmProps } from '../../../domain/entities/Film.js';
import { Film } from '../../../domain/entities/Film.js';
import { IFilmRepository } from '../../../domain/repositories/IFilmRepository.js';

export interface RegisterFilmOutput {
  film: Film;
  created: boolean;
}

@injectable()
export class RegisterFilmUseCase {
  constructor(
    @inject(IFilmRepository as symbol)
    private filmRepository: IFilmRepository
  ) {}

  async execute(data: CreateFilmProps): Promise<RegisterFilmOutput> {
    const existing = await this.filmRepository.findByTmdbId(data.tmdbId);
    if (existing) {
      return { film: existing, created: false };
    }
    const film = await this.filmRepository.upsertByTmdbId(data);
    return { film, created: true };
  }
}
