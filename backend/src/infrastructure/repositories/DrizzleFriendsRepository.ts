/**
 * Drizzle Friends Repository Implementation
 */

import { injectable } from 'tsyringe';
import { eq, and, or } from 'drizzle-orm';

import { db, schema } from '../../db/index.js';
import type {
  IFriendsRepository,
  FriendStatus,
  FriendWithUser,
  FriendRequestWithSender,
} from '../../domain/repositories/IFriendsRepository.js';

@injectable()
export class DrizzleFriendsRepository implements IFriendsRepository {
  async findFriendsWithPartners(userId: string): Promise<FriendWithUser[]> {
    const rows = await db.query.friends.findMany({
      where: and(
        or(eq(schema.friends.senderId, userId), eq(schema.friends.receiverId, userId)),
        eq(schema.friends.status, 'accepted')
      ),
      with: {
        sender: {
          columns: { id: true, username: true, avatarUrl: true },
        },
        receiver: {
          columns: { id: true, username: true, avatarUrl: true },
        },
      },
    });

    return rows.map((r) => ({
      id: r.id,
      user:
        r.senderId === userId
          ? { id: r.receiver.id, username: r.receiver.username, avatarUrl: r.receiver.avatarUrl }
          : { id: r.sender.id, username: r.sender.username, avatarUrl: r.sender.avatarUrl },
      since: r.updatedAt,
    }));
  }

  async findPendingRequestsForReceiver(receiverId: string): Promise<FriendRequestWithSender[]> {
    const rows = await db.query.friends.findMany({
      where: and(eq(schema.friends.receiverId, receiverId), eq(schema.friends.status, 'pending')),
      with: {
        sender: {
          columns: { id: true, username: true, avatarUrl: true },
        },
      },
    });

    return rows.map((r) => ({
      id: r.id,
      user: { id: r.sender.id, username: r.sender.username, avatarUrl: r.sender.avatarUrl },
      createdAt: r.createdAt,
    }));
  }

  async findExistingBetween(
    userId1: string,
    userId2: string
  ): Promise<{ id: string; senderId: string; receiverId: string; status: FriendStatus } | null> {
    const row = await db.query.friends.findFirst({
      where: or(
        and(eq(schema.friends.senderId, userId1), eq(schema.friends.receiverId, userId2)),
        and(eq(schema.friends.senderId, userId2), eq(schema.friends.receiverId, userId1))
      ),
      columns: { id: true, senderId: true, receiverId: true, status: true },
    });

    return row
      ? {
          id: row.id,
          senderId: row.senderId,
          receiverId: row.receiverId,
          status: row.status as FriendStatus,
        }
      : null;
  }

  async create(
    senderId: string,
    receiverId: string,
    status: FriendStatus
  ): Promise<{
    id: string;
    senderId: string;
    receiverId: string;
    status: FriendStatus;
    createdAt: Date;
    updatedAt: Date;
  }> {
    const [row] = await db
      .insert(schema.friends)
      .values({ senderId, receiverId, status })
      .returning();

    if (!row) throw new Error('Failed to create friend request');
    return {
      id: row.id,
      senderId: row.senderId,
      receiverId: row.receiverId,
      status: row.status as FriendStatus,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  async updateStatus(
    id: string,
    status: FriendStatus
  ): Promise<{
    id: string;
    senderId: string;
    receiverId: string;
    status: FriendStatus;
    updatedAt: Date;
  } | null> {
    const [row] = await db
      .update(schema.friends)
      .set({ status, updatedAt: new Date() })
      .where(eq(schema.friends.id, id))
      .returning({
        id: schema.friends.id,
        senderId: schema.friends.senderId,
        receiverId: schema.friends.receiverId,
        status: schema.friends.status,
        updatedAt: schema.friends.updatedAt,
      });

    return row ? { ...row, status: row.status as FriendStatus } : null;
  }

  async findById(id: string): Promise<{
    id: string;
    senderId: string;
    receiverId: string;
    status: FriendStatus;
  } | null> {
    const row = await db.query.friends.findFirst({
      where: eq(schema.friends.id, id),
      columns: { id: true, senderId: true, receiverId: true, status: true },
    });
    return row ? { ...row, status: row.status as FriendStatus } : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await db.delete(schema.friends).where(eq(schema.friends.id, id));
    return (result.rowCount ?? 0) > 0;
  }
}
