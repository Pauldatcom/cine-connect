/**
 * useConversations Hook Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import {
  useConversations,
  useMessages,
  useSendMessage,
  useMarkMessagesRead,
} from '@/hooks/useConversations';

// Mock the API client
vi.mock('@/lib/api/client', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

import { api } from '@/lib/api/client';

const mockApi = api as unknown as {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
  patch: ReturnType<typeof vi.fn>;
};

const mockConversation = {
  partnerId: 'user-1',
  partner: {
    id: 'user-1',
    username: 'TestUser',
    avatarUrl: null,
  },
  lastMessage: {
    id: 'msg-1',
    senderId: 'user-1',
    receiverId: 'me',
    content: 'Hello!',
    read: false,
    createdAt: '2024-01-01T00:00:00Z',
  },
  unreadCount: 1,
};

const mockMessage = {
  id: 'msg-1',
  senderId: 'user-1',
  receiverId: 'me',
  content: 'Hello!',
  read: false,
  createdAt: '2024-01-01T00:00:00Z',
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('useConversations hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useConversations', () => {
    it('should fetch conversations', async () => {
      mockApi.get.mockResolvedValue({ success: true, data: [mockConversation] });

      const { result } = renderHook(() => useConversations(), { wrapper: createWrapper() });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockApi.get).toHaveBeenCalledWith('/api/v1/messages');
      expect(result.current.data).toEqual([mockConversation]);
    });
  });

  describe('useMessages', () => {
    it('should fetch messages with a user', async () => {
      mockApi.get.mockResolvedValue({
        success: true,
        data: { items: [mockMessage], page: 1, pageSize: 50 },
      });

      const { result } = renderHook(() => useMessages('user-1'), { wrapper: createWrapper() });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockApi.get).toHaveBeenCalledWith('/api/v1/messages/user-1');
      expect(result.current.data).toEqual([mockMessage]);
    });

    it('should not fetch when userId is undefined', () => {
      renderHook(() => useMessages(undefined), { wrapper: createWrapper() });

      expect(mockApi.get).not.toHaveBeenCalled();
    });
  });

  describe('useSendMessage', () => {
    it('should send a message', async () => {
      mockApi.post.mockResolvedValue(mockMessage);

      const { result } = renderHook(() => useSendMessage(), { wrapper: createWrapper() });

      result.current.mutate({ receiverId: 'user-1', content: 'Hello!' });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockApi.post).toHaveBeenCalledWith('/api/v1/messages', {
        receiverId: 'user-1',
        content: 'Hello!',
      });
    });
  });

  describe('useMarkMessagesRead', () => {
    it('should mark messages as read', async () => {
      mockApi.patch.mockResolvedValue(undefined);

      const { result } = renderHook(() => useMarkMessagesRead(), { wrapper: createWrapper() });

      result.current.mutate('user-1');

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockApi.patch).toHaveBeenCalledWith('/api/v1/messages/user-1/read');
    });
  });
});
