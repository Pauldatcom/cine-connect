/**
 * Drizzle Watchlist Repository Implementation
 */

import { injectable } from 'tsyringe';
import { eq, and, count } from 'drizzle-orm';

import { db, schema } from '../../db/index.js';
import type { IWatchlistRepository } from '../../domain/repositories/IWatchlistRepository.js';
import {
  WatchlistItem,
  type CreateWatchlistItemProps,
  type WatchlistItemWithFilm,
} from '../../domain/entities/Watchlist.js';

@injectable()
export class DrizzleWatchlistRepository implements IWatchlistRepository {
  async findById(id: string): Promise<WatchlistItem | null> {
    const result = await db.query.watchlists.findFirst({
      where: eq(schema.watchlists.id, id),
    });

    return result ? this.toDomain(result) : null;
  }

  async findByUserAndFilm(userId: string, filmId: string): Promise<WatchlistItem | null> {
    const result = await db.query.watchlists.findFirst({
      where: and(eq(schema.watchlists.userId, userId), eq(schema.watchlists.filmId, filmId)),
    });

    return result ? this.toDomain(result) : null;
  }

  async findByUserId(userId: string): Promise<WatchlistItemWithFilm[]> {
    const results = await db.query.watchlists.findMany({
      where: eq(schema.watchlists.userId, userId),
      with: {
        film: true,
      },
      orderBy: (watchlists, { desc }) => [desc(watchlists.addedAt)],
    });

    return results.map((row) => ({
      id: row.id,
      userId: row.userId,
      filmId: row.filmId,
      addedAt: row.addedAt,
      film: {
        id: row.film.id,
        tmdbId: row.film.tmdbId,
        title: row.film.title,
        year: row.film.year,
        poster: row.film.poster,
        genre: row.film.genre ?? undefined,
      },
    }));
  }

  async isInWatchlist(userId: string, filmId: string): Promise<boolean> {
    const result = await db.query.watchlists.findFirst({
      where: and(eq(schema.watchlists.userId, userId), eq(schema.watchlists.filmId, filmId)),
    });

    return !!result;
  }

  async add(data: CreateWatchlistItemProps): Promise<WatchlistItem> {
    const [result] = await db
      .insert(schema.watchlists)
      .values({
        userId: data.userId,
        filmId: data.filmId,
      })
      .returning();

    if (!result) {
      throw new Error('Failed to add to watchlist');
    }

    return this.toDomain(result);
  }

  async remove(userId: string, filmId: string): Promise<boolean> {
    const result = await db
      .delete(schema.watchlists)
      .where(and(eq(schema.watchlists.userId, userId), eq(schema.watchlists.filmId, filmId)));

    return (result.rowCount ?? 0) > 0;
  }

  async removeById(id: string): Promise<boolean> {
    const result = await db.delete(schema.watchlists).where(eq(schema.watchlists.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async countByUserId(userId: string): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(schema.watchlists)
      .where(eq(schema.watchlists.userId, userId));

    return result?.count ?? 0;
  }

  private toDomain(row: typeof schema.watchlists.$inferSelect): WatchlistItem {
    return new WatchlistItem({
      id: row.id,
      userId: row.userId,
      filmId: row.filmId,
      addedAt: row.addedAt,
    });
  }
}
