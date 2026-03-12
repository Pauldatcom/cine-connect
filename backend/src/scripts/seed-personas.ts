/**
 * Seed fake users (personas) with reviews, watchlist entries, friends, and messages.
 * Idempotent: skips users that already exist (by email).
 * Films: uses ITmdbClient + RegisterFilmUseCase (no direct TMDb fetch or db insert for films).
 *
 * Usage: pnpm db:seed
 * Env: DATABASE_URL, TMDB_API_KEY (optional, for ensuring films exist)
 */

import bcrypt from 'bcryptjs';
import 'dotenv/config';
import { eq } from 'drizzle-orm';
import 'reflect-metadata';

import { RegisterFilmUseCase } from '../application/use-cases/films/index.js';
import { db, schema } from '../db/index.js';
import { IFilmRepository } from '../domain/repositories/IFilmRepository.js';
import type { ITmdbClient } from '../domain/repositories/ITmdbClient.js';
import { ITmdbClient as ITmdbClientToken } from '../domain/repositories/ITmdbClient.js';
import { container, registerDependencies, resolve } from '../infrastructure/container.js';

const DEFAULT_PASSWORD = 'Persona123!';

/** Personas with human-like names for realistic demo data (seed). */
const PERSONAS = [
  { username: 'marie_dupont', email: 'marie.dupont@personas.cineconnect.test' },
  { username: 'thomas_martin', email: 'thomas.martin@personas.cineconnect.test' },
  { username: 'lea_bernard', email: 'lea.bernard@personas.cineconnect.test' },
  { username: 'hugo_petit', email: 'hugo.petit@personas.cineconnect.test' },
  { username: 'emma_laurent', email: 'emma.laurent@personas.cineconnect.test' },
  { username: 'lucas_roux', email: 'lucas.roux@personas.cineconnect.test' },
  { username: 'chloe_moreau', email: 'chloe.moreau@personas.cineconnect.test' },
  { username: 'nathan_simon', email: 'nathan.simon@personas.cineconnect.test' },
  { username: 'manon_michel', email: 'manon.michel@personas.cineconnect.test' },
  { username: 'jules_lefebvre', email: 'jules.lefebvre@personas.cineconnect.test' },
];

const REVIEW_PHRASES = [
  'Un classique indémodable.',
  'Très bon film, je recommande.',
  'Un peu long mais magnifique.',
  'Coup de cœur de l’année.',
  'Belle surprise, à voir.',
  'Pas mal du tout.',
  'Les acteurs sont excellents.',
  'Scénario solide et réalisation soignée.',
];

const MESSAGE_PHRASES = [
  'Salut, tu as vu le dernier ?',
  'Tu recommandes quoi ce soir ?',
  'On regarde un film ce week-end ?',
  'J’ai adoré celui-là aussi.',
  'Tu as vu la suite ?',
  'Bonne idée de film !',
];

// TMDb IDs to ensure we have at least a few films
const TMDB_IDS = [550, 155, 27205, 238, 424, 13, 680, 78, 122, 8587];

async function ensureFilms(): Promise<{ id: string }[]> {
  registerDependencies();
  const filmRepo = resolve<IFilmRepository>(IFilmRepository as symbol);
  let result = await filmRepo.findAllPaginated({ page: 1, limit: 50 });
  if (result.items.length >= 10) return result.items.map((f) => ({ id: f.id }));

  const apiKey = process.env.TMDB_API_KEY || process.env.VITE_TMDB_API_KEY || '';
  if (!apiKey) {
    console.warn('No TMDB_API_KEY: using existing films only.');
    return result.items.map((f) => ({ id: f.id }));
  }

  const tmdbClient = resolve<ITmdbClient>(ITmdbClientToken as symbol);
  const registerFilm = container.resolve(RegisterFilmUseCase);

  for (const tmdbId of TMDB_IDS) {
    const existing = await filmRepo.findByTmdbId(tmdbId);
    if (existing) continue;
    try {
      const movie = await tmdbClient.getMovieById(tmdbId);
      if (!movie?.id || !movie.title) continue;
      const year = movie.release_date?.slice(0, 4) ?? undefined;
      const poster = movie.poster_path
        ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
        : undefined;
      await registerFilm.execute({
        tmdbId: movie.id,
        title: String(movie.title).slice(0, 500),
        year,
        poster,
        plot: movie.overview?.slice(0, 2000) ?? undefined,
      });
      result = await filmRepo.findAllPaginated({ page: 1, limit: 50 });
    } catch (e) {
      console.warn(`Skip TMDb ${tmdbId}:`, e);
    }
  }

  result = await filmRepo.findAllPaginated({ page: 1, limit: 50 });
  return result.items.map((f) => ({ id: f.id }));
}

