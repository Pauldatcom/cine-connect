/**
 * Auth Routes Unit Tests
 * Tests authentication endpoints with mocked database
 */

// Must import reflect-metadata FIRST before any tsyringe usage
import 'reflect-metadata';

import { createApp } from '@/app';
import bcrypt from 'bcryptjs';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

// Mock the database module
vi.mock('@/db/index.js', () => ({
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
import { db } from '@/db/index.js';

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
      // refreshToken is set as httpOnly cookie, not in response body
      const setCookie = response.headers['set-cookie'];
      const cookieArr = Array.isArray(setCookie) ? setCookie : setCookie ? [setCookie] : [];
      expect(cookieArr.some((c) => c.startsWith('cineconnect_refresh='))).toBe(true);
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
      // refreshToken is set as httpOnly cookie, not in response body
      const setCookie = response.headers['set-cookie'];
      const cookieArr = Array.isArray(setCookie) ? setCookie : setCookie ? [setCookie] : [];
      expect(cookieArr.some((c) => c.startsWith('cineconnect_refresh='))).toBe(true);
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
    it('should return 401 when no refresh cookie is sent', async () => {
      await request(app).post('/api/v1/auth/refresh').expect(401);
    });

    it('should return 200 and new accessToken when valid refresh cookie is sent', async () => {
      // Login to get refresh token cookie
      (db.query.users.findFirst as Mock).mockResolvedValue(mockUser);
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(200);

      const cookieHeader = loginResponse.headers['set-cookie'] as string | string[] | undefined;
      expect(cookieHeader).toBeDefined();
      // Cookie header must be only name=value (no Path, HttpOnly, etc.)
      const rawCookies: string[] = Array.isArray(cookieHeader)
        ? cookieHeader.filter((c): c is string => typeof c === 'string')
        : cookieHeader
          ? [cookieHeader]
          : [];
      const cookieValue = rawCookies
        .map((c) => c.split(';')[0]?.trim() ?? '')
        .filter(Boolean)
        .join('; ');
      expect(cookieValue).toBeTruthy();

      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', cookieValue)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.user.email).toBe('test@example.com');
    });
  });
  // don't no it's realy usefull to have health check in test, use it before register,
  // when user using the API for wake up the service
  describe('GET /health', () => {
    it('should return health check status', async () => {
      const response = await request(app).get('/health').expect(200);

      expect(response.body.status).toBe('ok');
      expect(response.body.timestamp).toBeDefined();
    });
  });
});
