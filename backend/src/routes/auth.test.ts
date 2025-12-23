/**
 * Auth Routes Unit Tests
 * Tests authentication endpoints with mocked database
 */

import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { createApp } from '../app.js';

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

// Import the mocked module
import { db } from '../db/index.js';

describe('Auth Routes', () => {
  const app = createApp();

  // Mock user data
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    username: 'testuser',
    passwordHash: '', // Will be set in beforeEach
    avatarUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    // Pre-hash a password for login tests
    mockUser.passwordHash = await bcrypt.hash('password123', 12);
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user successfully', async () => {
      // Mock: no existing user found
      (db.query.users.findFirst as Mock).mockResolvedValue(null);

      // Mock: insert returns new user
      (db.insert as Mock).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([
            {
              id: 'new-user-id',
              email: 'newuser@example.com',
              username: 'newuser',
              avatarUrl: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ]),
        }),
      });

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'newuser@example.com',
          username: 'newuser',
          password: 'password123',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.email).toBe('newuser@example.com');
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
      // Password should NOT be in response
      expect(response.body.data.user.password).toBeUndefined();
      expect(response.body.data.user.passwordHash).toBeUndefined();
    });

    it('should return 400 for invalid email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'invalid-email',
          username: 'testuser',
          password: 'password123',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation error');
    });

    it('should return 400 for short password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          username: 'testuser',
          password: '123',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for short username', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          username: 'ab',
          password: 'password123',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 409 for duplicate email', async () => {
      // Mock: existing user with same email found
      (db.query.users.findFirst as Mock).mockResolvedValue({
        ...mockUser,
        email: 'test@example.com',
      });

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          username: 'differentuser',
          password: 'password123',
        })
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Email');
    });

    it('should return 409 for duplicate username', async () => {
      // Mock: existing user with same username found
      (db.query.users.findFirst as Mock).mockResolvedValue({
        ...mockUser,
        email: 'different@example.com',
        username: 'testuser',
      });

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'new@example.com',
          username: 'testuser',
          password: 'password123',
        })
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Username');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      // Mock: user found
      (db.query.users.findFirst as Mock).mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.email).toBe('test@example.com');
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
    });

    it('should return 401 for invalid email', async () => {
      // Mock: no user found
      (db.query.users.findFirst as Mock).mockResolvedValue(null);

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid');
    });

    it('should return 401 for invalid password', async () => {
      // Mock: user found but password won't match
      (db.query.users.findFirst as Mock).mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid');
    });

    it('should return 400 for missing email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          password: 'password123',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for missing password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid email format', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'not-an-email',
          password: 'password123',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('should return placeholder response (not yet implemented)', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({
          refreshToken: 'some-refresh-token',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('not yet implemented');
    });
  });

  describe('GET /health', () => {
    it('should return health check status', async () => {
      const response = await request(app).get('/health').expect(200);

      expect(response.body.status).toBe('ok');
      expect(response.body.timestamp).toBeDefined();
    });
  });
});
