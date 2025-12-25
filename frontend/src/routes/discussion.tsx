import { createFileRoute } from '@tanstack/react-router';
import { MessageCircle, Send, User, Search, MoreVertical, Phone, Video } from 'lucide-react';
import { useState } from 'react';

/**
 * Real-time chat/discussion page
 */
export const Route = createFileRoute('/discussion')({
  component: DiscussionPage,
});

function DiscussionPage() {
  const [message, setMessage] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);

  // Mock data - will be replaced with Socket.io real-time data
  const conversations = [
    {
      id: '1',
      name: 'Alice',
      lastMessage: 'Have you seen Dune: Part Two?',
      unread: 2,
      online: true,
      avatar: null,
    },
    {
      id: '2',
      name: 'Bob',
      lastMessage: 'Great recommendation!',
      unread: 0,
      online: false,
      avatar: null,
    },
    {
      id: '3',
      name: 'Charlie',
      lastMessage: 'Let me know what you think',
      unread: 1,
      online: true,
      avatar: null,
    },
    { id: '4', name: 'Diana', lastMessage: '⭐⭐⭐⭐⭐', unread: 0, online: false, avatar: null },
  ];

  const messages = [
    {
      id: '1',
      senderId: '1',
      content: 'Hey! Have you seen Dune: Part Two yet?',
      timestamp: '10:30 AM',
    },
    { id: '2', senderId: 'me', content: 'Not yet, is it worth it?', timestamp: '10:32 AM' },
    {
      id: '3',
      senderId: '1',
      content: "It's absolutely incredible! The cinematography is next level.",
      timestamp: '10:33 AM',
    },
    {
      id: '4',
      senderId: '1',
      content: 'Hans Zimmer really outdid himself with the score too 🎵',
      timestamp: '10:33 AM',
    },
    {
      id: '5',
      senderId: 'me',
      content: "Alright, you've convinced me. Watching it this weekend!",
      timestamp: '10:35 AM',
    },
    {
      id: '6',
      senderId: '1',
      content: "You won't regret it! Let me know your thoughts after 🍿",
      timestamp: '10:36 AM',
    },
  ];

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      // TODO: Send via Socket.io
      // Message will be sent via socket.emit when implemented
      setMessage('');
    }
  };

  const selectedUser = conversations.find((c) => c.id === selectedConversation);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="card h-[calc(100vh-10rem)] overflow-hidden p-0">
        <div className="grid h-full lg:grid-cols-[320px,1fr]">
          {/* Sidebar - Conversations */}
          <div className="border-border flex flex-col border-r">
            {/* Header */}
            <div className="border-border border-b p-4">
              <h2 className="font-display text-text-primary text-lg font-semibold">Messages</h2>
            </div>

            {/* Search */}
            <div className="border-border border-b p-3">
              <div className="relative">
                <Search className="text-text-tertiary absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  className="input py-2 pl-9 text-sm"
                />
              </div>
            </div>

            {/* Conversation List */}
            <div className="scrollbar-thin flex-1 overflow-y-auto">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv.id)}
                  className={`hover:bg-bg-tertiary flex w-full items-center gap-3 p-4 text-left transition-colors ${
                    selectedConversation === conv.id ? 'bg-bg-tertiary' : ''
                  }`}
                >
                  <div className="relative">
                    <div className="bg-bg-tertiary border-border flex h-12 w-12 items-center justify-center rounded-full border">
                      <User className="text-text-tertiary h-6 w-6" />
                    </div>
                    {conv.online && (
                      <div className="border-bg-secondary bg-letterboxd-green absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-text-primary font-medium">{conv.name}</span>
                      {conv.unread > 0 && (
                        <span className="bg-letterboxd-green text-bg-primary flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-medium">
                          {conv.unread}
                        </span>
                      )}
                    </div>
                    <p className="text-text-tertiary truncate text-sm">{conv.lastMessage}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Chat Area */}
          {selectedConversation && selectedUser ? (
            <div className="flex flex-col">
              {/* Chat Header */}
              <div className="border-border flex items-center justify-between gap-3 border-b px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="bg-bg-tertiary border-border flex h-10 w-10 items-center justify-center rounded-full border">
                      <User className="text-text-tertiary h-5 w-5" />
                    </div>
                    {selectedUser.online && (
                      <div className="border-bg-secondary bg-letterboxd-green absolute bottom-0 right-0 h-3 w-3 rounded-full border-2" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-text-primary font-medium">{selectedUser.name}</h2>
                    <p
                      className={`text-xs ${selectedUser.online ? 'text-letterboxd-green' : 'text-text-tertiary'}`}
                    >
                      {selectedUser.online ? 'Online' : 'Offline'}
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
              <div className="scrollbar-thin flex-1 overflow-y-auto p-6">
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.senderId === 'me' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${
                          msg.senderId === 'me'
                            ? 'bg-letterboxd-green text-bg-primary'
                            : 'bg-bg-tertiary text-text-primary'
                        }`}
                      >
                        <p>{msg.content}</p>
                        <p
                          className={`mt-1 text-xs ${
                            msg.senderId === 'me' ? 'text-bg-primary/70' : 'text-text-tertiary'
                          }`}
                        >
                          {msg.timestamp}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Input */}
              <form onSubmit={handleSend} className="border-border border-t p-4">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="input flex-1"
                  />
                  <button type="submit" className="btn-primary px-4" disabled={!message.trim()}>
                    <Send className="h-5 w-5" />
                  </button>
                </div>
              </form>
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
                Select a conversation to start chatting with your friends about films
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
