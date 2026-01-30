/**
 * SocketContext Tests
 */

import AuthContext from '@/contexts/AuthContext';
import { SocketProvider } from '@/contexts/SocketContext';
import { useSocket } from '@/hooks/useSocket';
import { act, fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock socket instance
const createMockSocket = () => ({
  on: vi.fn().mockReturnThis(),
  emit: vi.fn(),
  disconnect: vi.fn(),
  connected: true,
});

let mockSocket = createMockSocket();
let mockIo = vi.fn(() => mockSocket);

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => mockIo()),
}));

// Mock token storage with controllable return value
let mockToken: string | null = 'test-token';
vi.mock('@/lib/api/client', () => ({
  tokenStorage: {
    getAccessToken: vi.fn(() => mockToken),
  },
}));

// Test component that uses the socket context
function TestConsumer() {
  const { isConnected, onlineUsers, typingUsers, joinRoom, leaveRoom, sendMessage, setTyping } =
    useSocket();

  return (
    <div>
      <span data-testid="connected">{isConnected ? 'connected' : 'disconnected'}</span>
      <span data-testid="online-users">{onlineUsers.length}</span>
      <span data-testid="online-list">{onlineUsers.join(',')}</span>
      <span data-testid="typing-users">{Object.keys(typingUsers).length}</span>
      <span data-testid="typing-list">{JSON.stringify(typingUsers)}</span>
      <button onClick={() => joinRoom('room-1')} data-testid="join-btn">
        Join
      </button>
      <button onClick={() => leaveRoom('room-1')} data-testid="leave-btn">
        Leave
      </button>
      <button onClick={() => sendMessage('room-1', 'Hello')} data-testid="send-btn">
        Send
      </button>
      <button onClick={() => setTyping('room-1', true)} data-testid="type-btn">
        Type
      </button>
    </div>
  );
}

function createAuthWrapper(isAuthenticated: boolean) {
  const authValue = {
    user: isAuthenticated
      ? {
          id: 'user-1',
          email: 'test@test.com',
          username: 'test',
          avatarUrl: null,
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z',
        }
      : null,
    isLoading: false,
    isAuthenticated,
    error: null,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    clearError: vi.fn(),
  };

  return ({ children }: { children: ReactNode }) => (
    <AuthContext.Provider value={authValue}>
      <SocketProvider>{children}</SocketProvider>
    </AuthContext.Provider>
  );
}

