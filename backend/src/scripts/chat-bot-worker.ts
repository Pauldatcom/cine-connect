/**
 * Optional worker: simulates real user activity (messages, reviews, watchlist).
 * Uses REST: login to get JWT, then calls messages, reviews, watchlist APIs.
 *
 * Usage:
 *   pnpm run db:chat-bot              # run every 5 minutes
 *   pnpm run db:chat-bot -- --once    # one random action and exit
 *
 * Env: DATABASE_URL, BACKEND_URL (default http://localhost:3000), PERSONA_PASSWORD (default Persona123!)
 *
 * Requires: PostgreSQL running, backend API running, persona users (pnpm db:seed), and films in DB (pnpm db:sync-films).
 */

import { COMMENT_MAX_LENGTH, MAX_RATING, MIN_RATING } from '@cine-connect/shared';
import 'dotenv/config';
import { inArray } from 'drizzle-orm';

import { db, schema } from '../db/index.js';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';
const PERSONA_PASSWORD = process.env.PERSONA_PASSWORD || 'Persona123!';

const BOT_PREFIX = '[chat-bot]';

/** Get a readable cause from fetch/network errors (Node often puts the real error in err.cause). */
function getCauseMessage(err: unknown): string | undefined {
  if (err && typeof err === 'object' && 'cause' in err) {
    const cause = (err as { cause: unknown }).cause;
    if (cause instanceof Error && cause.message) return cause.message;
    if (typeof cause === 'string') return cause;
  }
  return undefined;
}

function getCauseCode(err: unknown): string | undefined {
  const cause =
    err && typeof err === 'object' && 'cause' in err ? (err as { cause: unknown }).cause : null;
  if (cause && typeof cause === 'object' && 'code' in cause)
    return (cause as { code: string }).code as string;
  return undefined;
}

const botLog = {
  ok(msg: string): void {
    console.log(`${BOT_PREFIX} \x1b[32mOK\x1b[0m ${msg}`);
  },
  fail(msg: string, err?: unknown): void {
    console.error(`${BOT_PREFIX} \x1b[31mFAIL\x1b[0m ${msg}`);
    if (err instanceof Error && err.message) {
      console.error(`${BOT_PREFIX}   ${err.message}`);
      // "fetch failed" is generic; surface the real cause (ECONNREFUSED, ENOTFOUND, etc.)
      const causeMsg = getCauseMessage(err);
      const code = getCauseCode(err);
      if (err.message === 'fetch failed' && (causeMsg || code)) {
        const detail = code ? `${code}${causeMsg ? `: ${causeMsg}` : ''}` : causeMsg;
        console.error(`${BOT_PREFIX}   (cause) ${detail}`);
      }
    }
  },
  skip(msg: string): void {
    console.warn(`${BOT_PREFIX} \x1b[33mSKIP\x1b[0m ${msg}`);
  },
  info(msg: string): void {
    console.log(`${BOT_PREFIX} ${msg}`);
  },
};
/** Must match PERSONAS emails in seed-personas.ts. */
const PERSONA_EMAILS = [
  'marie.dupont@personas.cineconnect.test',
  'thomas.martin@personas.cineconnect.test',
  'lea.bernard@personas.cineconnect.test',
  'hugo.petit@personas.cineconnect.test',
  'emma.laurent@personas.cineconnect.test',
  'lucas.roux@personas.cineconnect.test',
  'chloe.moreau@personas.cineconnect.test',
  'nathan.simon@personas.cineconnect.test',
  'manon.michel@personas.cineconnect.test',
  'jules.lefebvre@personas.cineconnect.test',
];

const PHRASES = [
  'Salut, tu as vu le dernier ?',
  'Tu recommandes quoi ce soir ?',
  'On regarde un film ce week-end ?',
  "J'ai adoré celui-là aussi.",
  'Tu as vu la suite ?',
  'Bonne idée de film !',
  'Celui-là est dans ma watchlist.',
  'Tu as aimé ?',
];

/** Short review comments (used when creating a review). */
const REVIEW_PHRASES = [
  'Très bon film, je recommande.',
  'Un classique à revoir.',
  'Bien mais un peu long.',
  'Coup de cœur !',
  'Sympa pour un dimanche.',
  'Pas mal du tout.',
  'Un peu déçu sur la fin.',
  'Excellent, à voir absolument.',
];

