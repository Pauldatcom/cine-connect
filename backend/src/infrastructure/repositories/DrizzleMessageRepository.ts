/**
 * Drizzle Message Repository Implementation
 */

import { injectable } from 'tsyringe';
import { eq, and, or, desc } from 'drizzle-orm';

import { db, schema } from '../../db/index.js';
import type {
  IMessageRepository,
  ConversationSummary,
  MessageRow,
} from '../../domain/repositories/IMessageRepository.js';

@injectable()
export class DrizzleMessageRepository implements IMessageRepository {
  async listConversations(userId: string): Promise<ConversationSummary[]> {
    const messages = await db.query.messages.findMany({
      where: or(eq(schema.messages.senderId, userId), eq(schema.messages.receiverId, userId)),
      with: {
        sender: { columns: { id: true, username: true, avatarUrl: true } },
        receiver: { columns: { id: true, username: true, avatarUrl: true } },
      },
      orderBy: [desc(schema.messages.createdAt)],
    });

    const map = new Map<string, ConversationSummary>();

    for (const msg of messages) {
      const partnerId = msg.senderId === userId ? msg.receiverId : msg.senderId;
      const partner = msg.senderId === userId ? msg.receiver : msg.sender;
      if (!partner) continue;

      if (!map.has(partnerId)) {
        map.set(partnerId, {
          partnerId,
          partner: { id: partner.id, username: partner.username, avatarUrl: partner.avatarUrl },
          lastMessage: this.toMessageRow(msg),
          unreadCount: 0,
        });
      }

      const conv = map.get(partnerId);
      if (!conv) continue;
      if (msg.receiverId === userId && !msg.read) {
        conv.unreadCount++;
      }
    }

    return Array.from(map.values());
  }

  async listMessagesBetween(
    userId1: string,
    userId2: string,
    page: number,
    pageSize: number
  ): Promise<{ items: MessageRow[]; page: number; pageSize: number }> {
    const offset = (page - 1) * pageSize;
    const rows = await db.query.messages.findMany({
      where: or(
        and(eq(schema.messages.senderId, userId1), eq(schema.messages.receiverId, userId2)),
        and(eq(schema.messages.senderId, userId2), eq(schema.messages.receiverId, userId1))
      ),
      orderBy: [desc(schema.messages.createdAt)],
      limit: pageSize,
      offset,
      with: {
        sender: { columns: { id: true, username: true, avatarUrl: true } },
        receiver: { columns: { id: true, username: true, avatarUrl: true } },
      },
    });

    const items = rows.map((r) => this.toMessageRow(r)).reverse();
    return { items, page, pageSize };
  }

  async markAsRead(senderId: string, receiverId: string): Promise<void> {
    await db
      .update(schema.messages)
      .set({ read: true })
      .where(
        and(
          eq(schema.messages.senderId, senderId),
          eq(schema.messages.receiverId, receiverId),
          eq(schema.messages.read, false)
        )
      );
  }

  async create(senderId: string, receiverId: string, content: string): Promise<MessageRow> {
    const [row] = await db
      .insert(schema.messages)
      .values({ senderId, receiverId, content })
      .returning();

    if (!row) throw new Error('Failed to create message');
    return this.toMessageRow(row);
  }

  private toMessageRow(row: {
    id: string;
    senderId: string;
    receiverId: string;
    content: string;
    read: boolean;
    createdAt: Date;
    sender?: { id: string; username: string; avatarUrl: string | null };
    receiver?: { id: string; username: string; avatarUrl: string | null };
  }): MessageRow {
    return {
      id: row.id,
      senderId: row.senderId,
      receiverId: row.receiverId,
      content: row.content,
      read: row.read,
      createdAt: row.createdAt,
      sender: row.sender,
      receiver: row.receiver,
    };
  }
}
