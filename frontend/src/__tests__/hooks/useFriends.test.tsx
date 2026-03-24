/**
 * useFriends Hook Tests - Covers useFriends, usePendingFriendRequests,
 * useSendFriendRequest, useRespondToFriendRequest, useRemoveFriend, useUserById.
 */

import {
  useFriends,
  usePendingFriendRequests,
  useRemoveFriend,
  useRespondToFriendRequest,
  useSendFriendRequest,
  useUserById,
} from '@/hooks/useFriends';
import { api } from '@/lib/api/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
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

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('useFriends hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useFriends', () => {
    it('fetches friends when enabled', async () => {
      const friends = [
        {
          id: 'fs-1',
          user: { id: 'u-1', username: 'friend1', avatarUrl: null },
          since: '2024-01-01T00:00:00Z',
        },
      ];
      mockApi.get.mockResolvedValueOnce(friends);

      const { result } = renderHook(() => useFriends(true), { wrapper: createWrapper() });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockApi.get).toHaveBeenCalledWith('/api/v1/friends');
      expect(result.current.data).toEqual(friends);
    });

    it('does not fetch when enabled is false', () => {
      renderHook(() => useFriends(false), { wrapper: createWrapper() });
      expect(mockApi.get).not.toHaveBeenCalled();
    });
  });

  describe('usePendingFriendRequests', () => {
    it('fetches pending requests', async () => {
      const requests = [
        {
          id: 'req-1',
          user: { id: 'u-2', username: 'requester', avatarUrl: null },
          createdAt: '2024-01-01T00:00:00Z',
        },
      ];
      mockApi.get.mockResolvedValueOnce(requests);

      const { result } = renderHook(() => usePendingFriendRequests(true), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockApi.get).toHaveBeenCalledWith('/api/v1/friends/requests');
      expect(result.current.data).toEqual(requests);
    });
  });

  describe('useSendFriendRequest', () => {
    it('sends friend request and invalidates queries', async () => {
      mockApi.post.mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useSendFriendRequest(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ userId: 'u-2' });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockApi.post).toHaveBeenCalledWith('/api/v1/friends/request', {
        userId: 'u-2',
      });
    });
  });

  describe('useRespondToFriendRequest', () => {
    it('accepts friend request', async () => {
      mockApi.patch.mockResolvedValueOnce({ id: 'req-1', status: 'accepted' });

      const { result } = renderHook(() => useRespondToFriendRequest(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ requestId: 'req-1', accept: true });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockApi.patch).toHaveBeenCalledWith('/api/v1/friends/requests/req-1', {
        accept: true,
      });
    });
  });

  describe('useRemoveFriend', () => {
    it('removes friend', async () => {
      mockApi.delete.mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useRemoveFriend(), {
        wrapper: createWrapper(),
      });

      result.current.mutate('fs-1');

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockApi.delete).toHaveBeenCalledWith('/api/v1/friends/fs-1');
    });
  });

  describe('useUserById', () => {
    it('fetches user when userId is defined', async () => {
      const user = {
        id: 'u-1',
        username: 'johndoe',
        avatarUrl: null,
        createdAt: '2024-01-01T00:00:00Z',
      };
      mockApi.get.mockResolvedValueOnce(user);

      const { result } = renderHook(() => useUserById('u-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockApi.get).toHaveBeenCalledWith('/api/v1/users/u-1');
      expect(result.current.data).toEqual(user);
    });

    it('does not fetch when userId is undefined', () => {
      renderHook(() => useUserById(undefined), { wrapper: createWrapper() });
      expect(mockApi.get).not.toHaveBeenCalled();
    });
  });
});
