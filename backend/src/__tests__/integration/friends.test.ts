/**
 * Friends Routes Integration Tests
 * Uses container-registered mocks for IFriendsRepository and IUserRepository (use-case layer).
 */

import 'reflect-metadata';

import {
  type FriendRequestWithSender,
  type FriendWithUser,
  IFriendsRepository,
} from '@/domain/repositories/IFriendsRepository.js';
import { IUserRepository } from '@/domain/repositories/IUserRepository.js';
import { createTestServer, closeTestServer } from '@/__tests__/helpers/server.js';
import { container } from 'tsyringe';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const USER_ID = '11111111-1111-1111-1111-111111111111';
const OTHER_USER_ID = '22222222-2222-2222-2222-222222222222';
const FRIEND_ID = '33333333-3333-3333-3333-333333333333';
const REQUEST_ID = '44444444-4444-4444-4444-444444444444';
const NONEXISTENT_ID = '99999999-9999-9999-9999-999999999999';

const mockUser = { id: USER_ID, email: 'test@example.com' };
const mockOtherUserSummary = {
  id: OTHER_USER_ID,
  username: 'otheruser',
  avatarUrl: null as string | null,
};

const mockFriendWithUser: FriendWithUser = {
  id: FRIEND_ID,
  user: mockOtherUserSummary,
  since: new Date(),
};

