import { useAuth } from '@/contexts/AuthContext';
import {
  useConversations,
  useFriends,
  useMarkMessagesRead,
  useMessages,
  useOnlineUsers,
  useSendMessage,
  useSocket,
  useTypingUsers,
  useUserById,
} from '@/hooks';
import { createFileRoute, Link, useNavigate, useSearch } from '@tanstack/react-router';
import {
  Loader2,
  LogIn,
  MessageCircle,
  MoreVertical,
  Phone,
  Search,
  Send,
  User,
  UserPlus,
  Video,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { z } from 'zod';

const discussionSearchSchema = z.object({
  with: z.string().uuid().optional(),
});

/**
 * Real-time chat/discussion page with Socket.io integration
 */
export const Route = createFileRoute('/discussion')({
  component: DiscussionPage,
  validateSearch: discussionSearchSchema,
});

/** Partner display shape used by both conversation list and fetched user */
interface SelectedPartnerInfo {
  partnerId: string;
  partner: { id: string; username: string; avatarUrl: string | null };
}

export function DiscussionPage() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const navigate = useNavigate();
  const search = useSearch({ from: '/discussion' });
  const [message, setMessage] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFriendPicker, setShowFriendPicker] = useState(false);
  /** Scrollable message list — scroll this node only; avoid scrollIntoView (scrolls the whole page). */
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Socket.io hooks
  const { isConnected, setTyping } = useSocket();
  const onlineUsers = useOnlineUsers();
  const typingUsers = useTypingUsers();

  // API hooks
  const { data: conversations, isLoading: conversationsLoading } = useConversations();
  const { data: friends = [] } = useFriends(isAuthenticated);
  const { data: messages, isLoading: messagesLoading } = useMessages(
    selectedConversation ?? undefined
  );
  const sendMessageMutation = useSendMessage();
  const markReadMutation = useMarkMessagesRead();

  // When selected user is not in conversations (new thread), fetch partner info
  const selectedInList = conversations?.find((c) => c.partnerId === selectedConversation);
  const needPartnerFetch = !!selectedConversation && !selectedInList;
  const {
    data: fetchedUser,
    isLoading: partnerLoading,
    isError: partnerError,
  } = useUserById(needPartnerFetch ? selectedConversation : undefined);

  // Resolve selected partner: from conversation list or from fetched user
  const selectedPartner: SelectedPartnerInfo | null = selectedInList
    ? { partnerId: selectedInList.partnerId, partner: selectedInList.partner }
    : fetchedUser
      ? {
          partnerId: fetchedUser.id,
          partner: {
            id: fetchedUser.id,
            username: fetchedUser.username,
            avatarUrl: fetchedUser.avatarUrl,
          },
        }
      : null;

  // Pre-select conversation from URL ?with=userId (e.g. from Members "Message" link)
  useEffect(() => {
    if (search.with) {
      setSelectedConversation(search.with);
      setShowFriendPicker(false);
      navigate({ from: '/discussion', search: {} });
    }
  }, [search.with, navigate]);

  // Scroll only the message column (instant — smooth() can still interact badly with the window on open)
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      const el = messagesContainerRef.current;
      if (!el) return;
      el.scrollTop = el.scrollHeight;
    });
    return () => cancelAnimationFrame(id);
  }, [messages]);

  // Mark messages as read when conversation is selected (safe for new threads; backend no-ops)
  useEffect(() => {
    if (selectedConversation) {
      markReadMutation.mutate(selectedConversation);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mutation object is stable
  }, [selectedConversation]);

  // Handle typing indicator
  useEffect(() => {
    if (selectedConversation && message.length > 0) {
      setTyping(selectedConversation, true);
    }
    const timeout = setTimeout(() => {
      if (selectedConversation) {
        setTyping(selectedConversation, false);
      }
    }, 1000);
    return () => clearTimeout(timeout);
  }, [message, selectedConversation, setTyping]);

  // Show loading state
  if (authLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="text-letterboxd-green h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Require authentication
  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <div className="bg-bg-tertiary mx-auto flex h-20 w-20 items-center justify-center rounded-full">
          <MessageCircle className="text-text-tertiary h-10 w-10" />
        </div>
        <h1 className="font-display text-text-primary mt-6 text-2xl font-bold">Sign in to Chat</h1>
        <p className="text-text-secondary mt-3">
          Join the conversation! Sign in to chat with other film enthusiasts.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link to="/profil" search={{ mode: 'login' }} className="btn-primary">
            <LogIn className="mr-2 h-4 w-4" />
            Sign In
          </Link>
          <Link to="/profil" search={{ mode: 'register' }} className="btn-secondary">
            Create Account
          </Link>
        </div>
      </div>
    );
  }

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && selectedConversation) {
      sendMessageMutation.mutate(
        { receiverId: selectedConversation, content: message.trim() },
        { onSuccess: () => setMessage('') }
      );
      // Stop typing indicator
      setTyping(selectedConversation, false);
    }
  };

  // Filter conversations by search query
  const filteredConversations = conversations?.filter((conv) =>
    conv.partner.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isPartnerOnline = selectedConversation ? onlineUsers.includes(selectedConversation) : false;
  const isPartnerTyping = selectedConversation ? !!typingUsers[selectedConversation] : false;

  return (
    <div className="mx-auto flex min-h-0 max-w-7xl flex-col px-4 py-4">
      {/* Connection status indicator */}
      {!isConnected && (
        <div className="bg-letterboxd-orange/20 text-letterboxd-orange mb-3 rounded-lg px-4 py-2 text-center text-sm">
          <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
          Connecting to chat server...
        </div>
      )}

      {/* 100dvh: mobile URL bar; height capped so main+footer rarely force body scroll */}
      <div className="card flex h-[calc(100dvh-10rem)] min-h-0 flex-col overflow-hidden p-0">
        {/* min-h-0 lets flex children shrink so overflow-y scroll stays inside the card (not the page) */}
        <div className="grid h-full min-h-0 lg:grid-cols-[320px,1fr]">
          {/* Sidebar - Conversations */}
          <div className="border-border flex min-h-0 min-w-0 flex-col border-r">
            {/* Header + New message */}
            <div className="border-border flex items-center justify-between gap-2 border-b p-4">
              <h2 className="font-display text-text-primary text-lg font-semibold">Messages</h2>
              <button
                type="button"
                onClick={() => setShowFriendPicker(!showFriendPicker)}
                className="btn-secondary flex items-center gap-1.5 px-3 py-1.5 text-sm"
                aria-label={showFriendPicker ? 'Close new message' : 'New message'}
              >
                <UserPlus className="h-4 w-4" />
                New message
              </button>
            </div>

            {/* Friend picker: start conversation with a friend */}
            {showFriendPicker && (
              <div className="border-border bg-bg-tertiary/50 max-h-48 overflow-y-auto border-b p-2">
                <p className="text-text-tertiary mb-2 px-2 text-xs font-medium">
                  Choose a friend to message
                </p>
                {friends.length === 0 ? (
                  <p className="text-text-tertiary py-4 text-center text-sm">
                    No friends yet. Add friends from Members.
                  </p>
                ) : (
                  <ul className="space-y-0.5">
                    {friends.map((friend) => (
                      <li key={friend.user.id}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedConversation(friend.user.id);
                            setShowFriendPicker(false);
                          }}
                          className="hover:bg-bg-tertiary flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors"
                        >
                          <div className="bg-bg-secondary flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full">
                            {friend.user.avatarUrl ? (
                              <img
                                src={friend.user.avatarUrl}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <User className="text-text-tertiary h-4 w-4" />
                            )}
                          </div>
                          <span className="text-text-primary truncate text-sm font-medium">
                            {friend.user.username}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Search */}
            <div className="border-border border-b p-3">
              <div className="relative">
                <Search className="text-text-tertiary absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search conversations..."
                  className="input py-2 pl-9 text-sm"
                />
              </div>
            </div>

            {/* Conversation List */}
            <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto overscroll-contain">
              {conversationsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="text-text-tertiary h-6 w-6 animate-spin" />
                </div>
              ) : filteredConversations && filteredConversations.length > 0 ? (
                filteredConversations.map((conv) => {
                  const isOnline = onlineUsers.includes(conv.partnerId);
                  return (
                    <button
                      key={conv.partnerId}
                      onClick={() => setSelectedConversation(conv.partnerId)}
                      className={`hover:bg-bg-tertiary flex w-full items-center gap-3 p-4 text-left transition-colors ${
                        selectedConversation === conv.partnerId ? 'bg-bg-tertiary' : ''
                      }`}
                    >
                      <div className="relative">
                        <div className="bg-bg-tertiary border-border flex h-12 w-12 items-center justify-center rounded-full border">
                          {conv.partner.avatarUrl ? (
                            <img
                              src={conv.partner.avatarUrl}
                              alt=""
                              className="h-full w-full rounded-full object-cover"
                            />
                          ) : (
                            <User className="text-text-tertiary h-6 w-6" />
                          )}
                        </div>
                        {isOnline && (
                          <div className="border-bg-secondary bg-letterboxd-green absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-text-primary font-medium">
                            {conv.partner.username}
                          </span>
                          {conv.unreadCount > 0 && (
                            <span className="bg-letterboxd-green text-bg-primary flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-medium">
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>
                        <p className="text-text-tertiary truncate text-sm">
                          {conv.lastMessage?.content ?? 'No messages yet'}
                        </p>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="text-text-tertiary py-8 text-center text-sm">
                  {searchQuery ? 'No conversations found' : 'No conversations yet'}
                </div>
              )}
            </div>
          </div>

          {/* Chat Area */}
          {selectedConversation && selectedPartner ? (
            <div className="flex min-h-0 min-w-0 flex-col">
              {/* Chat Header */}
              <div className="border-border flex items-center justify-between gap-3 border-b px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="bg-bg-tertiary border-border flex h-10 w-10 items-center justify-center rounded-full border">
                      {selectedPartner.partner.avatarUrl ? (
                        <img
                          src={selectedPartner.partner.avatarUrl}
                          alt=""
                          className="h-full w-full rounded-full object-cover"
                        />
                      ) : (
                        <User className="text-text-tertiary h-5 w-5" />
                      )}
                    </div>
                    {isPartnerOnline && (
                      <div className="border-bg-secondary bg-letterboxd-green absolute bottom-0 right-0 h-3 w-3 rounded-full border-2" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-text-primary font-medium">
                      {selectedPartner.partner.username}
                    </h2>
                    <p
                      className={`text-xs ${
                        isPartnerTyping
                          ? 'text-letterboxd-green'
                          : isPartnerOnline
                            ? 'text-letterboxd-green'
                            : 'text-text-tertiary'
                      }`}
                    >
                      {isPartnerTyping ? 'Typing...' : isPartnerOnline ? 'Online' : 'Offline'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="btn-ghost rounded-full p-2">
                    <Phone className="h-5 w-5" />
                  </button>
                  <button className="btn-ghost rounded-full p-2">
                    <Video className="h-5 w-5" />
                  </button>
                  <button className="btn-ghost rounded-full p-2">
                    <MoreVertical className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div
                ref={messagesContainerRef}
                className="scrollbar-thin min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain p-6"
                data-testid="chat-messages"
              >
                {messagesLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="text-text-tertiary h-6 w-6 animate-spin" />
                  </div>
                ) : messages && messages.length > 0 ? (
                  <div className="space-y-4">
                    {messages.map((msg) => {
                      const isMe = msg.senderId === user?.id;
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${
                              isMe
                                ? 'bg-letterboxd-green text-bg-primary'
                                : 'bg-bg-tertiary text-text-primary'
                            }`}
                          >
                            <p>{msg.content}</p>
                            <p
                              className={`mt-1 text-xs ${
                                isMe ? 'text-bg-primary/70' : 'text-text-tertiary'
                              }`}
                            >
                              {new Date(msg.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-text-tertiary py-8 text-center text-sm">
                    No messages yet. Start the conversation!
                  </div>
                )}
              </div>

              {/* Typing Indicator */}
              {isPartnerTyping && (
                <div className="text-text-tertiary px-6 pb-2 text-sm">
                  {selectedPartner.partner.username} is typing...
                </div>
              )}

              {/* Input */}
              <form onSubmit={handleSend} className="border-border border-t p-4">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="input flex-1"
                    disabled={sendMessageMutation.isPending}
                  />
                  <button
                    type="submit"
                    className="btn-primary px-4"
                    disabled={!message.trim() || sendMessageMutation.isPending}
                    aria-label="Send message"
                  >
                    {sendMessageMutation.isPending ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </form>
            </div>
          ) : selectedConversation && needPartnerFetch && partnerLoading ? (
            <div className="flex flex-1 items-center justify-center p-8">
              <Loader2 className="text-letterboxd-green h-8 w-8 animate-spin" />
            </div>
          ) : selectedConversation && needPartnerFetch && partnerError ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <p className="text-text-secondary">
                User not found or you are not friends. Start a conversation from the list or add
                them as a friend first.
              </p>
              <button
                type="button"
                onClick={() => setSelectedConversation(null)}
                className="btn-secondary mt-4"
              >
                Back to conversations
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <div className="bg-bg-tertiary flex h-20 w-20 items-center justify-center rounded-full">
                <MessageCircle className="text-text-tertiary h-10 w-10" />
              </div>
              <h2 className="font-display text-text-primary mt-6 text-xl font-semibold">
                Your Messages
              </h2>
              <p className="text-text-secondary mt-2 max-w-xs text-sm">
                Select a conversation or start a new message with a friend
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
