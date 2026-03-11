/**
 * Messages Routes Integration Tests
 * Uses container-registered mocks for IMessageRepository and IUserRepository (use-case layer).
 */

import 'reflect-metadata';

import type { ConversationSummary, MessageRow } from '@/domain/repositories/IMessageRepository.js';
import { IMessageRepository } from '@/domain/repositories/IMessageRepository.js';
import { IUserRepository } from '@/domain/repositories/IUserRepository.js';
import { createTestServer, closeTestServer } from '@/__tests__/helpers/server.js';
import { container } from 'tsyringe';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const USER_ID = '11111111-1111-1111-1111-111111111111';
const OTHER_USER_ID = '22222222-2222-2222-2222-222222222222';
const MESSAGE_ID = '33333333-3333-3333-3333-333333333333';
const NONEXISTENT_ID = '99999999-9999-9999-9999-999999999999';

const mockUser = { id: USER_ID, email: 'test@example.com' };
const mockOtherUserSummary = {
  id: OTHER_USER_ID,
  username: 'otheruser',
  avatarUrl: null as string | null,
};

const mockMessageRow: MessageRow = {
  id: MESSAGE_ID,
  senderId: USER_ID,
  receiverId: OTHER_USER_ID,
  content: 'Hello!',
  read: false,
  createdAt: new Date(),
};

const mockConversation: ConversationSummary = {
  partnerId: OTHER_USER_ID,
  partner: mockOtherUserSummary,
  lastMessage: mockMessageRow,
  unreadCount: 0,
};

const mockUserEntity = {
  id: OTHER_USER_ID,
  email: 'other@example.com',
  username: 'otheruser',
  passwordHash: 'hash',
  avatarUrl: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockMessageRepository: IMessageRepository = {
  listConversations: vi.fn(),
  listMessagesBetween: vi.fn(),
  markAsRead: vi.fn(),
  create: vi.fn(),
};

const mockUserRepository: IUserRepository = {
  findById: vi.fn(),
  findByEmail: vi.fn(),
  findByUsername: vi.fn(),
  findByEmailOrUsername: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
};

describe('Messages Routes', () => {
  let server: ReturnType<typeof createTestServer>;
  const JWT_SECRET =
    process.env.JWT_SECRET || 'test-secret-key-for-testing-purposes-only-minimum-32-chars';

  const generateToken = (userId: string, email: string) => {
    return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '7d' });
  };

  beforeEach(() => {
    server = createTestServer();
    vi.clearAllMocks();
    container.clearInstances();
    container.registerInstance(IMessageRepository as symbol, mockMessageRepository);
    container.registerInstance(IUserRepository as symbol, mockUserRepository);
  });

  afterEach(() => closeTestServer());

  describe('GET /api/v1/messages', () => {
    it('should return conversations', async () => {
      const token = generateToken(mockUser.id, mockUser.email);
      vi.mocked(mockMessageRepository.listConversations).mockResolvedValue([mockConversation]);

      const response = await request(server)
        .get('/api/v1/messages')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
    });

    it('should count unread messages', async () => {
      const token = generateToken(mockUser.id, mockUser.email);
      const convWithUnread: ConversationSummary = {
        ...mockConversation,
        unreadCount: 1,
      };
      vi.mocked(mockMessageRepository.listConversations).mockResolvedValue([convWithUnread]);

      const response = await request(server)
        .get('/api/v1/messages')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data[0].unreadCount).toBe(1);
    });

    it('should return 401 without token', async () => {
      await request(server).get('/api/v1/messages').expect(401);
    });
  });

  describe('GET /api/v1/messages/:userId', () => {
    it('should return messages with user', async () => {
      const token = generateToken(mockUser.id, mockUser.email);
      vi.mocked(mockMessageRepository.markAsRead).mockResolvedValue(undefined);
      vi.mocked(mockMessageRepository.listMessagesBetween).mockResolvedValue({
        items: [mockMessageRow],
        page: 1,
        pageSize: 50,
      });

      const response = await request(server)
        .get(`/api/v1/messages/${OTHER_USER_ID}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toHaveLength(1);
    });

    it('should handle pagination', async () => {
      const token = generateToken(mockUser.id, mockUser.email);
      vi.mocked(mockMessageRepository.markAsRead).mockResolvedValue(undefined);
      vi.mocked(mockMessageRepository.listMessagesBetween).mockResolvedValue({
        items: [],
        page: 2,
        pageSize: 50,
      });

      const response = await request(server)
        .get(`/api/v1/messages/${OTHER_USER_ID}?page=2`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.data.page).toBe(2);
    });
  });

  describe('POST /api/v1/messages', () => {
    it('should send a message', async () => {
      const token = generateToken(mockUser.id, mockUser.email);
      vi.mocked(mockUserRepository.findById).mockResolvedValue(mockUserEntity as never);
      vi.mocked(mockMessageRepository.create).mockResolvedValue(mockMessageRow);

      const response = await request(server)
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

      const response = await request(server)
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
      vi.mocked(mockUserRepository.findById).mockResolvedValue(null);

      const response = await request(server)
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

      const response = await request(server)
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
      await request(server)
        .post('/api/v1/messages')
        .send({
          receiverId: OTHER_USER_ID,
          content: 'Hello!',
        })
        .expect(401);
    });
  });
});