async function getPersonaUsers(): Promise<{ id: string; email: string }[]> {
  const rows = await db.query.users.findMany({
    where: inArray(schema.users.email, PERSONA_EMAILS),
    columns: { id: true, email: true },
  });
  return rows;
}

/** Fetch up to 100 film IDs from DB (for reviews and watchlist actions). */
async function getFilmIds(): Promise<string[]> {
  const rows = await db.select({ id: schema.films.id }).from(schema.films).limit(100);
  return rows.map((r) => r.id);
}

/** Fail fast if the backend API is not reachable (e.g. not running). */
async function checkBackend(): Promise<void> {
  try {
    const res = await fetch(`${BACKEND_URL}/health`);
    if (!res.ok) {
      throw new Error(
        `Backend at ${BACKEND_URL} returned ${res.status}. Start the API server: pnpm dev (or pnpm --filter @cine-connect/backend dev)`
      );
    }
    botLog.ok(`Backend reachable at ${BACKEND_URL}`);
  } catch (err) {
    if (err instanceof Error && (err as NodeJS.ErrnoException).code === 'ECONNREFUSED') {
      throw new Error(
        `Backend not reachable at ${BACKEND_URL}. Start the API server: pnpm dev (or pnpm --filter @cine-connect/backend dev)`
      );
    }
    throw err;
  }
}

async function login(email: string, password: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch(`${BACKEND_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
  } catch (err) {
    const cause = err instanceof Error ? err.cause : undefined;
    const code =
      cause && typeof cause === 'object' && 'code' in cause
        ? (cause as { code: string }).code
        : undefined;
    const hint =
      code === 'ECONNREFUSED' || code === 'ENOTFOUND'
        ? ` Is the backend running at ${BACKEND_URL}? Start it: pnpm dev (or pnpm --filter @cine-connect/backend dev)`
        : '';
    throw new Error(
      `Login request failed (network): ${err instanceof Error ? err.message : String(err)}.${hint}`,
      { cause: err }
    );
  }
  if (!res.ok) {
    const hint =
      res.status === 404
        ? ` Backend may not be running. Start it: pnpm dev (or pnpm --filter @cine-connect/backend dev)`
        : '';
    throw new Error(`Login failed: ${res.status}.${hint}`);
  }
  const json = (await res.json()) as { data: { accessToken: string } };
  return json.data.accessToken;
}

async function sendMessage(
  accessToken: string,
  receiverId: string,
  content: string
): Promise<void> {
  const res = await fetch(`${BACKEND_URL}/api/v1/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ receiverId, content }),
  });
  if (!res.ok) throw new Error(`Send message failed: ${res.status}`);
}

/** Mark messages from partner (senderId) as read for the current user (receiver). */
async function markMessagesRead(accessToken: string, partnerId: string): Promise<void> {
  const res = await fetch(`${BACKEND_URL}/api/v1/messages/${partnerId}/read`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Mark messages read failed: ${res.status}`);
}

async function createReview(
  accessToken: string,
  filmId: string,
  rating: number,
  comment?: string
): Promise<void> {
  const body: { filmId: string; rating: number; comment?: string } = { filmId, rating };
  if (comment) body.comment = comment.slice(0, COMMENT_MAX_LENGTH);
  const res = await fetch(`${BACKEND_URL}/api/v1/reviews`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Create review failed: ${res.status} ${text}`);
  }
}

async function addToWatchlist(accessToken: string, filmId: string): Promise<void> {
  const res = await fetch(`${BACKEND_URL}/api/v1/watchlist`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ filmId }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Add to watchlist failed: ${res.status} ${text}`);
  }
}

async function removeFromWatchlist(accessToken: string, filmId: string): Promise<void> {
  const res = await fetch(`${BACKEND_URL}/api/v1/watchlist/${filmId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Remove from watchlist failed: ${res.status} ${text}`);
  }
}

async function getWatchlist(accessToken: string): Promise<{ filmId: string }[]> {
  const res = await fetch(`${BACKEND_URL}/api/v1/watchlist`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Get watchlist failed: ${res.status}`);
  const json = (await res.json()) as { data: { items: { filmId: string }[] } };
  return json.data.items ?? [];
}

function pickPhrase(): string {
  const idx = Math.floor(Math.random() * PHRASES.length);
  return PHRASES[idx] ?? PHRASES[0] ?? '';
}

