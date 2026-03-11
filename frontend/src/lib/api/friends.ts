/**
 * Friends API - List friends, pending requests, send/accept/decline, remove
 */

import { api } from './client';

export interface FriendUserSummary {
  id: string;
  username: string;
  avatarUrl: string | null;
}

export interface FriendWithUser {
  id: string;
  user: FriendUserSummary;
  since: string;
}

export interface PendingRequest {
  id: string;
  user: FriendUserSummary;
  createdAt: string;
}

export interface PublicUser {
  id: string;
  username: string;
  avatarUrl: string | null;
  createdAt: string;
}

/** GET /api/v1/friends - list accepted friends */
export async function getFriends(): Promise<FriendWithUser[]> {
  return api.get<FriendWithUser[]>('/api/v1/friends');
}

/** GET /api/v1/friends/requests - list pending requests (received) */
export async function getPendingRequests(): Promise<PendingRequest[]> {
  return api.get<PendingRequest[]>('/api/v1/friends/requests');
}

/** POST /api/v1/friends/request - send friend request by userId or username */
export async function sendFriendRequest(body: {
  userId?: string;
  username?: string;
}): Promise<void> {
  await api.post('/api/v1/friends/request', body);
}

/** PATCH /api/v1/friends/requests/:id - accept or decline a request */
export async function respondToFriendRequest(
  requestId: string,
  accept: boolean
): Promise<{ id: string; status: string }> {
  return api.patch<{ id: string; status: string }>(`/api/v1/friends/requests/${requestId}`, {
    accept,
  });
}

/** DELETE /api/v1/friends/:id - remove a friend (friendship id) */
export async function removeFriend(friendshipId: string): Promise<void> {
  await api.delete(`/api/v1/friends/${friendshipId}`);
}

/** GET /api/v1/users/:id - get public user profile (for viewing a member) */
export async function getUserById(id: string): Promise<PublicUser> {
  return api.get<PublicUser>(`/api/v1/users/${id}`);
}