describe('SocketContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSocket = createMockSocket();
    mockIo = vi.fn(() => mockSocket);
    mockToken = 'test-token';
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should provide socket context to children', () => {
      const Wrapper = createAuthWrapper(false);
      render(<TestConsumer />, { wrapper: Wrapper });

      expect(screen.getByTestId('connected')).toBeInTheDocument();
      expect(screen.getByTestId('online-users')).toBeInTheDocument();
    });

    it('should show disconnected when not authenticated', () => {
      const Wrapper = createAuthWrapper(false);
      render(<TestConsumer />, { wrapper: Wrapper });

      expect(screen.getByTestId('connected')).toHaveTextContent('disconnected');
    });

    it('should not create socket when not authenticated', () => {
      const Wrapper = createAuthWrapper(false);
      render(<TestConsumer />, { wrapper: Wrapper });

      expect(mockIo).not.toHaveBeenCalled();
    });
  });

  describe('authentication and connection', () => {
    it('should connect when authenticated', async () => {
      const Wrapper = createAuthWrapper(true);

      await act(async () => {
        render(<TestConsumer />, { wrapper: Wrapper });
      });

      expect(mockIo).toHaveBeenCalled();
    });

    it('should not connect when no token available', async () => {
      mockToken = null;
      const Wrapper = createAuthWrapper(true);

      await act(async () => {
        render(<TestConsumer />, { wrapper: Wrapper });
      });

      // Should check for token before connecting
      expect(mockIo).not.toHaveBeenCalled();
    });

    it('should setup event listeners on connect', async () => {
      const Wrapper = createAuthWrapper(true);

      await act(async () => {
        render(<TestConsumer />, { wrapper: Wrapper });
      });

      expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('connect_error', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('ONLINE_USERS', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('USER_ONLINE', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('USER_OFFLINE', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('USER_TYPING', expect.any(Function));
    });

    it('should disconnect on unmount', async () => {
      const Wrapper = createAuthWrapper(true);

      const { unmount } = render(<TestConsumer />, { wrapper: Wrapper });

      await act(async () => {
        unmount();
      });

      expect(mockSocket.disconnect).toHaveBeenCalled();
    });
  });

  describe('socket events', () => {
    it('should handle connect event', async () => {
      const eventHandlers: Record<string, (...args: unknown[]) => void> = {};
      mockSocket.on.mockImplementation((event: string, handler: (...args: unknown[]) => void) => {
        eventHandlers[event] = handler;
        return mockSocket;
      });

      const Wrapper = createAuthWrapper(true);

      await act(async () => {
        render(<TestConsumer />, { wrapper: Wrapper });
      });

      // Simulate connect event
      await act(async () => {
        eventHandlers['connect']?.();
      });

      expect(screen.getByTestId('connected')).toHaveTextContent('connected');
    });

    it('should handle disconnect event', async () => {
      const eventHandlers: Record<string, (...args: unknown[]) => void> = {};
      mockSocket.on.mockImplementation((event: string, handler: (...args: unknown[]) => void) => {
        eventHandlers[event] = handler;
        return mockSocket;
      });

      const Wrapper = createAuthWrapper(true);

      await act(async () => {
        render(<TestConsumer />, { wrapper: Wrapper });
      });

      // First connect, then disconnect
      await act(async () => {
        eventHandlers['connect']?.();
      });
      expect(screen.getByTestId('connected')).toHaveTextContent('connected');

      await act(async () => {
        eventHandlers['disconnect']?.();
      });
      expect(screen.getByTestId('connected')).toHaveTextContent('disconnected');
    });

    it('should handle connect_error event', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const eventHandlers: Record<string, (...args: unknown[]) => void> = {};
      mockSocket.on.mockImplementation((event: string, handler: (...args: unknown[]) => void) => {
        eventHandlers[event] = handler;
        return mockSocket;
      });

      const Wrapper = createAuthWrapper(true);

      await act(async () => {
        render(<TestConsumer />, { wrapper: Wrapper });
      });

      // Simulate connect error
      await act(async () => {
        eventHandlers['connect_error']?.({ message: 'Connection failed' });
      });

      expect(consoleSpy).toHaveBeenCalledWith('[Socket] Connection error:', 'Connection failed');
      consoleSpy.mockRestore();
    });

    it('should handle ONLINE_USERS event', async () => {
      const eventHandlers: Record<string, (...args: unknown[]) => void> = {};
      mockSocket.on.mockImplementation((event: string, handler: (...args: unknown[]) => void) => {
        eventHandlers[event] = handler;
        return mockSocket;
      });

      const Wrapper = createAuthWrapper(true);

      await act(async () => {
        render(<TestConsumer />, { wrapper: Wrapper });
      });

      await act(async () => {
        eventHandlers['ONLINE_USERS']?.({ users: ['user-1', 'user-2', 'user-3'] });
      });

      expect(screen.getByTestId('online-users')).toHaveTextContent('3');
      expect(screen.getByTestId('online-list')).toHaveTextContent('user-1,user-2,user-3');
    });

    it('should handle USER_ONLINE event - add new user', async () => {
      const eventHandlers: Record<string, (...args: unknown[]) => void> = {};
      mockSocket.on.mockImplementation((event: string, handler: (...args: unknown[]) => void) => {
        eventHandlers[event] = handler;
        return mockSocket;
      });

      const Wrapper = createAuthWrapper(true);

      await act(async () => {
        render(<TestConsumer />, { wrapper: Wrapper });
      });

      // Add a user
      await act(async () => {
        eventHandlers['USER_ONLINE']?.({ userId: 'new-user' });
      });

      expect(screen.getByTestId('online-list')).toHaveTextContent('new-user');
    });

    it('should handle USER_ONLINE event - not duplicate existing user', async () => {
      const eventHandlers: Record<string, (...args: unknown[]) => void> = {};
      mockSocket.on.mockImplementation((event: string, handler: (...args: unknown[]) => void) => {
        eventHandlers[event] = handler;
        return mockSocket;
      });

      const Wrapper = createAuthWrapper(true);

      await act(async () => {
        render(<TestConsumer />, { wrapper: Wrapper });
      });

      // Set initial users
      await act(async () => {
        eventHandlers['ONLINE_USERS']?.({ users: ['user-1'] });
      });

      // Try to add same user again
      await act(async () => {
        eventHandlers['USER_ONLINE']?.({ userId: 'user-1' });
      });

      expect(screen.getByTestId('online-users')).toHaveTextContent('1');
    });

    it('should handle USER_OFFLINE event', async () => {
      const eventHandlers: Record<string, (...args: unknown[]) => void> = {};
      mockSocket.on.mockImplementation((event: string, handler: (...args: unknown[]) => void) => {
        eventHandlers[event] = handler;
        return mockSocket;
      });

      const Wrapper = createAuthWrapper(true);

      await act(async () => {
        render(<TestConsumer />, { wrapper: Wrapper });
      });

      // Set initial users
      await act(async () => {
        eventHandlers['ONLINE_USERS']?.({ users: ['user-1', 'user-2'] });
      });
      expect(screen.getByTestId('online-users')).toHaveTextContent('2');

      // Remove user
      await act(async () => {
        eventHandlers['USER_OFFLINE']?.({ userId: 'user-1' });
      });

      expect(screen.getByTestId('online-users')).toHaveTextContent('1');
      expect(screen.getByTestId('online-list')).toHaveTextContent('user-2');
    });

    it('should remove typing user when they go offline', async () => {
      const eventHandlers: Record<string, (...args: unknown[]) => void> = {};
      mockSocket.on.mockImplementation((event: string, handler: (...args: unknown[]) => void) => {
        eventHandlers[event] = handler;
        return mockSocket;
      });

      const Wrapper = createAuthWrapper(true);

      await act(async () => {
        render(<TestConsumer />, { wrapper: Wrapper });
      });

      // User starts typing
      await act(async () => {
        eventHandlers['USER_TYPING']?.({ userId: 'user-1', roomId: 'room-1', isTyping: true });
      });
      expect(screen.getByTestId('typing-users')).toHaveTextContent('1');

      // User goes offline
      await act(async () => {
        eventHandlers['USER_OFFLINE']?.({ userId: 'user-1' });
      });
      expect(screen.getByTestId('typing-users')).toHaveTextContent('0');
    });

    it('should handle USER_TYPING event - start typing', async () => {
      const eventHandlers: Record<string, (...args: unknown[]) => void> = {};
      mockSocket.on.mockImplementation((event: string, handler: (...args: unknown[]) => void) => {
        eventHandlers[event] = handler;
        return mockSocket;
      });

      const Wrapper = createAuthWrapper(true);

      await act(async () => {
        render(<TestConsumer />, { wrapper: Wrapper });
      });

      await act(async () => {
        eventHandlers['USER_TYPING']?.({ userId: 'user-1', roomId: 'room-1', isTyping: true });
      });

      expect(screen.getByTestId('typing-users')).toHaveTextContent('1');
      expect(screen.getByTestId('typing-list')).toHaveTextContent('"user-1":"room-1"');
    });

    it('should handle USER_TYPING event - stop typing', async () => {
      const eventHandlers: Record<string, (...args: unknown[]) => void> = {};
      mockSocket.on.mockImplementation((event: string, handler: (...args: unknown[]) => void) => {
        eventHandlers[event] = handler;
        return mockSocket;
      });

      const Wrapper = createAuthWrapper(true);

      await act(async () => {
        render(<TestConsumer />, { wrapper: Wrapper });
      });

      // Start typing
      await act(async () => {
        eventHandlers['USER_TYPING']?.({ userId: 'user-1', roomId: 'room-1', isTyping: true });
      });
      expect(screen.getByTestId('typing-users')).toHaveTextContent('1');

      // Stop typing
      await act(async () => {
        eventHandlers['USER_TYPING']?.({ userId: 'user-1', roomId: 'room-1', isTyping: false });
      });
      expect(screen.getByTestId('typing-users')).toHaveTextContent('0');
    });
  });

  describe('socket actions', () => {
    it('should emit JOIN_ROOM when calling joinRoom', async () => {
      const eventHandlers: Record<string, (...args: unknown[]) => void> = {};
      mockSocket.on.mockImplementation((event: string, handler: (...args: unknown[]) => void) => {
        eventHandlers[event] = handler;
        return mockSocket;
      });

      const Wrapper = createAuthWrapper(true);

      await act(async () => {
        render(<TestConsumer />, { wrapper: Wrapper });
      });

      // Connect first
      await act(async () => {
        eventHandlers['connect']?.();
      });

      // Click join button
      await act(async () => {
        fireEvent.click(screen.getByTestId('join-btn'));
      });

      expect(mockSocket.emit).toHaveBeenCalledWith('JOIN_ROOM', { roomId: 'room-1' });
    });

    it('should emit LEAVE_ROOM when calling leaveRoom', async () => {
      const eventHandlers: Record<string, (...args: unknown[]) => void> = {};
      mockSocket.on.mockImplementation((event: string, handler: (...args: unknown[]) => void) => {
        eventHandlers[event] = handler;
        return mockSocket;
      });

      const Wrapper = createAuthWrapper(true);

      await act(async () => {
        render(<TestConsumer />, { wrapper: Wrapper });
      });

      // Connect first
      await act(async () => {
        eventHandlers['connect']?.();
      });

      // Click leave button
      await act(async () => {
        fireEvent.click(screen.getByTestId('leave-btn'));
      });

      expect(mockSocket.emit).toHaveBeenCalledWith('LEAVE_ROOM', { roomId: 'room-1' });
    });

    it('should emit MESSAGE when calling sendMessage', async () => {
      const eventHandlers: Record<string, (...args: unknown[]) => void> = {};
      mockSocket.on.mockImplementation((event: string, handler: (...args: unknown[]) => void) => {
        eventHandlers[event] = handler;
        return mockSocket;
      });

      const Wrapper = createAuthWrapper(true);

      await act(async () => {
        render(<TestConsumer />, { wrapper: Wrapper });
      });

      // Connect first
      await act(async () => {
        eventHandlers['connect']?.();
      });

      // Click send button
      await act(async () => {
        fireEvent.click(screen.getByTestId('send-btn'));
      });

      expect(mockSocket.emit).toHaveBeenCalledWith('MESSAGE', {
        roomId: 'room-1',
        content: 'Hello',
      });
    });

    it('should emit TYPING when calling setTyping', async () => {
      const eventHandlers: Record<string, (...args: unknown[]) => void> = {};
      mockSocket.on.mockImplementation((event: string, handler: (...args: unknown[]) => void) => {
        eventHandlers[event] = handler;
        return mockSocket;
      });

      const Wrapper = createAuthWrapper(true);

      await act(async () => {
        render(<TestConsumer />, { wrapper: Wrapper });
      });

      // Connect first
      await act(async () => {
        eventHandlers['connect']?.();
      });

      // Click type button
      await act(async () => {
        fireEvent.click(screen.getByTestId('type-btn'));
      });

      expect(mockSocket.emit).toHaveBeenCalledWith('TYPING', { roomId: 'room-1', isTyping: true });
    });

    it('should not emit when not connected', async () => {
      const Wrapper = createAuthWrapper(true);

      await act(async () => {
        render(<TestConsumer />, { wrapper: Wrapper });
      });

      // Don't trigger connect event - socket exists but isConnected is false

      // Try to emit
      await act(async () => {
        fireEvent.click(screen.getByTestId('join-btn'));
        fireEvent.click(screen.getByTestId('leave-btn'));
        fireEvent.click(screen.getByTestId('send-btn'));
        fireEvent.click(screen.getByTestId('type-btn'));
      });

      // Should not emit any events because not connected
      expect(mockSocket.emit).not.toHaveBeenCalled();
    });
  });

  describe('logout behavior', () => {
    it('should disconnect socket when auth changes to false', async () => {
      // This test verifies the cleanup when isAuthenticated changes
      // We need to test with rerender

      let isAuth = true;
      const authValue = {
        user: {
          id: 'user-1',
          email: 'test@test.com',
          username: 'test',
          avatarUrl: null,
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z',
        },
        isLoading: false,
        isAuthenticated: true,
        error: null,
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        clearError: vi.fn(),
      };

      const DynamicWrapper = ({ children }: { children: ReactNode }) => (
        <AuthContext.Provider
          value={{ ...authValue, isAuthenticated: isAuth, user: isAuth ? authValue.user : null }}
        >
          <SocketProvider>{children}</SocketProvider>
        </AuthContext.Provider>
      );

      const { rerender } = render(<TestConsumer />, { wrapper: DynamicWrapper });

      // Should have connected
      expect(mockIo).toHaveBeenCalled();

      // Simulate logout
      isAuth = false;
      await act(async () => {
        rerender(<TestConsumer />);
      });

      // Socket should have been disconnected
      expect(mockSocket.disconnect).toHaveBeenCalled();
    });
  });
});