function pickReviewPhrase(): string | undefined {
  if (Math.random() < 0.6) return undefined; // 60% no comment
  const idx = Math.floor(Math.random() * REVIEW_PHRASES.length);
  return REVIEW_PHRASES[idx];
}

function randomRating(): number {
  return MIN_RATING + Math.floor(Math.random() * (MAX_RATING - MIN_RATING + 1));
}

type BotAction = 'message' | 'review' | 'watchlist_add' | 'watchlist_remove';

const ACTION_WEIGHTS: { action: BotAction; weight: number }[] = [
  { action: 'message', weight: 35 },
  { action: 'review', weight: 30 },
  { action: 'watchlist_add', weight: 25 },
  { action: 'watchlist_remove', weight: 10 },
];

function pickAction(): BotAction {
  const total = ACTION_WEIGHTS.reduce((s, w) => s + w.weight, 0);
  let r = Math.random() * total;
  for (const { action, weight } of ACTION_WEIGHTS) {
    r -= weight;
    if (r <= 0) return action;
  }
  const fallback = ACTION_WEIGHTS[0];
  if (!fallback) throw new Error('ACTION_WEIGHTS is empty');
  return fallback.action;
}

async function doMessage(
  users: { id: string; email: string }[],
  _filmIds: string[]
): Promise<void> {
  if (users.length < 2) {
    botLog.skip('Message: need at least 2 persona users.');
    return;
  }
  const i = Math.floor(Math.random() * users.length);
  let j = Math.floor(Math.random() * users.length);
  while (j === i) j = Math.floor(Math.random() * users.length);
  const userA = users[i];
  const userB = users[j];
  if (!userA || !userB) return;
  let token: string;
  try {
    token = await login(userA.email, PERSONA_PASSWORD);
  } catch (err) {
    botLog.fail(`Message: login as ${userA.email}`, err);
    return;
  }
  try {
    await sendMessage(token, userB.id, pickPhrase());
    botLog.ok(`Message: ${userA.email} -> ${userB.email}`);
  } catch (err) {
    botLog.fail(`Message: ${userA.email} -> ${userB.email}`, err);
    return;
  }
  // Simulate receiver opening the conversation: call mark-as-read (validates PATCH endpoint)
  let tokenB: string;
  try {
    tokenB = await login(userB.email, PERSONA_PASSWORD);
  } catch (err) {
    botLog.fail(`Message mark-read: login as ${userB.email}`, err);
    return;
  }
  try {
    await markMessagesRead(tokenB, userA.id);
    botLog.ok(`Message mark-read: ${userB.email} marked messages from ${userA.email} as read`);
  } catch (err) {
    botLog.fail(`Message mark-read: ${userB.email}`, err);
  }
}

async function doReview(users: { id: string; email: string }[], filmIds: string[]): Promise<void> {
  if (filmIds.length === 0) {
    botLog.skip('Review: no films in DB. Run pnpm db:sync-films.');
    return;
  }
  const user = users[Math.floor(Math.random() * users.length)];
  const filmId = filmIds[Math.floor(Math.random() * filmIds.length)];
  if (!user || !filmId) return;
  let token: string;
  try {
    token = await login(user.email, PERSONA_PASSWORD);
  } catch (err) {
    botLog.fail(`Review: login as ${user.email}`, err);
    return;
  }
  const rating = randomRating();
  const comment = pickReviewPhrase();
  try {
    await createReview(token, filmId, rating, comment);
    botLog.ok(`Review: ${user.email} rated film ${filmId.slice(0, 8)}… ${rating}/10`);
  } catch (err) {
    if (err instanceof Error && err.message.includes('409')) {
      botLog.skip(`Review: ${user.email} already reviewed this film.`);
      return;
    }
    botLog.fail(`Review: ${user.email} film ${filmId.slice(0, 8)}…`, err);
  }
}

