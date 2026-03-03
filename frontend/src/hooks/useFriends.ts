/**
 * useFriends - Hooks for friends list, pending requests, send/accept/decline/remove
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getFriends,
  getPendingRequests,
  sendFriendRequest,
  respondToFriendRequest,
  removeFriend,
  getUserById,
  type PendingRequest,
} from '@/lib/api/friends';

const FRIENDS_KEY = ['friends'] as const;
const PENDING_REQUESTS_KEY = ['friends', 'requests'] as const;

export function useFriends(enabled = true) {
  return useQuery({
    queryKey: FRIENDS_KEY,
    queryFn: getFriends,
    enabled,
  });
}

export function usePendingFriendRequests(enabled = true) {
  return useQuery({
    queryKey: PENDING_REQUESTS_KEY,
    queryFn: getPendingRequests,
    enabled,
  });
}

export function useSendFriendRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { userId?: string; username?: string }) => sendFriendRequest(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FRIENDS_KEY });
      queryClient.invalidateQueries({ queryKey: PENDING_REQUESTS_KEY });
    },
  });
}

export function useRespondToFriendRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId, accept }: { requestId: string; accept: boolean }) =>
      respondToFriendRequest(requestId, accept),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FRIENDS_KEY });
      queryClient.invalidateQueries({ queryKey: PENDING_REQUESTS_KEY });
    },
  });
}

export function useRemoveFriend() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (friendshipId: string) => removeFriend(friendshipId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FRIENDS_KEY });
    },
  });
}

export function useUserById(userId: string | undefined) {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: () => {
      if (userId === undefined || userId === null) throw new Error('userId required');
      return getUserById(userId);
    },
    enabled: !!userId,
  });
}

export type { PendingRequest };
