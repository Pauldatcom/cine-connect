/**
 * Socket Context - Real-time socket.io connection management
 *
 * Provides socket instance and connection state to the entire app.
 * Connects automatically when user is authenticated.
 */

import { createContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { tokenStorage } from '@/lib/api/client';

// Socket event types (match backend)
export interface SocketEvents {
  // Client -> Server
  JOIN_ROOM: { roomId: string };
  LEAVE_ROOM: { roomId: string };
  MESSAGE: { roomId: string; content: string };
  TYPING: { roomId: string; isTyping: boolean };

  // Server -> Client
  USER_JOINED: { userId: string; roomId: string };
  USER_LEFT: { userId: string; roomId: string };
  NEW_MESSAGE: { id: string; senderId: string; content: string; createdAt: string };
  USER_TYPING: { userId: string; roomId: string; isTyping: boolean };
  USER_ONLINE: { userId: string };
  USER_OFFLINE: { userId: string };
  ONLINE_USERS: { users: string[] };
}

// Context value type
export interface SocketContextValue {
  socket: Socket | null;
  isConnected: boolean;
  onlineUsers: string[];
  typingUsers: Record<string, string>; // userId -> roomId
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
  sendMessage: (roomId: string, content: string) => void;
  setTyping: (roomId: string, isTyping: boolean) => void;
}

// Create context with default values
export const SocketContext = createContext<SocketContextValue | null>(null);

// Provider props
interface SocketProviderProps {
  children: ReactNode;
}

/**
 * Socket Provider - Wraps app to provide socket connection
 */
export function SocketProvider({ children }: SocketProviderProps) {
  const { isAuthenticated } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({});

  // Connect/disconnect based on auth state
  useEffect(() => {
    if (!isAuthenticated) {
      // Disconnect if logged out
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
        setOnlineUsers([]);
        setTypingUsers({});
      }
      return;
    }

    // Get token for auth
    const token = tokenStorage.getAccessToken();
    if (!token) return;

    // Create socket connection
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const newSocket = io(apiUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    // Connection handlers
    newSocket.on('connect', () => {
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('[Socket] Connection error:', error.message);
    });

    // Online users handlers
    newSocket.on('ONLINE_USERS', ({ users }) => {
      setOnlineUsers(users);
    });

    newSocket.on('USER_ONLINE', ({ userId }) => {
      setOnlineUsers((prev) => (prev.includes(userId) ? prev : [...prev, userId]));
    });

    newSocket.on('USER_OFFLINE', ({ userId }) => {
      setOnlineUsers((prev) => prev.filter((id) => id !== userId));
      // Also remove from typing users
      setTypingUsers((prev) => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
    });

    // Typing indicator handler
    newSocket.on('USER_TYPING', ({ userId, roomId, isTyping }) => {
      setTypingUsers((prev) => {
        if (isTyping) {
          return { ...prev, [userId]: roomId };
        } else {
          const next = { ...prev };
          delete next[userId];
          return next;
        }
      });
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      newSocket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // Join a room (conversation)
  const joinRoom = useCallback(
    (roomId: string) => {
      if (socket && isConnected) {
        socket.emit('JOIN_ROOM', { roomId });
      }
    },
    [socket, isConnected]
  );

  // Leave a room
  const leaveRoom = useCallback(
    (roomId: string) => {
      if (socket && isConnected) {
        socket.emit('LEAVE_ROOM', { roomId });
      }
    },
    [socket, isConnected]
  );

  // Send a message to a room
  const sendMessage = useCallback(
    (roomId: string, content: string) => {
      if (socket && isConnected) {
        socket.emit('MESSAGE', { roomId, content });
      }
    },
    [socket, isConnected]
  );

  // Set typing indicator
  const setTyping = useCallback(
    (roomId: string, isTyping: boolean) => {
      if (socket && isConnected) {
        socket.emit('TYPING', { roomId, isTyping });
      }
    },
    [socket, isConnected]
  );

  const value: SocketContextValue = {
    socket,
    isConnected,
    onlineUsers,
    typingUsers,
    joinRoom,
    leaveRoom,
    sendMessage,
    setTyping,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export default SocketContext;