const mockRequestWithSender: FriendRequestWithSender = {
  id: REQUEST_ID,
  user: mockOtherUserSummary,
  createdAt: new Date(),
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

const mockFriendsRepository: IFriendsRepository = {
  findFriendsWithPartners: vi.fn(),
  findPendingRequestsForReceiver: vi.fn(),
  findExistingBetween: vi.fn(),
  create: vi.fn(),
  updateStatus: vi.fn(),
  findById: vi.fn(),
  delete: vi.fn(),
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

describe('Friends Routes', () => {
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
    container.registerInstance(IFriendsRepository as symbol, mockFriendsRepository);
    container.registerInstance(IUserRepository as symbol, mockUserRepository);
  });

  afterEach(() => closeTestServer());

  describe('GET /api/v1/friends', () => {
    it('should return friends list', async () => {
      const token = generateToken(mockUser.id, mockUser.email);
      vi.mocked(mockFriendsRepository.findFriendsWithPartners).mockResolvedValue([
        mockFriendWithUser,
      ]);

      const response = await request(server)
        .get('/api/v1/friends')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
    });

    it('should return 401 without token', async () => {
      await request(server).get('/api/v1/friends').expect(401);
    });
  });

  describe('GET /api/v1/friends/requests', () => {
    it('should return pending requests', async () => {
      const token = generateToken(mockUser.id, mockUser.email);
      vi.mocked(mockFriendsRepository.findPendingRequestsForReceiver).mockResolvedValue([
        mockRequestWithSender,
      ]);

      const response = await request(server)
        .get('/api/v1/friends/requests')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
    });
  });

  describe('POST /api/v1/friends/request', () => {
    it('should send friend request', async () => {
      const token = generateToken(mockUser.id, mockUser.email);
      vi.mocked(mockUserRepository.findById).mockResolvedValue(mockUserEntity as never);
      vi.mocked(mockFriendsRepository.findExistingBetween).mockResolvedValue(null);
      vi.mocked(mockFriendsRepository.create).mockResolvedValue({
        id: REQUEST_ID,
        senderId: USER_ID,
        receiverId: OTHER_USER_ID,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const response = await request(server)
        .post('/api/v1/friends/request')
        .set('Authorization', `Bearer ${token}`)
        .send({ userId: OTHER_USER_ID })
        .expect(201);

      expect(response.body.success).toBe(true);
    });

    it('should not send request to self', async () => {
      const token = generateToken(mockUser.id, mockUser.email);

      const response = await request(server)
        .post('/api/v1/friends/request')
        .set('Authorization', `Bearer ${token}`)
        .send({ userId: mockUser.id })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 404 if user not found', async () => {
      const token = generateToken(mockUser.id, mockUser.email);
      vi.mocked(mockUserRepository.findById).mockResolvedValue(null);

      const response = await request(server)
        .post('/api/v1/friends/request')
        .set('Authorization', `Bearer ${token}`)
        .send({ userId: NONEXISTENT_ID })
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should return 409 if already friends', async () => {
      const token = generateToken(mockUser.id, mockUser.email);
      vi.mocked(mockUserRepository.findById).mockResolvedValue(mockUserEntity as never);
      vi.mocked(mockFriendsRepository.findExistingBetween).mockResolvedValue({
        id: FRIEND_ID,
        senderId: USER_ID,
        receiverId: OTHER_USER_ID,
        status: 'accepted',
      });

      const response = await request(server)
        .post('/api/v1/friends/request')
        .set('Authorization', `Bearer ${token}`)
        .send({ userId: OTHER_USER_ID })
        .expect(409);

      expect(response.body.success).toBe(false);
    });

    it('should return 409 if request pending', async () => {
      const token = generateToken(mockUser.id, mockUser.email);
      vi.mocked(mockUserRepository.findById).mockResolvedValue(mockUserEntity as never);
      vi.mocked(mockFriendsRepository.findExistingBetween).mockResolvedValue({
        id: REQUEST_ID,
        senderId: USER_ID,
        receiverId: OTHER_USER_ID,
        status: 'pending',
      });

      const response = await request(server)
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
      vi.mocked(mockFriendsRepository.findById).mockResolvedValue({
        id: REQUEST_ID,
        senderId: OTHER_USER_ID,
        receiverId: USER_ID,
        status: 'pending',
      });
      vi.mocked(mockFriendsRepository.updateStatus).mockResolvedValue({
        id: REQUEST_ID,
        senderId: OTHER_USER_ID,
        receiverId: USER_ID,
        status: 'accepted',
        updatedAt: new Date(),
      });

      const response = await request(server)
        .patch(`/api/v1/friends/requests/${REQUEST_ID}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ accept: true })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should reject friend request', async () => {
      const token = generateToken(mockUser.id, mockUser.email);
      vi.mocked(mockFriendsRepository.findById).mockResolvedValue({
        id: REQUEST_ID,
        senderId: OTHER_USER_ID,
        receiverId: USER_ID,
        status: 'pending',
      });
      vi.mocked(mockFriendsRepository.updateStatus).mockResolvedValue({
        id: REQUEST_ID,
        senderId: OTHER_USER_ID,
        receiverId: USER_ID,
        status: 'rejected',
        updatedAt: new Date(),
      });

      const response = await request(server)
        .patch(`/api/v1/friends/requests/${REQUEST_ID}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ accept: false })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should return 404 if request not found', async () => {
      const token = generateToken(mockUser.id, mockUser.email);
      vi.mocked(mockFriendsRepository.findById).mockResolvedValue(null);

      const response = await request(server)
        .patch(`/api/v1/friends/requests/${NONEXISTENT_ID}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ accept: true })
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should return 403 if not receiver', async () => {
      const token = generateToken(NONEXISTENT_ID, 'other@example.com');
      vi.mocked(mockFriendsRepository.findById).mockResolvedValue({
        id: REQUEST_ID,
        senderId: OTHER_USER_ID,
        receiverId: USER_ID,
        status: 'pending',
      });

      const response = await request(server)
        .patch(`/api/v1/friends/requests/${REQUEST_ID}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ accept: true })
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 if already responded', async () => {
      const token = generateToken(mockUser.id, mockUser.email);
      vi.mocked(mockFriendsRepository.findById).mockResolvedValue({
        id: REQUEST_ID,
        senderId: OTHER_USER_ID,
        receiverId: USER_ID,
        status: 'accepted',
      });

      const response = await request(server)
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
      vi.mocked(mockFriendsRepository.findById).mockResolvedValue({
        id: FRIEND_ID,
        senderId: USER_ID,
        receiverId: OTHER_USER_ID,
        status: 'accepted',
      });
      vi.mocked(mockFriendsRepository.delete).mockResolvedValue(true);

      await request(server)
        .delete(`/api/v1/friends/${FRIEND_ID}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(204);
    });

    it('should return 404 if not found', async () => {
      const token = generateToken(mockUser.id, mockUser.email);
      vi.mocked(mockFriendsRepository.findById).mockResolvedValue(null);

      const response = await request(server)
        .delete(`/api/v1/friends/${NONEXISTENT_ID}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should return 403 if not part of friendship', async () => {
      const token = generateToken(NONEXISTENT_ID, 'other@example.com');
      vi.mocked(mockFriendsRepository.findById).mockResolvedValue({
        id: FRIEND_ID,
        senderId: USER_ID,
        receiverId: OTHER_USER_ID,
        status: 'accepted',
      });

      const response = await request(server)
        .delete(`/api/v1/friends/${FRIEND_ID}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });
});
