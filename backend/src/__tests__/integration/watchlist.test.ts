/**
 * Watchlist Routes Integration Tests
 * Uses DI with mocked IWatchlistRepository and IFilmRepository
 */

import 'reflect-metadata';

import { Film } from '@/domain/entities/Film.js';
import { WatchlistItem } from '@/domain/entities/Watchlist.js';
import { IFilmRepository } from '@/domain/repositories/IFilmRepository.js';
import { IWatchlistRepository } from '@/domain/repositories/IWatchlistRepository.js';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { container } from 'tsyringe';
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { registerDependencies } from '@/infrastructure/container.js';
import { createTestServer, closeTestServer } from '@/__tests__/helpers/server.js';

const USER_ID = '11111111-1111-1111-1111-111111111111';
const FILM_ID = '22222222-2222-2222-2222-222222222222';
const OTHER_FILM_ID = '33333333-3333-3333-3333-333333333333';
const WATCHLIST_ITEM_ID = '44444444-4444-4444-4444-444444444444';
const NONEXISTENT_ID = '99999999-9999-9999-9999-999999999999';

const mockFilm = new Film({
  id: FILM_ID,
  tmdbId: 550,
  title: 'Fight Club',
  year: '1999',
  poster: '/poster.jpg',
  backdrop: '/backdrop.jpg',
  plot: null,
  director: null,
  actors: null,
  genre: null,
  runtime: null,
  tmdbRating: null,
  createdAt: new Date(),
  updatedAt: new Date(),
});

const mockWatchlistItem = new WatchlistItem({
  id: WATCHLIST_ITEM_ID,
  userId: USER_ID,
  filmId: FILM_ID,
  addedAt: new Date(),
});

const mockWatchlistWithFilm = {
  id: WATCHLIST_ITEM_ID,
  userId: USER_ID,
  filmId: FILM_ID,
  addedAt: new Date(),
  film: {
    id: FILM_ID,
    tmdbId: 550,
    title: 'Fight Club',
    year: '1999',
    poster: '/poster.jpg',
    backdrop: '/backdrop.jpg',
  },
};

const mockWatchlistRepository: IWatchlistRepository = {
  findById: vi.fn(),
  findByUserAndFilm: vi.fn(),
  findByUserId: vi.fn(),
  isInWatchlist: vi.fn(),
  add: vi.fn(),
  remove: vi.fn(),
  removeById: vi.fn(),
  countByUserId: vi.fn(),
};

const mockFilmRepository: IFilmRepository = {
  findById: vi.fn(),
  findByTmdbId: vi.fn(),
  create: vi.fn(),
  upsertByTmdbId: vi.fn(),
  searchByTitle: vi.fn(),
  findByGenre: vi.fn(),
  findAllPaginated: vi.fn(),
};

