import type { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { WS_EVENTS } from '@cine-connect/shared';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

// Track online users
const onlineUsers = new Map<string, string>(); // socketId -> userId

/**
 * Get JWT secret from environment - throws if not set
 */
function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  return secret;
}

/**
 * Setup WebSocket event handlers
 */
export function setupSocketHandlers(io: Server): void {
  // Authentication middleware for WebSocket
  io.use((socket: AuthenticatedSocket, next) => {
    const token =
      socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(token, getJwtSecret()) as { userId: string };
      socket.userId = decoded.userId;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on(WS_EVENTS.CONNECT, (socket: AuthenticatedSocket) => {
    console.log(`🔌 User connected: ${socket.userId}`);

    if (socket.userId) {
      // Track user as online
      onlineUsers.set(socket.id, socket.userId);

      // Join user's private room
      socket.join(`user:${socket.userId}`);

      // Broadcast online status
      socket.broadcast.emit(WS_EVENTS.ONLINE, {
        userId: socket.userId,
        online: true,
      });
    }

    // Handle joining a conversation room
    socket.on(WS_EVENTS.JOIN_ROOM, (roomId: string) => {
      socket.join(`room:${roomId}`);
      console.log(`User ${socket.userId} joined room: ${roomId}`);
    });

    // Handle leaving a conversation room
    socket.on(WS_EVENTS.LEAVE_ROOM, (roomId: string) => {
      socket.leave(`room:${roomId}`);
      console.log(`User ${socket.userId} left room: ${roomId}`);
    });

    // Handle sending messages
    socket.on(WS_EVENTS.MESSAGE, (data: { receiverId: string; content: string }) => {
      const { receiverId, content } = data;

      // Emit to receiver's private room
      io.to(`user:${receiverId}`).emit(WS_EVENTS.MESSAGE, {
        senderId: socket.userId,
        content,
        createdAt: new Date().toISOString(),
      });

      console.log(`Message from ${socket.userId} to ${receiverId}`);
    });

    // Handle typing indicator
    socket.on(WS_EVENTS.TYPING, (data: { receiverId: string; isTyping: boolean }) => {
      const { receiverId, isTyping } = data;

      io.to(`user:${receiverId}`).emit(WS_EVENTS.TYPING, {
        userId: socket.userId,
        isTyping,
      });
    });

    // Handle disconnect
    socket.on(WS_EVENTS.DISCONNECT, () => {
      console.log(`🔌 User disconnected: ${socket.userId}`);

      if (socket.userId) {
        onlineUsers.delete(socket.id);

        // Broadcast offline status
        socket.broadcast.emit(WS_EVENTS.ONLINE, {
          userId: socket.userId,
          online: false,
        });
      }
    });
  });
}

/**
 * Get list of online user IDs
 */
export function getOnlineUsers(): string[] {
  return Array.from(new Set(onlineUsers.values()));
}

/**
 * Check if a user is online
 */
export function isUserOnline(userId: string): boolean {
  return Array.from(onlineUsers.values()).includes(userId);
}
