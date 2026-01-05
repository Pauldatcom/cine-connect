import { WS_EVENTS } from '@cine-connect/shared';
import jwt from 'jsonwebtoken';
import type { Server, Socket } from 'socket.io';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

// Track online users
const onlineUsers = new Map<string, string>(); // socketId -> userId

// Rate limiting: track message timestamps per user
const messageRateLimits = new Map<string, number[]>(); // userId -> timestamps
const RATE_LIMIT_WINDOW_MS = 10000; // 10 seconds
const RATE_LIMIT_MAX_MESSAGES = 20; // Max 20 messages per 10 seconds

/**
 * Check if user is rate limited
 */
function isRateLimited(userId: string): boolean {
  const now = Date.now();
  const userMessages = messageRateLimits.get(userId) || [];

  // Filter out old timestamps
  const recentMessages = userMessages.filter((ts) => now - ts < RATE_LIMIT_WINDOW_MS);

  if (recentMessages.length >= RATE_LIMIT_MAX_MESSAGES) {
    return true;
  }

  // Add current timestamp
  recentMessages.push(now);
  messageRateLimits.set(userId, recentMessages);

  return false;
}

/**
 * Sanitize message content - prevent XSS
 */
function sanitizeContent(content: unknown): string {
  if (typeof content !== 'string') {
    return '';
  }

  // Limit length
  const trimmed = content.trim().slice(0, 2000);

  // Basic HTML entity encoding
  return trimmed
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/**
 * Validate room ID format (should be a valid conversation pattern)
 */
function isValidRoomId(roomId: unknown): boolean {
  if (typeof roomId !== 'string') return false;
  // Room ID should be a UUID or a conversation pattern like "user1_user2"
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const conversationPattern = /^[0-9a-f-]+_[0-9a-f-]+$/i;
  return uuidPattern.test(roomId) || conversationPattern.test(roomId);
}

/**
 * Check if user can access a room (their ID should be part of the room)
 */
function canAccessRoom(userId: string, roomId: string): boolean {
  // Room should contain the user's ID (conversation between two users)
  return roomId.includes(userId);
}

/**
 * Logger that respects environment
 */
function log(message: string): void {
  if (process.env.NODE_ENV !== 'production') {
    console.log(message);
  }
}

/**
 * Get JWT secret from environment - throws if not set
 * Who should not return the secret like this improve this
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
    log(`[Socket] User connected: ${socket.userId}`);

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
      // Validate room ID format
      if (!isValidRoomId(roomId)) {
        socket.emit('error', { message: 'Invalid room ID format' });
        return;
      }

      // Check if user has access to this room
      if (socket.userId && !canAccessRoom(socket.userId, roomId)) {
        socket.emit('error', { message: 'Access denied to this room' });
        return;
      }

      socket.join(`room:${roomId}`);
      log(`[Socket] User ${socket.userId} joined room: ${roomId}`);
    });

    // Handle leaving a conversation room
    socket.on(WS_EVENTS.LEAVE_ROOM, (roomId: string) => {
      if (!isValidRoomId(roomId)) return;

      socket.leave(`room:${roomId}`);
      log(`[Socket] User ${socket.userId} left room: ${roomId}`);
    });

    // Handle sending messages
    socket.on(WS_EVENTS.MESSAGE, (data: { receiverId: string; content: string }) => {
      if (!socket.userId) return;

      // Rate limiting check
      if (isRateLimited(socket.userId)) {
        socket.emit('error', { message: 'Rate limit exceeded. Please slow down.' });
        return;
      }

      const { receiverId, content } = data;

      // Validate receiver ID
      if (typeof receiverId !== 'string' || !receiverId.trim()) {
        socket.emit('error', { message: 'Invalid receiver ID' });
        return;
      }

      // Sanitize content
      const sanitizedContent = sanitizeContent(content);
      if (!sanitizedContent) {
        socket.emit('error', { message: 'Message content is required' });
        return;
      }

      // Emit to receiver's private room
      io.to(`user:${receiverId}`).emit(WS_EVENTS.MESSAGE, {
        senderId: socket.userId,
        content: sanitizedContent,
        createdAt: new Date().toISOString(),
      });

      log(`[Socket] Message from ${socket.userId} to ${receiverId}`);
    });

    // Handle typing indicator
    socket.on(WS_EVENTS.TYPING, (data: { receiverId: string; isTyping: boolean }) => {
      if (!socket.userId) return;

      const { receiverId, isTyping } = data;

      // Validate inputs
      if (typeof receiverId !== 'string' || typeof isTyping !== 'boolean') {
        return;
      }

      io.to(`user:${receiverId}`).emit(WS_EVENTS.TYPING, {
        userId: socket.userId,
        isTyping,
      });
    });

    // Handle disconnect
    socket.on(WS_EVENTS.DISCONNECT, () => {
      log(`[Socket] User disconnected: ${socket.userId}`);

      if (socket.userId) {
        onlineUsers.delete(socket.id);
        // Clean up rate limit data
        messageRateLimits.delete(socket.userId);

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

// Export security functions for testing
export const _testExports = {
  isRateLimited,
  sanitizeContent,
  isValidRoomId,
  canAccessRoom,
  messageRateLimits,
};