async function seedPersonas(): Promise<void> {
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 12);
  const created: { id: string; username: string }[] = [];

  for (const p of PERSONAS) {
    const existing = await db.query.users.findFirst({
      where: eq(schema.users.email, p.email),
      columns: { id: true, username: true },
    });
    if (existing) {
      created.push({ id: existing.id, username: existing.username });
      continue;
    }
    const [inserted] = await db
      .insert(schema.users)
      .values({
        email: p.email,
        username: p.username,
        passwordHash,
      })
      .returning({ id: schema.users.id, username: schema.users.username });
    if (inserted) {
      created.push({ id: inserted.id, username: inserted.username });
      console.log('Created user:', p.username);
    }
  }

  const filmRows = await ensureFilms();
  const filmIds = filmRows.map((f) => f.id);
  if (filmIds.length === 0) {
    console.warn('No films in DB: skipping reviews and watchlist.');
  } else {
    for (let i = 0; i < created.length; i++) {
      const user = created[i];
      if (!user) continue;
      const numReviews = 2 + (i % 3);
      const numWatch = 1 + (i % 4);
      const existingReviews = await db.query.reviews.findMany({
        where: eq(schema.reviews.userId, user.id),
        columns: { filmId: true },
      });
      const alreadyReviewed = new Set(existingReviews.map((x) => x.filmId));
      for (let r = 0; r < numReviews; r++) {
        const filmId = filmIds[(i + r) % filmIds.length];
        if (!filmId || alreadyReviewed.has(filmId)) continue;
        alreadyReviewed.add(filmId);
        await db.insert(schema.reviews).values({
          userId: user.id,
          filmId,
          rating: 3 + (r % 3),
          comment: REVIEW_PHRASES[(i + r) % REVIEW_PHRASES.length],
        });
      }
      const existingWatchlist = await db.query.watchlists.findMany({
        where: eq(schema.watchlists.userId, user.id),
        columns: { filmId: true },
      });
      const alreadyInWatchlist = new Set(existingWatchlist.map((x) => x.filmId));
      for (let w = 0; w < numWatch; w++) {
        const filmId = filmIds[(i + w + 1) % filmIds.length];
        if (!filmId || alreadyInWatchlist.has(filmId)) continue;
        alreadyInWatchlist.add(filmId);
        await db.insert(schema.watchlists).values({
          userId: user.id,
          filmId,
        });
      }
    }
    console.log('Reviews and watchlist entries created.');
  }

  for (let i = 0; i < created.length; i++) {
    const userA = created[i];
    if (!userA) continue;
    for (let j = i + 1; j < Math.min(i + 3, created.length); j++) {
      const userB = created[j];
      if (!userB) continue;
      const a = userA.id;
      const b = userB.id;
      const existingFriends = await db.query.friends.findMany({
        where: eq(schema.friends.senderId, a),
        columns: { receiverId: true },
      });
      if (existingFriends.some((f) => f.receiverId === b)) continue;
      await db.insert(schema.friends).values({
        senderId: a,
        receiverId: b,
        status: 'accepted',
      });
    }
  }
  console.log('Friendships created.');

  for (let i = 0; i < created.length; i++) {
    const j = (i + 1) % created.length;
    const sender = created[i];
    const receiver = created[j];
    if (!sender || !receiver) continue;
    const phrase = MESSAGE_PHRASES[i % MESSAGE_PHRASES.length] ?? MESSAGE_PHRASES[0] ?? 'Hi';
    await db.insert(schema.messages).values({
      senderId: sender.id,
      receiverId: receiver.id,
      content: phrase,
    });
  }
  console.log('Messages created.');

  console.log(`Seed done. ${created.length} personas (password: ${DEFAULT_PASSWORD}).`);
}

seedPersonas().catch((err) => {
  console.error(err);
  process.exit(1);
});