describe('Watchlist Routes', () => {
  let server: ReturnType<typeof createTestServer>;
  const JWT_SECRET =
    process.env.JWT_SECRET ?? 'test-secret-key-for-testing-purposes-only-minimum-32-chars';

  const generateToken = (userId: string, email: string) => {
    return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '7d' });
  };

  const token = generateToken(USER_ID, 'test@example.com');

  beforeEach(() => {
    server = createTestServer();
    vi.clearAllMocks();
    container.clearInstances();
    registerDependencies();
    container.registerInstance(IWatchlistRepository as symbol, mockWatchlistRepository);
    container.registerInstance(IFilmRepository as symbol, mockFilmRepository);
  });

  afterEach(() => closeTestServer());

  describe('GET /api/v1/watchlist', () => {
    it('should return 401 without token', async () => {
      const response = await request(server).get('/api/v1/watchlist').expect(401);
      expect(response.body.success).toBe(false);
      expect(mockWatchlistRepository.findByUserId).not.toHaveBeenCalled();
    });

    it('should return user watchlist with items and count', async () => {
      (mockWatchlistRepository.findByUserId as Mock).mockResolvedValue([mockWatchlistWithFilm]);
      (mockWatchlistRepository.countByUserId as Mock).mockResolvedValue(1);

      const response = await request(server)
        .get('/api/v1/watchlist')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toHaveLength(1);
      expect(response.body.data.items[0].film.title).toBe('Fight Club');
      expect(response.body.data.count).toBe(1);
      expect(mockWatchlistRepository.findByUserId).toHaveBeenCalledWith(USER_ID);
      expect(mockWatchlistRepository.countByUserId).toHaveBeenCalledWith(USER_ID);
    });

    it('should return empty list when user has no watchlist items', async () => {
      (mockWatchlistRepository.findByUserId as Mock).mockResolvedValue([]);
      (mockWatchlistRepository.countByUserId as Mock).mockResolvedValue(0);

      const response = await request(server)
        .get('/api/v1/watchlist')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toHaveLength(0);
      expect(response.body.data.count).toBe(0);
    });
  });

  describe('POST /api/v1/watchlist', () => {
    it('should return 401 without token', async () => {
      const response = await request(server)
        .post('/api/v1/watchlist')
        .send({ filmId: FILM_ID })
        .expect(401);
      expect(response.body.success).toBe(false);
      expect(mockFilmRepository.findById).not.toHaveBeenCalled();
    });

    it('should add film to watchlist and return 201', async () => {
      (mockFilmRepository.findById as Mock).mockResolvedValue(mockFilm);
      (mockWatchlistRepository.findByUserAndFilm as Mock).mockResolvedValue(null);
      (mockWatchlistRepository.add as Mock).mockResolvedValue(mockWatchlistItem);

      const response = await request(server)
        .post('/api/v1/watchlist')
        .set('Authorization', `Bearer ${token}`)
        .send({ filmId: FILM_ID })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(WATCHLIST_ITEM_ID);
      expect(response.body.data.filmId).toBe(FILM_ID);
      expect(response.body.data.userId).toBe(USER_ID);
      expect(mockFilmRepository.findById).toHaveBeenCalledWith(FILM_ID);
      expect(mockWatchlistRepository.findByUserAndFilm).toHaveBeenCalledWith(USER_ID, FILM_ID);
      expect(mockWatchlistRepository.add).toHaveBeenCalledWith({
        userId: USER_ID,
        filmId: FILM_ID,
      });
    });

    it('should return 404 when film does not exist', async () => {
      (mockFilmRepository.findById as Mock).mockResolvedValue(null);

      const response = await request(server)
        .post('/api/v1/watchlist')
        .set('Authorization', `Bearer ${token}`)
        .send({ filmId: NONEXISTENT_ID })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(mockWatchlistRepository.add).not.toHaveBeenCalled();
    });

    it('should return 409 when film already in watchlist', async () => {
      (mockFilmRepository.findById as Mock).mockResolvedValue(mockFilm);
      (mockWatchlistRepository.findByUserAndFilm as Mock).mockResolvedValue(mockWatchlistItem);

      const response = await request(server)
        .post('/api/v1/watchlist')
        .set('Authorization', `Bearer ${token}`)
        .send({ filmId: FILM_ID })
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(mockWatchlistRepository.add).not.toHaveBeenCalled();
    });

    it('should return 400 when filmId is missing or invalid', async () => {
      await request(server)
        .post('/api/v1/watchlist')
        .set('Authorization', `Bearer ${token}`)
        .send({})
        .expect(400);

      await request(server)
        .post('/api/v1/watchlist')
        .set('Authorization', `Bearer ${token}`)
        .send({ filmId: 'not-a-uuid' })
        .expect(400);
    });
  });

  describe('DELETE /api/v1/watchlist/:filmId', () => {
    it('should return 401 without token', async () => {
      const response = await request(server).delete(`/api/v1/watchlist/${FILM_ID}`).expect(401);
      expect(response.body.success).toBe(false);
      expect(mockWatchlistRepository.remove).not.toHaveBeenCalled();
    });

    it('should remove film from watchlist and return 204', async () => {
      (mockWatchlistRepository.findByUserAndFilm as Mock).mockResolvedValue(mockWatchlistItem);
      (mockWatchlistRepository.remove as Mock).mockResolvedValue(true);

      await request(server)
        .delete(`/api/v1/watchlist/${FILM_ID}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(204);

      expect(mockWatchlistRepository.findByUserAndFilm).toHaveBeenCalledWith(USER_ID, FILM_ID);
      expect(mockWatchlistRepository.remove).toHaveBeenCalledWith(USER_ID, FILM_ID);
    });

    it('should return 404 when film not in watchlist', async () => {
      (mockWatchlistRepository.findByUserAndFilm as Mock).mockResolvedValue(null);

      const response = await request(server)
        .delete(`/api/v1/watchlist/${OTHER_FILM_ID}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(mockWatchlistRepository.remove).not.toHaveBeenCalled();
    });

    it('should return 400 for invalid filmId UUID', async () => {
      await request(server)
        .delete('/api/v1/watchlist/invalid-uuid')
        .set('Authorization', `Bearer ${token}`)
        .expect(400);
    });
  });

  describe('GET /api/v1/watchlist/check/:filmId', () => {
    it('should return 401 without token', async () => {
      const response = await request(server).get(`/api/v1/watchlist/check/${FILM_ID}`).expect(401);
      expect(response.body.success).toBe(false);
      expect(mockWatchlistRepository.isInWatchlist).not.toHaveBeenCalled();
    });

    it('should return isInWatchlist true when film is in watchlist', async () => {
      (mockWatchlistRepository.isInWatchlist as Mock).mockResolvedValue(true);

      const response = await request(server)
        .get(`/api/v1/watchlist/check/${FILM_ID}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isInWatchlist).toBe(true);
      expect(mockWatchlistRepository.isInWatchlist).toHaveBeenCalledWith(USER_ID, FILM_ID);
    });

    it('should return isInWatchlist false when film is not in watchlist', async () => {
      (mockWatchlistRepository.isInWatchlist as Mock).mockResolvedValue(false);

      const response = await request(server)
        .get(`/api/v1/watchlist/check/${FILM_ID}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isInWatchlist).toBe(false);
    });

    it('should return 400 for invalid filmId UUID', async () => {
      await request(server)
        .get('/api/v1/watchlist/check/not-a-uuid')
        .set('Authorization', `Bearer ${token}`)
        .expect(400);
    });
  });
});