async function doWatchlistAdd(
  users: { id: string; email: string }[],
  filmIds: string[]
): Promise<void> {
  if (filmIds.length === 0) {
    botLog.skip('Watchlist add: no films in DB. Run pnpm db:sync-films.');
    return;
  }
  const user = users[Math.floor(Math.random() * users.length)];
  const filmId = filmIds[Math.floor(Math.random() * filmIds.length)];
  if (!user || !filmId) return;
  let token: string;
  try {
    token = await login(user.email, PERSONA_PASSWORD);
  } catch (err) {
    botLog.fail(`Watchlist add: login as ${user.email}`, err);
    return;
  }
  try {
    await addToWatchlist(token, filmId);
    botLog.ok(`Watchlist add: ${user.email} added film ${filmId.slice(0, 8)}…`);
  } catch (err) {
    if (err instanceof Error && err.message.includes('409')) {
      botLog.skip(`Watchlist add: ${user.email} already has this film.`);
      return;
    }
    botLog.fail(`Watchlist add: ${user.email} film ${filmId.slice(0, 8)}…`, err);
  }
}

async function doWatchlistRemove(
  users: { id: string; email: string }[],
  _filmIds: string[]
): Promise<void> {
  const user = users[Math.floor(Math.random() * users.length)];
  if (!user) return;
  let token: string;
  try {
    token = await login(user.email, PERSONA_PASSWORD);
  } catch (err) {
    botLog.fail(`Watchlist remove: login as ${user.email}`, err);
    return;
  }
  const items = await getWatchlist(token);
  if (items.length === 0) {
    botLog.skip(`Watchlist remove: ${user.email} has an empty watchlist.`);
    return;
  }
  const toRemove = items[Math.floor(Math.random() * items.length)];
  if (!toRemove) return;
  try {
    await removeFromWatchlist(token, toRemove.filmId);
    botLog.ok(`Watchlist remove: ${user.email} removed film ${toRemove.filmId.slice(0, 8)}…`);
  } catch (err) {
    if (err instanceof Error && err.message.includes('404')) {
      botLog.skip(`Watchlist remove: ${user.email} film not in watchlist.`);
      return;
    }
    botLog.fail(`Watchlist remove: ${user.email}`, err);
  }
}

async function runOnce(): Promise<void> {
  const action = pickAction();
  botLog.info(`Cycle started (action: ${action})`);

  let users: { id: string; email: string }[];
  try {
    users = await getPersonaUsers();
    botLog.ok(`Loaded ${users.length} persona users`);
  } catch (err) {
    botLog.fail('Load persona users', err);
    return;
  }

  if (users.length === 0) {
    botLog.skip('No persona users. Run pnpm db:seed first.');
    return;
  }

  let filmIds: string[] = [];
  if (action === 'review' || action === 'watchlist_add') {
    try {
      filmIds = await getFilmIds();
      if (filmIds.length > 0) botLog.ok(`Loaded ${filmIds.length} film IDs`);
    } catch (err) {
      botLog.fail('Load film IDs', err);
      if (action === 'review' || action === 'watchlist_add') return;
    }
  }

  switch (action) {
    case 'message':
      await doMessage(users, filmIds);
      break;
    case 'review':
      await doReview(users, filmIds);
      break;
    case 'watchlist_add':
      await doWatchlistAdd(users, filmIds);
      break;
    case 'watchlist_remove':
      await doWatchlistRemove(users, filmIds);
      break;
  }
}

const INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

async function main(): Promise<void> {
  await checkBackend();

  const once = process.argv.includes('--once');
  if (once) {
    await runOnce();
    process.exit(0);
  }
  botLog.info(`Running every ${INTERVAL_MS / 60000} min: messages, reviews, watchlist add/remove.`);
  await runOnce();
  setInterval(runOnce, INTERVAL_MS);
}

function isConnectionRefused(err: unknown): boolean {
  if (
    err instanceof Error &&
    'code' in err &&
    (err as NodeJS.ErrnoException).code === 'ECONNREFUSED'
  )
    return true;
  if (
    err &&
    typeof err === 'object' &&
    'code' in err &&
    (err as { code: string }).code === 'ECONNREFUSED'
  )
    return true;
  // pg can throw AggregateError with ECONNREFUSED in errors[]
  if (
    err &&
    typeof err === 'object' &&
    'errors' in err &&
    Array.isArray((err as AggregateError).errors)
  ) {
    return (err as AggregateError).errors.some((e) => isConnectionRefused(e));
  }
  return false;
}

main().catch((err) => {
  if (isConnectionRefused(err)) {
    console.error('Cannot connect to PostgreSQL (ECONNREFUSED on localhost:5432).');
    console.error('Start the database first, e.g. from repo root: docker compose up -d postgres');
    process.exit(1);
  }
  console.error(err);
  process.exit(1);
});
