/**
 * Friends Routes Unit Tests
 */

// Must import reflect-metadata FIRST before any tsyringe usage
import 'reflect-metadata';

import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../app.js';

// Valid UUIDs for testing
const USER_ID = '11111111-1111-1111-1111-111111111111';
const OTHER_USER_ID = '22222222-2222-2222-2222-222222222222';
const FRIEND_ID = '33333333-3333-3333-3333-333333333333';
const REQUEST_ID = '44444444-4444-4444-4444-444444444444';
const NONEXISTENT_ID = '99999999-9999-9999-9999-999999999999';

// Mock the database module
vi.mock('../db/index.js', () => ({
  db: {
    query: {
      friends: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
      users: {
        findFirst: vi.fn(),
      },
    },
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  schema: {
    friends: {
      id: 'id',
      senderId: 'senderId',
      receiverId: 'receiverId',
      status: 'status',
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
    },
    users: {
      id: 'id',
      username: 'username',
      avatarUrl: 'avatarUrl',
    },
  },
}));

import { db } from '../db/index.js';

describe('Friends Routes', () => {
  const app = createApp();
  const JWT_SECRET =
    process.env.JWT_SECRET || 'test-secret-key-for-testing-purposes-only-minimum-32-chars';

  const mockUser = { id: USER_ID, email: 'test@example.com' };
  const mockOtherUser = { id: OTHER_USER_ID, username: 'otheruser', avatarUrl: null };

  const mockFriendship = {
    id: FRIEND_ID,
    senderId: USER_ID,
    receiverId: OTHER_USER_ID,
    status: 'accepted',
    createdAt: new Date(),
    updatedAt: new Date(),
    sender: { id: USER_ID, username: 'testuser', avatarUrl: null },
    receiver: mockOtherUser,
  };

  const mockPendingRequest = {
    ...mockFriendship,
    id: REQUEST_ID,
    status: 'pending',
    receiverId: USER_ID,
    senderId: OTHER_USER_ID,
    sender: mockOtherUser,
  };

  const generateToken = (userId: string, email: string) => {
    return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '7d' });
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/v1/friends', () => {
    it('should return friends list', async () => {
      const token = generateToken(mockUser.id, mockUser.email);
      (db.query.friends.findMany as Mock).mockResolvedValue([mockFriendship]);

      const response = await request(app)
        .get('/api/v1/friends')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
    });

    it('should return 401 without token', async () => {
      await request(app).get('/api/v1/friends').expect(401);
    });
  });

  describe('GET /api/v1/friends/requests', () => {
    it('should return pending requests', async () => {
      const token = generateToken(mockUser.id, mockUser.email);
      (db.query.friends.findMany as Mock).mockResolvedValue([mockPendingRequest]);

      const response = await request(app)
        .get('/api/v1/friends/requests')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/v1/friends/request', () => {
    it('should send friend request', async () => {
      const token = generateToken(mockUser.id, mockUser.email);
      (db.query.users.findFirst as Mock).mockResolvedValue(mockOtherUser);
      (db.query.friends.findFirst as Mock).mockResolvedValue(null);
      (db.insert as Mock).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ ...mockFriendship, status: 'pending' }]),
        }),
      });

      const response = await request(app)
        .post('/api/v1/friends/request')
        .set('Authorization', `Bearer ${token}`)
        .send({ userId: OTHER_USER_ID })
        .expect(201);

      expect(response.body.success).toBe(true);
    });

    it('should not send request to self', async () => {
      const token = generateToken(mockUser.id, mockUser.email);

      const response = await request(app)
        .post('/api/v1/friends/request')
        .set('Authorization', `Bearer ${token}`)
        .send({ userId: mockUser.id })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 404 if user not found', async () => {
      const token = generateToken(mockUser.id, mockUser.email);
      (db.query.users.findFirst as Mock).mockResolvedValue(null);

      const response = await request(app)
        .post('/api/v1/friends/request')
        .set('Authorization', `Bearer ${token}`)
        .send({ userId: NONEXISTENT_ID })
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should return 409 if already friends', async () => {
      const token = generateToken(mockUser.id, mockUser.email);
      (db.query.users.findFirst as Mock).mockResolvedValue(mockOtherUser);
      (db.query.friends.findFirst as Mock).mockResolvedValue(mockFriendship);

      const response = await request(app)
        .post('/api/v1/friends/request')
        .set('Authorization', `Bearer ${token}`)
        .send({ userId: OTHER_USER_ID })
        .expect(409);

      expect(response.body.success).toBe(false);
    });

    it('should return 409 if request pending', async () => {
      const token = generateToken(mockUser.id, mockUser.email);
      (db.query.users.findFirst as Mock).mockResolvedValue(mockOtherUser);
      (db.query.friends.findFirst as Mock).mockResolvedValue({
        ...mockFriendship,
        status: 'pending',
      });

      const response = await request(app)
        .post('/api/v1/friends/request')
        .set('Authorization', `Bearer ${token}`)
        .send({ userId: OTHER_USER_ID })
        .expect(409);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PATCH /api/v1/friends/requests/:id', () => {
    it('should accept friend request', async () => {
      const token = generateToken(mockUser.id, mockUser.email);
      (db.query.friends.findFirst as Mock).mockResolvedValue(mockPendingRequest);
      (db.update as Mock).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{ ...mockPendingRequest, status: 'accepted' }]),
          }),
        }),
      });

      const response = await request(app)
        .patch(`/api/v1/friends/requests/${REQUEST_ID}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ accept: true })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should reject friend request', async () => {
      const token = generateToken(mockUser.id, mockUser.email);
      (db.query.friends.findFirst as Mock).mockResolvedValue(mockPendingRequest);
      (db.update as Mock).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{ ...mockPendingRequest, status: 'rejected' }]),
          }),
        }),
      });

      const response = await request(app)
        .patch(`/api/v1/friends/requests/${REQUEST_ID}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ accept: false })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should return 404 if request not found', async () => {
      const token = generateToken(mockUser.id, mockUser.email);
      (db.query.friends.findFirst as Mock).mockResolvedValue(null);

      const response = await request(app)
        .patch(`/api/v1/friends/requests/${NONEXISTENT_ID}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ accept: true })
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should return 403 if not receiver', async () => {
      const token = generateToken(NONEXISTENT_ID, 'other@example.com');
      (db.query.friends.findFirst as Mock).mockResolvedValue(mockPendingRequest);

      const response = await request(app)
        .patch(`/api/v1/friends/requests/${REQUEST_ID}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ accept: true })
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 if already responded', async () => {
      const token = generateToken(mockUser.id, mockUser.email);
      (db.query.friends.findFirst as Mock).mockResolvedValue({
        ...mockPendingRequest,
        status: 'accepted',
      });

      const response = await request(app)
        .patch(`/api/v1/friends/requests/${REQUEST_ID}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ accept: true })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/v1/friends/:id', () => {
    it('should remove friend', async () => {
      const token = generateToken(mockUser.id, mockUser.email);
      (db.query.friends.findFirst as Mock).mockResolvedValue(mockFriendship);
      (db.delete as Mock).mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      });

      await request(app)
        .delete(`/api/v1/friends/${FRIEND_ID}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(204);
    });

    it('should return 404 if not found', async () => {
      const token = generateToken(mockUser.id, mockUser.email);
      (db.query.friends.findFirst as Mock).mockResolvedValue(null);

      const response = await request(app)
        .delete(`/api/v1/friends/${NONEXISTENT_ID}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should return 403 if not part of friendship', async () => {
      const token = generateToken(NONEXISTENT_ID, 'other@example.com');
      (db.query.friends.findFirst as Mock).mockResolvedValue(mockFriendship);

      const response = await request(app)
        .delete(`/api/v1/friends/${FRIEND_ID}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });
});
