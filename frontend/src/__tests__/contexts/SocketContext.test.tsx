/**
 * SocketContext Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { SocketProvider } from '@/contexts/SocketContext';
import { useSocket } from '@/hooks/useSocket';
import AuthContext from '@/contexts/AuthContext';
import type { ReactNode } from 'react';

// Mock socket.io-client
const mockSocket = {
  on: vi.fn(),
  emit: vi.fn(),
  disconnect: vi.fn(),
  connected: true,
};

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => mockSocket),
}));

// Mock token storage
vi.mock('@/lib/api/client', () => ({
  tokenStorage: {
    getAccessToken: vi.fn(() => 'test-token'),
  },
}));

// Test component that uses the socket context
function TestConsumer() {
  const { isConnected, onlineUsers, joinRoom, leaveRoom, sendMessage, setTyping } = useSocket();

  return (
    <div>
      <span data-testid="connected">{isConnected ? 'connected' : 'disconnected'}</span>
      <span data-testid="online-users">{onlineUsers.length}</span>
      <button onClick={() => joinRoom('room-1')}>Join</button>
      <button onClick={() => leaveRoom('room-1')}>Leave</button>
      <button onClick={() => sendMessage('room-1', 'Hello')}>Send</button>
      <button onClick={() => setTyping('room-1', true)}>Type</button>
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
    // Reset mock socket handlers
    mockSocket.on.mockImplementation(() => mockSocket);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

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

  it('should connect when authenticated', async () => {
    const Wrapper = createAuthWrapper(true);

    await act(async () => {
      render(<TestConsumer />, { wrapper: Wrapper });
    });

    // Socket.io should be initialized
    const { io } = await import('socket.io-client');
    expect(io).toHaveBeenCalled();
  });

  it('should setup event listeners on connect', async () => {
    const Wrapper = createAuthWrapper(true);

    await act(async () => {
      render(<TestConsumer />, { wrapper: Wrapper });
    });

    // Check that event listeners were setup
    expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('connect_error', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('ONLINE_USERS', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('USER_ONLINE', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('USER_OFFLINE', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('USER_TYPING', expect.any(Function));
  });

  it('should handle connect event', async () => {
    // Store the connect handler
    let connectHandler: (() => void) | undefined;
    mockSocket.on.mockImplementation((event, handler) => {
      if (event === 'connect') {
        connectHandler = handler;
      }
      return mockSocket;
    });

    const Wrapper = createAuthWrapper(true);

    await act(async () => {
      render(<TestConsumer />, { wrapper: Wrapper });
    });

    // Simulate connect event
    if (connectHandler) {
      await act(async () => {
        connectHandler?.();
      });
    }

    expect(screen.getByTestId('connected')).toHaveTextContent('connected');
  });

  it('should handle ONLINE_USERS event', async () => {
    let onlineUsersHandler: ((data: { users: string[] }) => void) | undefined;
    mockSocket.on.mockImplementation((event, handler) => {
      if (event === 'ONLINE_USERS') {
        onlineUsersHandler = handler;
      }
      return mockSocket;
    });

    const Wrapper = createAuthWrapper(true);

    await act(async () => {
      render(<TestConsumer />, { wrapper: Wrapper });
    });

    // Simulate online users event
    if (onlineUsersHandler) {
      await act(async () => {
        onlineUsersHandler?.({ users: ['user-1', 'user-2', 'user-3'] });
      });
    }

    expect(screen.getByTestId('online-users')).toHaveTextContent('3');
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
