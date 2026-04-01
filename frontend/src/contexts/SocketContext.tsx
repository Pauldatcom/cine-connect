/**
 * Socket Context — Socket.IO client aligned with backend/src/socket (WS_EVENTS from shared).
 *
 * - Emits use the same event names as the server expects (e.g. join_room, typing with receiverId).
 * - Listens for server events: connect, disconnect, online, message, typing.
 */

import { WS_EVENTS } from '@cine-connect/shared';
import { useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useEffect, useState, type ReactNode } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { tokenStorage } from '@/lib/api/client';

export interface SocketContextValue {
  socket: Socket | null;
  isConnected: boolean;
  onlineUsers: string[];
  /** userId of the person typing → truthy value while they are typing */
  typingUsers: Record<string, string>;
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
  /** Prefer REST useSendMessage for persistence; this matches server socket relay shape. */
  sendMessage: (receiverId: string, content: string) => void;
  /** Notify peer (receiverId) that you are typing; must match backend { receiverId, isTyping }. */
  setTyping: (receiverId: string, isTyping: boolean) => void;
}

export const SocketContext = createContext<SocketContextValue | null>(null);

interface SocketProviderProps {
  children: ReactNode;
}

export function SocketProvider({ children }: SocketProviderProps) {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isAuthenticated) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
        setOnlineUsers([]);
        setTypingUsers({});
      }
      return;
    }

    const token = tokenStorage.getAccessToken();
    if (!token) return;

    const rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const socketUrl = new URL(rawUrl).origin;
    const newSocket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('[Socket] Connection error:', error.message);
    });

    // Backend: io.emit(WS_EVENTS.ONLINE, { userId, online: boolean })
    newSocket.on(WS_EVENTS.ONLINE, ({ userId, online }: { userId: string; online: boolean }) => {
      setOnlineUsers((prev) => {
        if (online) {
          return prev.includes(userId) ? prev : [...prev, userId];
        }
        return prev.filter((id) => id !== userId);
      });
      if (!online) {
        setTypingUsers((prev) => {
          const next = { ...prev };
          delete next[userId];
          return next;
        });
      }
    });

    // Real-time DM relay (HTTP POST still persists); refresh thread when a message arrives
    newSocket.on(
      WS_EVENTS.MESSAGE,
      (payload: { senderId: string; content: string; createdAt: string }) => {
        queryClient.invalidateQueries({ queryKey: ['messages', payload.senderId] });
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      }
    );

    // Backend: { userId, isTyping } — userId is the person typing
    newSocket.on(
      WS_EVENTS.TYPING,
      ({ userId, isTyping }: { userId: string; isTyping: boolean }) => {
        setTypingUsers((prev) => {
          if (isTyping) {
            return { ...prev, [userId]: 'typing' };
          }
          const next = { ...prev };
          delete next[userId];
          return next;
        });
      }
    );

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, queryClient]);

  const joinRoom = useCallback(
    (roomId: string) => {
      if (socket && isConnected) {
        socket.emit(WS_EVENTS.JOIN_ROOM, { roomId });
      }
    },
    [socket, isConnected]
  );

  const leaveRoom = useCallback(
    (roomId: string) => {
      if (socket && isConnected) {
        socket.emit(WS_EVENTS.LEAVE_ROOM, { roomId });
      }
    },
    [socket, isConnected]
  );

  const sendMessage = useCallback(
    (receiverId: string, content: string) => {
      if (socket && isConnected) {
        socket.emit(WS_EVENTS.MESSAGE, { receiverId, content });
      }
    },
    [socket, isConnected]
  );

  const setTyping = useCallback(
    (receiverId: string, isTyping: boolean) => {
      if (socket && isConnected) {
        socket.emit(WS_EVENTS.TYPING, { receiverId, isTyping });
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
