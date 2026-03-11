/**
 * Film Repository Interface
 * Defines the contract for film data access
 */

import type { Film, CreateFilmProps } from '../entities/Film.js';

export interface IFilmRepository {
  /**
   * Find film by internal UUID
   */
  findById(id: string): Promise<Film | null>;

  /**
   * Find film by TMDb ID
   */
  findByTmdbId(tmdbId: number): Promise<Film | null>;

  /**
   * Create a new film
   */
  create(data: CreateFilmProps): Promise<Film>;

  /**
   * Create film if it doesn't exist, otherwise return existing
   */
  upsertByTmdbId(data: CreateFilmProps): Promise<Film>;

  /**
   * Search films by title
   */
  searchByTitle(query: string, limit?: number): Promise<Film[]>;

  /**
   * Get films by genre
   */
  findByGenre(genre: string, limit?: number, offset?: number): Promise<Film[]>;

  /**
   * Get films paginated with optional search and genre filter
   */
  findAllPaginated(options: {
    page: number;
    limit: number;
    search?: string;
    genre?: string;
  }): Promise<{ items: Film[]; page: number; pageSize: number }>;
}

// Token for dependency injection
export const IFilmRepository = Symbol.for('IFilmRepository');
