/**
 * Drizzle Film Repository Implementation
 */

import { injectable } from 'tsyringe';
import { and, desc, eq, ilike } from 'drizzle-orm';

import { db, schema } from '../../db/index.js';
import type { IFilmRepository } from '../../domain/repositories/IFilmRepository.js';
import { Film, type CreateFilmProps } from '../../domain/entities/Film.js';

@injectable()
export class DrizzleFilmRepository implements IFilmRepository {
  async findById(id: string): Promise<Film | null> {
    const result = await db.query.films.findFirst({
      where: eq(schema.films.id, id),
    });

    return result ? this.toDomain(result) : null;
  }

  async findByTmdbId(tmdbId: number): Promise<Film | null> {
    const result = await db.query.films.findFirst({
      where: eq(schema.films.tmdbId, tmdbId),
    });

    return result ? this.toDomain(result) : null;
  }

  async create(data: CreateFilmProps): Promise<Film> {
    const [result] = await db
      .insert(schema.films)
      .values({
        tmdbId: data.tmdbId,
        title: data.title,
        year: data.year ?? null,
        poster: data.poster ?? null,
        plot: data.plot ?? null,
        director: data.director ?? null,
        actors: data.actors ?? null,
        genre: data.genre ?? null,
        runtime: data.runtime ?? null,
        tmdbRating: data.tmdbRating ?? null,
      })
      .returning();

    if (!result) {
      throw new Error('Failed to create film');
    }

    return this.toDomain(result);
  }

  async upsertByTmdbId(data: CreateFilmProps): Promise<Film> {
    const existing = await this.findByTmdbId(data.tmdbId);
    if (existing) {
      return existing;
    }
    return this.create(data);
  }

  async searchByTitle(query: string, limit = 20): Promise<Film[]> {
    const results = await db.query.films.findMany({
      where: ilike(schema.films.title, `%${query}%`),
      limit,
    });

    return results.map((r) => this.toDomain(r));
  }

  async findByGenre(genre: string, limit = 20, offset = 0): Promise<Film[]> {
    const results = await db.query.films.findMany({
      where: ilike(schema.films.genre, `%${genre}%`),
      limit,
      offset,
    });

    return results.map((r) => this.toDomain(r));
  }

  async findAllPaginated(options: {
    page: number;
    limit: number;
    search?: string;
    genre?: string;
  }): Promise<{ items: Film[]; page: number; pageSize: number }> {
    const { page, limit, search, genre } = options;
    const offset = (page - 1) * limit;

    const conditions = [];
    if (search) {
      conditions.push(ilike(schema.films.title, `%${search}%`));
    }
    if (genre) {
      conditions.push(ilike(schema.films.genre, `%${genre}%`));
    }

    const results = await db.query.films.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      orderBy: [desc(schema.films.createdAt)],
      limit,
      offset,
    });

    return {
      items: results.map((r) => this.toDomain(r)),
      page,
      pageSize: limit,
    };
  }

  /**
   * Map Drizzle result to domain entity
   */
  private toDomain(row: typeof schema.films.$inferSelect): Film {
    return new Film({
      id: row.id,
      tmdbId: row.tmdbId,
      title: row.title,
      year: row.year,
      poster: row.poster,
      plot: row.plot,
      director: row.director,
      actors: row.actors,
      genre: row.genre,
      runtime: row.runtime,
      tmdbRating: row.tmdbRating,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
