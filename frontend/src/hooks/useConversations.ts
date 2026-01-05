/**
 * useConversations - Custom hooks for chat/messaging
 *
 * These hooks prepare for the Socket.io chat feature.
 * They provide access to conversations and message history.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';

// Types for chat messages and conversations
export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  read: boolean;
  createdAt: string;
}

export interface ConversationPartner {
  id: string;
  username: string;
  avatarUrl: string | null;
}

export interface Conversation {
  partnerId: string;
  partner: ConversationPartner;
  lastMessage: ChatMessage;
  unreadCount: number;
}

// Backend response types
interface ConversationsApiResponse {
  success: boolean;
  data: Conversation[];
}

interface MessagesApiResponse {
  success: boolean;
  data: {
    items: ChatMessage[];
    page: number;
    pageSize: number;
  };
}

export interface SendMessageInput {
  receiverId: string;
  content: string;
}

/**
 * Fetch all conversations for current user
 */
export function useConversations() {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const response = await api.get<ConversationsApiResponse>('/api/v1/messages');
      return response.data;
    },
  });
}

/**
 * Fetch messages with a specific user
 */
export function useMessages(userId: string | undefined) {
  return useQuery({
    queryKey: ['messages', userId],
    queryFn: async () => {
      if (!userId) throw new Error('userId is required');
      const response = await api.get<MessagesApiResponse>(`/api/v1/messages/${userId}`);
      return response.data.items;
    },
    enabled: !!userId,
    refetchInterval: 5000, // Poll for new messages every 5 seconds
  });
}

/**
 * Send a message to another user
 */
export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SendMessageInput) => {
      return api.post<ChatMessage>('/api/v1/messages', input);
    },
    onSuccess: (_, { receiverId }) => {
      // Invalidate messages with this user and conversations list
      queryClient.invalidateQueries({ queryKey: ['messages', receiverId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

/**
 * Mark messages as read
 */
export function useMarkMessagesRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      return api.patch<void>(`/api/v1/messages/${userId}/read`);
    },
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: ['messages', userId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}
