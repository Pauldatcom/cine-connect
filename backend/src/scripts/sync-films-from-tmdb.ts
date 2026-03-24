/**
 * Sync films from TMDb Discover API into the database.
 * Covers 1940–today by year; rate limit and 429 retry in TmdbApiClient; resumable via cursor file.
 *
 * Usage:
 *   pnpm db:sync-films              # full historical sync (resumable)
 *   pnpm db:sync-films --recent     # only now_playing, upcoming, popular (few pages)
 *
 * Env: DATABASE_URL, TMDB_API_KEY (or VITE_TMDB_API_KEY)
 */

import 'reflect-metadata';
import 'dotenv/config';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

import { container, registerDependencies, resolve } from '../infrastructure/container.js';
import { db } from '../db/index.js';
import type { ITmdbClient } from '../domain/repositories/ITmdbClient.js';
import { ITmdbClient as ITmdbClientToken } from '../domain/repositories/ITmdbClient.js';
import { RegisterFilmUseCase } from '../application/use-cases/films/index.js';

const CURSOR_FILE = join(process.cwd(), '.sync-films-cursor.json');

/**
 * Turn any thrown value (including AggregateError from pg) into a string for logging.
 * pg can throw AggregateError with ECONNREFUSED etc. in .errors[]; we want to see the real cause.
 */
function errorMessage(err: unknown): string {
  if (err instanceof Error && err.name === 'AggregateError' && 'errors' in err) {
    const agg = err as AggregateError;
    const parts = Array.isArray(agg.errors)
      ? agg.errors.map((e) => (e instanceof Error ? e.message : String(e)))
      : [err.message];
    return `AggregateError(${parts.join('; ')})`;
  }
  if (err instanceof Error) return err.message;
  return String(err);
}

type Cursor = { lastYear: number; lastPage: number };

function readCursor(): Cursor | null {
  if (!existsSync(CURSOR_FILE)) return null;
  try {
    const data = readFileSync(CURSOR_FILE, 'utf-8');
    return JSON.parse(data) as Cursor;
  } catch {
    return null;
  }
}

function writeCursor(c: Cursor): void {
  writeFileSync(CURSOR_FILE, JSON.stringify(c, null, 2));
}

function tmdbItemToCreateFilmProps(item: {
  id: number;
  title: string;
  release_date?: string;
  poster_path: string | null;
  overview?: string;
}) {
  const year = item.release_date?.slice(0, 4) ?? undefined;
  const poster = item.poster_path
    ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
    : undefined;
  return {
    tmdbId: item.id,
    title: item.title.slice(0, 500),
    year: year ?? undefined,
    poster,
    plot: item.overview?.slice(0, 2000) ?? undefined,
  };
}

/** Fail fast if DB is unreachable (e.g. cron without DATABASE_URL or Postgres down). */
async function ensureDbConnected(): Promise<void> {
  try {
    await db.execute('SELECT 1');
  } catch (err) {
    console.error('Database unreachable:', errorMessage(err));
    console.error(
      'Check DATABASE_URL and that Postgres is running (e.g. docker compose up -d postgres).'
    );
    process.exit(1);
  }
}

async function runFullSync(resume: boolean): Promise<void> {
  registerDependencies();
  await ensureDbConnected();
  const tmdbClient = resolve<ITmdbClient>(ITmdbClientToken as symbol);
  const registerFilm = container.resolve(RegisterFilmUseCase);

  const startYear = 1940;
  const endYear = new Date().getFullYear();

  let startFromYear = startYear;
  let startFromPage = 1;
  if (resume) {
    const cur = readCursor();
    if (cur && cur.lastYear >= startYear && cur.lastYear <= endYear) {
      startFromYear = cur.lastYear;
      startFromPage = cur.lastPage;
    }
  }

  let totalRegistered = 0;
  for (let year = startFromYear; year <= endYear; year++) {
    const firstPage = year === startFromYear ? startFromPage : 1;
    let page = firstPage;
    let totalPages = 1;

    do {
      const data = await tmdbClient.discoverByYear(year, page);
      totalPages = Math.min(data.total_pages, 500);

      for (const movie of data.results) {
        if (!movie.id || !movie.title) continue;
        try {
          const { created } = await registerFilm.execute(tmdbItemToCreateFilmProps(movie));
          if (created) totalRegistered++;
        } catch (err) {
          console.warn(`Skip film ${movie.id}: ${errorMessage(err)}`);
        }
      }

      writeCursor({ lastYear: year, lastPage: page });
      console.log(
        `Year ${year} page ${page}/${totalPages} (registered so far: ${totalRegistered})`
      );
      page++;
    } while (page <= totalPages);
  }

  console.log(`Full sync done. Total new films registered: ${totalRegistered}`);
}

async function runRecentSync(): Promise<void> {
  registerDependencies();
  await ensureDbConnected();
  const tmdbClient = resolve<ITmdbClient>(ITmdbClientToken as symbol);
  const registerFilm = container.resolve(RegisterFilmUseCase);

  const pagesPerEndpoint = 3;
  let totalRegistered = 0;

  for (const [label, fn] of [
    ['now_playing', (p: number) => tmdbClient.nowPlaying(p)],
    ['upcoming', (p: number) => tmdbClient.upcoming(p)],
    ['popular', (p: number) => tmdbClient.popular(p)],
  ] as const) {
    for (let page = 1; page <= pagesPerEndpoint; page++) {
      const data = await fn(page);
      for (const movie of data.results) {
        if (!movie.id || !movie.title) continue;
        try {
          const { created } = await registerFilm.execute(tmdbItemToCreateFilmProps(movie));
          if (created) totalRegistered++;
        } catch (err) {
          console.warn(`Skip film ${movie.id}: ${errorMessage(err)}`);
        }
      }
      console.log(`${label} page ${page} (new: ${totalRegistered})`);
    }
  }

  console.log(`Recent sync done. Total new films registered: ${totalRegistered}`);
}

async function main(): Promise<void> {
  const apiKey = process.env.TMDB_API_KEY || process.env.VITE_TMDB_API_KEY || '';
  if (!apiKey) {
    console.error('Set TMDB_API_KEY or VITE_TMDB_API_KEY in .env');
    process.exit(1);
  }

  const recentOnly = process.argv.includes('--recent');
  const noResume = process.argv.includes('--no-resume');

  if (recentOnly) {
    await runRecentSync();
  } else {
    await runFullSync(!noResume);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
