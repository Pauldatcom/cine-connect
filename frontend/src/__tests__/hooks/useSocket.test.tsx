/**
 * useSocket Hook Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { SocketContext, type SocketContextValue } from '@/contexts/SocketContext';
import {
  useSocket,
  useOnlineUsers,
  useSocketConnected,
  useIsUserOnline,
  useTypingIndicator,
  useTypingUsers,
} from '@/hooks/useSocket';

// Suppress console.error for expected error tests
const originalConsoleError = console.error;

const mockSocketContext: SocketContextValue = {
  socket: null,
  isConnected: true,
  onlineUsers: ['user-1', 'user-2'],
  typingUsers: { 'user-1': 'room-1' },
  joinRoom: vi.fn(),
  leaveRoom: vi.fn(),
  sendMessage: vi.fn(),
  setTyping: vi.fn(),
};

function createWrapper(contextValue: SocketContextValue | null = mockSocketContext) {
  return ({ children }: { children: ReactNode }) => (
    <SocketContext.Provider value={contextValue}>{children}</SocketContext.Provider>
  );
}

describe('useSocket hooks', () => {
  describe('useSocket', () => {
    it('should return the socket context', () => {
      const { result } = renderHook(() => useSocket(), { wrapper: createWrapper() });

      expect(result.current).toEqual(mockSocketContext);
    });

    it('should throw when used outside SocketProvider', () => {
      // Suppress expected React error boundary logs for this test
      console.error = vi.fn();

      try {
        expect(() => {
          renderHook(() => useSocket(), { wrapper: createWrapper(null) });
        }).toThrow('useSocket must be used within a SocketProvider');
      } finally {
        console.error = originalConsoleError;
      }
    });
  });

  describe('useOnlineUsers', () => {
    it('should return online users list', () => {
      const { result } = renderHook(() => useOnlineUsers(), { wrapper: createWrapper() });

      expect(result.current).toEqual(['user-1', 'user-2']);
    });
  });

  describe('useSocketConnected', () => {
    it('should return connection status', () => {
      const { result } = renderHook(() => useSocketConnected(), { wrapper: createWrapper() });

      expect(result.current).toBe(true);
    });

    it('should return false when disconnected', () => {
      const disconnectedContext = { ...mockSocketContext, isConnected: false };
      const { result } = renderHook(() => useSocketConnected(), {
        wrapper: createWrapper(disconnectedContext),
      });

      expect(result.current).toBe(false);
    });
  });

  describe('useIsUserOnline', () => {
    it('should return true for online user', () => {
      const { result } = renderHook(() => useIsUserOnline('user-1'), { wrapper: createWrapper() });

      expect(result.current).toBe(true);
    });

    it('should return false for offline user', () => {
      const { result } = renderHook(() => useIsUserOnline('user-3'), { wrapper: createWrapper() });

      expect(result.current).toBe(false);
    });
  });

  describe('useTypingIndicator', () => {
    it('should return room when user is typing', () => {
      const { result } = renderHook(() => useTypingIndicator('user-1'), {
        wrapper: createWrapper(),
      });

      expect(result.current).toBe('room-1');
    });

    it('should return null when user is not typing', () => {
      const { result } = renderHook(() => useTypingIndicator('user-2'), {
        wrapper: createWrapper(),
      });

      expect(result.current).toBeNull();
    });
  });

  describe('useTypingUsers', () => {
    it('should return all typing users', () => {
      const { result } = renderHook(() => useTypingUsers(), { wrapper: createWrapper() });

      expect(result.current).toEqual({ 'user-1': 'room-1' });
    });
  });
});
