/**
 * Users Routes Unit Tests
 */

// Must import reflect-metadata FIRST before any tsyringe usage
import 'reflect-metadata';

import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../app.js';

// Valid UUIDs for testing
const USER_ID = '11111111-1111-1111-1111-111111111111';
const NONEXISTENT_ID = '99999999-9999-9999-9999-999999999999';

// Mock the database module
vi.mock('../db/index.js', () => ({
  db: {
    query: {
      users: {
        findFirst: vi.fn(),
      },
    },
    insert: vi.fn(),
    update: vi.fn(),
  },
  schema: {
    users: {
      id: 'id',
      email: 'email',
      username: 'username',
      passwordHash: 'passwordHash',
      avatarUrl: 'avatarUrl',
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
    },
  },
}));

import { db } from '../db/index.js';

describe('Users Routes', () => {
  const app = createApp();
  const JWT_SECRET =
    process.env.JWT_SECRET || 'test-secret-key-for-testing-purposes-only-minimum-32-chars';

  const mockUser = {
    id: USER_ID,
    email: 'test@example.com',
    username: 'testuser',
    avatarUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const generateToken = (userId: string, email: string) => {
    return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '7d' });
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/v1/users/me', () => {
    it('should return current user profile', async () => {
      const token = generateToken(mockUser.id, mockUser.email);
      (db.query.users.findFirst as Mock).mockResolvedValue(mockUser);

      const response = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(mockUser.id);
      expect(response.body.data.email).toBe(mockUser.email);
    });

    it('should return 401 without token', async () => {
      const response = await request(app).get('/api/v1/users/me').expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return 404 if user not found', async () => {
      const token = generateToken(NONEXISTENT_ID, 'test@example.com');
      (db.query.users.findFirst as Mock).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/users/:id', () => {
    it('should return user by ID', async () => {
      (db.query.users.findFirst as Mock).mockResolvedValue(mockUser);

      const response = await request(app).get(`/api/v1/users/${USER_ID}`).expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(mockUser.id);
    });

    it('should return 404 if user not found', async () => {
      (db.query.users.findFirst as Mock).mockResolvedValue(null);

      const response = await request(app).get(`/api/v1/users/${NONEXISTENT_ID}`).expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid UUID', async () => {
      const response = await request(app).get('/api/v1/users/not-a-valid-uuid').expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PATCH /api/v1/users/me', () => {
    it('should update user profile', async () => {
      const token = generateToken(mockUser.id, mockUser.email);
      const updatedUser = { ...mockUser, username: 'newusername' };

      (db.update as Mock).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([updatedUser]),
          }),
        }),
      });

      const response = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${token}`)
        .send({ username: 'newusername' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.username).toBe('newusername');
    });

    it('should update avatar URL', async () => {
      const token = generateToken(mockUser.id, mockUser.email);
      const updatedUser = { ...mockUser, avatarUrl: 'https://example.com/avatar.jpg' };

      (db.update as Mock).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([updatedUser]),
          }),
        }),
      });

      const response = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${token}`)
        .send({ avatarUrl: 'https://example.com/avatar.jpg' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.avatarUrl).toBe('https://example.com/avatar.jpg');
    });

    it('should return 401 without token', async () => {
      const response = await request(app)
        .patch('/api/v1/users/me')
        .send({ username: 'newusername' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for username too short', async () => {
      const token = generateToken(mockUser.id, mockUser.email);

      const response = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${token}`)
        .send({ username: 'ab' }) // Too short, min 3
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid avatar URL', async () => {
      const token = generateToken(mockUser.id, mockUser.email);

      const response = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${token}`)
        .send({ avatarUrl: 'not-a-url' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});
