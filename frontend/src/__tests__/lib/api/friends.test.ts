/**
 * Friends API Tests - Covers getFriends, getPendingRequests, sendFriendRequest,
 * respondToFriendRequest, removeFriend, getUserById for function coverage.
 */

import {
  getFriends,
  getPendingRequests,
  getUserById,
  removeFriend,
  respondToFriendRequest,
  sendFriendRequest,
} from '@/lib/api/friends';
import { api } from '@/lib/api/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/api/client', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockApi = api as unknown as {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
  patch: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
};

const mockFriend = {
  id: 'fs-1',
  user: { id: 'u-1', username: 'friend1', avatarUrl: null },
  since: '2024-01-01T00:00:00Z',
};

const mockPendingRequest = {
  id: 'req-1',
  user: { id: 'u-2', username: 'requester', avatarUrl: null },
  createdAt: '2024-01-01T00:00:00Z',
};

const mockPublicUser = {
  id: 'u-1',
  username: 'johndoe',
  avatarUrl: null,
  createdAt: '2024-01-01T00:00:00Z',
};

describe('Friends API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getFriends', () => {
    it('calls GET /api/v1/friends and returns friend list', async () => {
      mockApi.get.mockResolvedValueOnce([mockFriend]);

      const result = await getFriends();

      expect(mockApi.get).toHaveBeenCalledWith('/api/v1/friends');
      expect(result).toEqual([mockFriend]);
    });
  });

  describe('getPendingRequests', () => {
    it('calls GET /api/v1/friends/requests and returns pending requests', async () => {
      mockApi.get.mockResolvedValueOnce([mockPendingRequest]);

      const result = await getPendingRequests();

      expect(mockApi.get).toHaveBeenCalledWith('/api/v1/friends/requests');
      expect(result).toEqual([mockPendingRequest]);
    });
  });

  describe('sendFriendRequest', () => {
    it('calls POST with userId', async () => {
      mockApi.post.mockResolvedValueOnce(undefined);

      await sendFriendRequest({ userId: 'u-2' });

      expect(mockApi.post).toHaveBeenCalledWith('/api/v1/friends/request', {
        userId: 'u-2',
      });
    });

    it('calls POST with username', async () => {
      mockApi.post.mockResolvedValueOnce(undefined);

      await sendFriendRequest({ username: 'jane' });

      expect(mockApi.post).toHaveBeenCalledWith('/api/v1/friends/request', {
        username: 'jane',
      });
    });
  });

  describe('respondToFriendRequest', () => {
    it('calls PATCH to accept request', async () => {
      const response = { id: 'req-1', status: 'accepted' };
      mockApi.patch.mockResolvedValueOnce(response);

      const result = await respondToFriendRequest('req-1', true);

      expect(mockApi.patch).toHaveBeenCalledWith('/api/v1/friends/requests/req-1', {
        accept: true,
      });
      expect(result).toEqual(response);
    });

    it('calls PATCH to decline request', async () => {
      const response = { id: 'req-1', status: 'declined' };
      mockApi.patch.mockResolvedValueOnce(response);

      const result = await respondToFriendRequest('req-1', false);

      expect(mockApi.patch).toHaveBeenCalledWith('/api/v1/friends/requests/req-1', {
        accept: false,
      });
      expect(result).toEqual(response);
    });
  });

  describe('removeFriend', () => {
    it('calls DELETE with friendship id', async () => {
      mockApi.delete.mockResolvedValueOnce(undefined);

      await removeFriend('fs-1');

      expect(mockApi.delete).toHaveBeenCalledWith('/api/v1/friends/fs-1');
    });
  });

  describe('getUserById', () => {
    it('calls GET /api/v1/users/:id and returns public user', async () => {
      mockApi.get.mockResolvedValueOnce(mockPublicUser);

      const result = await getUserById('u-1');

      expect(mockApi.get).toHaveBeenCalledWith('/api/v1/users/u-1');
      expect(result).toEqual(mockPublicUser);
    });
  });
});
