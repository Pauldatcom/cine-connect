/**
 * Messages Routes Unit Tests
 */

import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../app.js';

// Valid UUIDs for testing
const USER_ID = '11111111-1111-1111-1111-111111111111';
const OTHER_USER_ID = '22222222-2222-2222-2222-222222222222';
const MESSAGE_ID = '33333333-3333-3333-3333-333333333333';
const NONEXISTENT_ID = '99999999-9999-9999-9999-999999999999';

// Mock the database module
vi.mock('../db/index.js', () => ({
  db: {
    query: {
      messages: {
        findMany: vi.fn(),
      },
      users: {
        findFirst: vi.fn(),
      },
    },
    insert: vi.fn(),
    update: vi.fn(),
  },
  schema: {
    messages: {
      id: 'id',
      senderId: 'senderId',
      receiverId: 'receiverId',
      content: 'content',
      read: 'read',
      createdAt: 'createdAt',
    },
    users: {
      id: 'id',
      username: 'username',
      avatarUrl: 'avatarUrl',
    },
  },
}));

import { db } from '../db/index.js';

describe('Messages Routes', () => {
  const app = createApp();
  const JWT_SECRET =
    process.env.JWT_SECRET || 'test-secret-key-for-testing-purposes-only-minimum-32-chars';

  const mockUser = { id: USER_ID, email: 'test@example.com' };
  const mockOtherUser = { id: OTHER_USER_ID, username: 'otheruser', avatarUrl: null };

  const mockMessage = {
    id: MESSAGE_ID,
    senderId: USER_ID,
    receiverId: OTHER_USER_ID,
    content: 'Hello!',
    read: false,
    createdAt: new Date(),
    sender: { id: USER_ID, username: 'testuser', avatarUrl: null },
    receiver: mockOtherUser,
  };

  const generateToken = (userId: string, email: string) => {
    return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '7d' });
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/v1/messages', () => {
    it('should return conversations', async () => {
      const token = generateToken(mockUser.id, mockUser.email);
      (db.query.messages.findMany as Mock).mockResolvedValue([mockMessage]);

      const response = await request(app)
        .get('/api/v1/messages')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
    });

    it('should count unread messages', async () => {
      const token = generateToken(mockUser.id, mockUser.email);
      const unreadMessage = {
        ...mockMessage,
        senderId: OTHER_USER_ID,
        receiverId: USER_ID,
        read: false,
      };
      (db.query.messages.findMany as Mock).mockResolvedValue([unreadMessage]);

      const response = await request(app)
        .get('/api/v1/messages')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data[0].unreadCount).toBe(1);
    });

    it('should return 401 without token', async () => {
      await request(app).get('/api/v1/messages').expect(401);
    });
  });

  describe('GET /api/v1/messages/:userId', () => {
    it('should return messages with user', async () => {
      const token = generateToken(mockUser.id, mockUser.email);
      (db.query.messages.findMany as Mock).mockResolvedValue([mockMessage]);
      (db.update as Mock).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      });

      const response = await request(app)
        .get(`/api/v1/messages/${OTHER_USER_ID}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toHaveLength(1);
    });

    it('should handle pagination', async () => {
      const token = generateToken(mockUser.id, mockUser.email);
      (db.query.messages.findMany as Mock).mockResolvedValue([]);
      (db.update as Mock).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      });

      const response = await request(app)
        .get(`/api/v1/messages/${OTHER_USER_ID}?page=2`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.data.page).toBe(2);
    });
  });

  describe('POST /api/v1/messages', () => {
    it('should send a message', async () => {
      const token = generateToken(mockUser.id, mockUser.email);
      (db.query.users.findFirst as Mock).mockResolvedValue(mockOtherUser);
      (db.insert as Mock).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockMessage]),
        }),
      });

      const response = await request(app)
        .post('/api/v1/messages')
        .set('Authorization', `Bearer ${token}`)
        .send({
          receiverId: OTHER_USER_ID,
          content: 'Hello!',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.content).toBe('Hello!');
    });

    it('should not send message to self', async () => {
      const token = generateToken(mockUser.id, mockUser.email);

      const response = await request(app)
        .post('/api/v1/messages')
        .set('Authorization', `Bearer ${token}`)
        .send({
          receiverId: mockUser.id,
          content: 'Hello!',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 404 if receiver not found', async () => {
      const token = generateToken(mockUser.id, mockUser.email);
      (db.query.users.findFirst as Mock).mockResolvedValue(null);

      const response = await request(app)
        .post('/api/v1/messages')
        .set('Authorization', `Bearer ${token}`)
        .send({
          receiverId: NONEXISTENT_ID,
          content: 'Hello!',
        })
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for empty content', async () => {
      const token = generateToken(mockUser.id, mockUser.email);

      const response = await request(app)
        .post('/api/v1/messages')
        .set('Authorization', `Bearer ${token}`)
        .send({
          receiverId: OTHER_USER_ID,
          content: '',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 401 without token', async () => {
      await request(app)
        .post('/api/v1/messages')
        .send({
          receiverId: OTHER_USER_ID,
          content: 'Hello!',
        })
        .expect(401);
    });
  });
});
