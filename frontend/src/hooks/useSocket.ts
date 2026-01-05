/**
 * useSocket - Custom hooks for Socket.io integration
 *
 * These hooks provide access to the socket context and
 * expose socket-related state like online users and typing indicators.
 */

import { useContext } from 'react';
import { SocketContext, type SocketContextValue } from '@/contexts/SocketContext';

/**
 * Access the socket context
 * Must be used within a SocketProvider
 */
export function useSocket(): SocketContextValue {
  const context = useContext(SocketContext);

  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }

  return context;
}

/**
 * Get list of online user IDs
 */
export function useOnlineUsers(): string[] {
  const { onlineUsers } = useSocket();
  return onlineUsers;
}

/**
 * Check if socket is connected
 */
export function useSocketConnected(): boolean {
  const { isConnected } = useSocket();
  return isConnected;
}

/**
 * Check if a specific user is online
 */
export function useIsUserOnline(userId: string): boolean {
  const { onlineUsers } = useSocket();
  return onlineUsers.includes(userId);
}

/**
 * Check if a specific user is typing
 * Returns the room/conversation they're typing in, or null if not typing
 */
export function useTypingIndicator(userId: string): string | null {
  const { typingUsers } = useSocket();
  return typingUsers[userId] || null;
}

/**
 * Get all users currently typing and their rooms
 */
export function useTypingUsers(): Record<string, string> {
  const { typingUsers } = useSocket();
  return typingUsers;
}

export type { SocketContextValue };
