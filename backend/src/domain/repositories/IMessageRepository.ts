/**
 * Message Repository Interface
 * Defines the contract for message and conversation data access
 */

export interface MessageUserSummary {
  id: string;
  username: string;
  avatarUrl: string | null;
}

export interface MessageRow {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  read: boolean;
  createdAt: Date;
  sender?: MessageUserSummary;
  receiver?: MessageUserSummary;
}

export interface ConversationSummary {
  partnerId: string;
  partner: MessageUserSummary;
  lastMessage: MessageRow;
  unreadCount: number;
}

export interface IMessageRepository {
  /** List all conversations for a user (grouped by partner, with last message and unread count) */
  listConversations(userId: string): Promise<ConversationSummary[]>;

  /** List messages between two users (paginated, chronological) */
  listMessagesBetween(
    userId1: string,
    userId2: string,
    page: number,
    pageSize: number
  ): Promise<{ items: MessageRow[]; page: number; pageSize: number }>;

  /** Mark messages as read (from sender to receiver) */
  markAsRead(senderId: string, receiverId: string): Promise<void>;

  /** Create a new message */
  create(senderId: string, receiverId: string, content: string): Promise<MessageRow>;
}

export const IMessageRepository = Symbol.for('IMessageRepository');
