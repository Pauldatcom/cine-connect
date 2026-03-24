/**
 * Members (Friends) page - List friends, view profiles, send friend requests
 */

import { useAuth } from '@/contexts/AuthContext';
import { useFriends, useSendFriendRequest } from '@/hooks/useFriends';
import { createFileRoute, Link } from '@tanstack/react-router';
import { MessageCircle, UserPlus, Users, Loader2, User } from 'lucide-react';
import { useState, type FormEvent } from 'react';

export const Route = createFileRoute('/members')({
  component: MembersPage,
});

function MembersPage() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <UnauthenticatedView />;
  }

  return <MembersView />;
}

function UnauthenticatedView() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
      <div className="bg-letterboxd-green/20 mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full">
        <Users className="text-letterboxd-green h-10 w-10" />
      </div>
      <h1 className="font-display text-text-primary mb-4 text-2xl font-bold">Members</h1>
      <p className="text-text-secondary mb-8">
        Sign in to see your friends, view their profiles, and send friend requests.
      </p>
      <Link to="/profil" search={{ mode: 'login' }} className="btn-primary px-6 py-3">
        Sign In
      </Link>
    </div>
  );
}

function MembersView() {
  const { data: friends = [], isLoading: friendsLoading } = useFriends();
  const sendRequest = useSendFriendRequest();
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleAddFriend = async (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);
    const trim = username.trim();
    if (!trim) return;
    try {
      await sendRequest.mutateAsync({ username: trim });
      setUsername('');
      setMessage({ type: 'success', text: `Friend request sent to ${trim}.` });
    } catch (err: unknown) {
      const data =
        err && typeof err === 'object' && 'data' in err
          ? (err as { data?: { error?: string } }).data
          : undefined;
      const errorMsg =
        data?.error ?? 'Could not send request. User may not exist or request already sent.';
      setMessage({ type: 'error', text: errorMsg });
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="font-display text-text-primary mb-6 text-2xl font-bold">Members</h1>

      {/* Add friend by username */}
      <section className="card mb-8">
        <h2 className="section-header mb-4 flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Add a member
        </h2>
        <form onSubmit={handleAddFriend} className="flex flex-wrap items-end gap-3">
          <div className="min-w-[200px] flex-1">
            <label htmlFor="member-username" className="text-text-secondary mb-1 block text-sm">
              Username
            </label>
            <input
              id="member-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              className="input w-full"
              disabled={sendRequest.isPending}
            />
          </div>
          <button
            type="submit"
            className="btn-primary"
            disabled={sendRequest.isPending || !username.trim()}
          >
            {sendRequest.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send request'}
          </button>
        </form>
        {message && (
          <p
            className={`mt-3 text-sm ${message.type === 'success' ? 'text-letterboxd-green' : 'text-red-400'}`}
          >
            {message.text}
          </p>
        )}
      </section>

      {/* Friends list */}
      <section className="card">
        <h2 className="section-header mb-4 flex items-center gap-2">
          <Users className="h-5 w-5" />
          Your friends
        </h2>
        {friendsLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="text-letterboxd-green h-8 w-8 animate-spin" />
          </div>
        ) : friends.length === 0 ? (
          <p className="text-text-tertiary py-8 text-center">
            You have no friends yet. Add someone by username above.
          </p>
        ) : (
          <ul className="space-y-3">
            {friends.map((friend) => (
              <li
                key={friend.id}
                className="bg-bg-tertiary hover:bg-bg-secondary flex items-center gap-4 rounded-lg p-4 transition-colors"
              >
                <Link
                  to="/user/$id"
                  params={{ id: friend.user.id }}
                  className="flex min-w-0 flex-1 items-center gap-4"
                >
                  <div className="bg-bg-secondary flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full">
                    {friend.user.avatarUrl ? (
                      <img
                        src={friend.user.avatarUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <User className="text-text-tertiary h-6 w-6" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-text-primary font-medium">{friend.user.username}</p>
                    <p className="text-text-tertiary text-sm">
                      Friends since {new Date(friend.since).toLocaleDateString()}
                    </p>
                  </div>
                </Link>
                <Link
                  to="/discussion"
                  search={{ with: friend.user.id }}
                  className="btn-secondary flex shrink-0 items-center gap-2 px-3 py-2 text-sm"
                >
                  <MessageCircle className="h-4 w-4" />
                  Message
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
