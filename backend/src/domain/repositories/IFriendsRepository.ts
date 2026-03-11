/**
 * Friends Repository Interface
 * Defines the contract for friend/friendship data access
 */

export type FriendStatus = 'pending' | 'accepted' | 'rejected';

export interface FriendUserSummary {
  id: string;
  username: string;
  avatarUrl: string | null;
}

export interface FriendWithUser {
  id: string;
  user: FriendUserSummary;
  since: Date;
}

export interface FriendRequestWithSender {
  id: string;
  user: FriendUserSummary;
  createdAt: Date;
}

export interface IFriendsRepository {
  /** List all accepted friends for a user (with partner info) */
  findFriendsWithPartners(userId: string): Promise<FriendWithUser[]>;

  /** List pending requests received by userId */
  findPendingRequestsForReceiver(receiverId: string): Promise<FriendRequestWithSender[]>;

  /** Find any existing friendship/request between two users */
  findExistingBetween(
    userId1: string,
    userId2: string
  ): Promise<{
    id: string;
    senderId: string;
    receiverId: string;
    status: FriendStatus;
  } | null>;

  /** Create a friend request */
  create(
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
  }>;

  /** Update status of a friend request */
  updateStatus(
    id: string,
    status: FriendStatus
  ): Promise<{
    id: string;
    senderId: string;
    receiverId: string;
    status: FriendStatus;
    updatedAt: Date;
  } | null>;

  /** Find a friendship/request by id */
  findById(id: string): Promise<{
    id: string;
    senderId: string;
    receiverId: string;
    status: FriendStatus;
  } | null>;

  /** Delete a friendship/request by id */
  delete(id: string): Promise<boolean>;
}

export const IFriendsRepository = Symbol.for('IFriendsRepository');
