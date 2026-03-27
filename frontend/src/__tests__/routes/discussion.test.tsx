import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { DiscussionPage } from '@/routes/discussion';

const {
  mockUseAuth,
  mockUseSocket,
  mockUseOnlineUsers,
  mockUseTypingUsers,
  mockUseConversations,
  mockUseMessages,
  mockUseSendMessage,
  mockUseMarkMessagesRead,
  mockUseFriends,
  mockUseUserById,
  mockSetTyping,
  mockSendMutate,
  mockMarkReadMutate,
  mockNavigate,
} = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
  mockUseSocket: vi.fn(),
  mockUseOnlineUsers: vi.fn(),
  mockUseTypingUsers: vi.fn(),
  mockUseConversations: vi.fn(),
  mockUseMessages: vi.fn(),
  mockUseSendMessage: vi.fn(),
  mockUseMarkMessagesRead: vi.fn(),
  mockUseFriends: vi.fn(),
  mockUseUserById: vi.fn(),
  mockSetTyping: vi.fn(),
  mockSendMutate: vi.fn(),
  mockMarkReadMutate: vi.fn(),
  mockNavigate: vi.fn(),
}));

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => () => ({}),
  useNavigate: () => mockNavigate,
  useSearch: () => ({}),
  Link: ({
    children,
    to,
    search,
    className,
  }: {
    children: ReactNode;
    to: string;
    search?: Record<string, string>;
    className?: string;
  }) => {
    let href = to;
    if (search?.mode) href = `${href}?mode=${search.mode}`;
    return (
      <a href={href} className={className} data-testid="mock-link">
        {children}
      </a>
    );
  },
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: mockUseAuth,
}));

vi.mock('@/hooks', () => ({
  useSocket: mockUseSocket,
  useOnlineUsers: mockUseOnlineUsers,
  useTypingUsers: mockUseTypingUsers,
  useConversations: mockUseConversations,
  useMessages: mockUseMessages,
  useSendMessage: mockUseSendMessage,
  useMarkMessagesRead: mockUseMarkMessagesRead,
  useFriends: mockUseFriends,
  useUserById: mockUseUserById,
}));

const conversations = [
  {
    partnerId: 'u2',
    unreadCount: 2,
    lastMessage: { content: 'Last message from Bob' },
    partner: {
      username: 'bob',
      avatarUrl: null,
    },
  },
  {
    partnerId: 'u3',
    unreadCount: 0,
    lastMessage: { content: 'Hey there' },
    partner: {
      username: 'alice',
      avatarUrl: 'https://image.test/alice.jpg',
    },
  },
];

const messages = [
  {
    id: 'm1',
    senderId: 'u1',
    content: 'Hello Bob',
    createdAt: '2025-03-25T10:00:00.000Z',
  },
  {
    id: 'm2',
    senderId: 'u2',
    content: 'Hi!',
    createdAt: '2025-03-25T10:01:00.000Z',
  },
];

describe('DiscussionPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { id: 'u1', username: 'me' },
    });

    mockUseSocket.mockReturnValue({
      isConnected: true,
      setTyping: mockSetTyping,
    });

    mockUseOnlineUsers.mockReturnValue([]);
    mockUseTypingUsers.mockReturnValue({});

    mockUseConversations.mockReturnValue({
      data: conversations,
      isLoading: false,
    });

    mockUseMessages.mockReturnValue({
      data: [],
      isLoading: false,
    });

    mockUseSendMessage.mockReturnValue({
      mutate: mockSendMutate,
      isPending: false,
    });

    mockUseMarkMessagesRead.mockReturnValue({
      mutate: mockMarkReadMutate,
    });

    mockUseFriends.mockReturnValue({
      data: [],
      isLoading: false,
    });

    mockUseUserById.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
    });
  });

  it('affiche un loader pendant le chargement auth', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
      user: null,
    });

    render(<DiscussionPage />);

    expect(document.querySelector('svg')).toBeInTheDocument();
  });

  it('affiche la vue non connectée', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
    });

    render(<DiscussionPage />);

    expect(screen.getByRole('heading', { name: /sign in to chat/i })).toBeInTheDocument();
    expect(
      screen.getByText(/join the conversation! sign in to chat with other film enthusiasts\./i)
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /sign in/i })).toHaveAttribute(
      'href',
      '/profil?mode=login'
    );
    expect(screen.getByRole('link', { name: /create account/i })).toHaveAttribute(
      'href',
      '/profil?mode=register'
    );
  });
  it('affiche le message de connexion socket si non connecté', () => {
    mockUseSocket.mockReturnValue({
      isConnected: false,
      setTyping: mockSetTyping,
    });

    render(<DiscussionPage />);

    expect(screen.getByText(/connecting to chat server/i)).toBeInTheDocument();
  });

  it('affiche le loader des conversations', () => {
    mockUseConversations.mockReturnValue({
      data: undefined,
      isLoading: true,
    });

    render(<DiscussionPage />);

    expect(screen.getByText('Messages')).toBeInTheDocument();
    expect(document.querySelectorAll('svg').length).toBeGreaterThan(0);
  });

  it('affiche la liste des conversations', () => {
    render(<DiscussionPage />);

    expect(screen.getByText('Messages')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /bob/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /alice/i })).toBeInTheDocument();
    expect(screen.getByText('Last message from Bob')).toBeInTheDocument();
    expect(screen.getByText('Hey there')).toBeInTheDocument();
  });

  it('filtre les conversations avec la recherche', async () => {
    const user = userEvent.setup();

    render(<DiscussionPage />);

    const input = screen.getByPlaceholderText(/search conversations/i);
    await user.type(input, 'bob');

    expect(screen.getByRole('button', { name: /bob/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /alice/i })).not.toBeInTheDocument();
  });

  it('affiche un message si aucune conversation ne correspond à la recherche', async () => {
    const user = userEvent.setup();

    render(<DiscussionPage />);

    const input = screen.getByPlaceholderText(/search conversations/i);
    await user.type(input, 'zzz');

    expect(screen.getByText(/no conversations found/i)).toBeInTheDocument();
  });

  it('affiche un message si aucune conversation n’existe', () => {
    mockUseConversations.mockReturnValue({
      data: [],
      isLoading: false,
    });

    render(<DiscussionPage />);

    expect(screen.getByText(/no conversations yet/i)).toBeInTheDocument();
  });

  it('affiche la vue vide si aucune conversation n’est sélectionnée', () => {
    render(<DiscussionPage />);

    expect(screen.getByText(/your messages/i)).toBeInTheDocument();
    expect(
      screen.getByText(/select a conversation or start a new message with a friend/i)
    ).toBeInTheDocument();
  });

  it('ouvre une conversation et marque les messages comme lus', async () => {
    const user = userEvent.setup();

    mockUseMessages.mockReturnValue({
      data: messages,
      isLoading: false,
    });

    render(<DiscussionPage />);

    await user.click(screen.getByRole('button', { name: /bob/i }));

    expect(mockMarkReadMutate).toHaveBeenCalledWith('u2');
    expect(screen.getByText('Hello Bob')).toBeInTheDocument();
    expect(screen.getByText('Hi!')).toBeInTheDocument();
  });

  it('affiche le loader des messages', async () => {
    const user = userEvent.setup();

    mockUseMessages.mockReturnValue({
      data: undefined,
      isLoading: true,
    });

    render(<DiscussionPage />);

    await user.click(screen.getByRole('button', { name: /bob/i }));

    expect(document.querySelectorAll('svg').length).toBeGreaterThan(0);
  });

  it('affiche un message quand la conversation est vide', async () => {
    const user = userEvent.setup();

    mockUseMessages.mockReturnValue({
      data: [],
      isLoading: false,
    });

    render(<DiscussionPage />);

    await user.click(screen.getByRole('button', { name: /bob/i }));

    expect(screen.getByText(/no messages yet\. start the conversation/i)).toBeInTheDocument();
  });

  it('affiche le statut online et typing du partenaire', async () => {
    const user = userEvent.setup();

    mockUseOnlineUsers.mockReturnValue(['u2']);
    mockUseTypingUsers.mockReturnValue({ u2: true });

    render(<DiscussionPage />);

    await user.click(screen.getByRole('button', { name: /bob/i }));

    expect(screen.getAllByText(/typing\.\.\./i)).toHaveLength(2);
    expect(screen.getByText(/bob is typing\.\.\./i)).toBeInTheDocument();
  });

  it('envoie un message', async () => {
    const user = userEvent.setup();

    render(<DiscussionPage />);

    await user.click(screen.getByRole('button', { name: /bob/i }));

    const input = screen.getByPlaceholderText(/type a message/i);
    await user.type(input, 'New message');

    const submitButton = document.querySelector('button[type="submit"]') as HTMLButtonElement;
    await user.click(submitButton);

    expect(mockSendMutate).toHaveBeenCalledTimes(1);
    expect(mockSendMutate).toHaveBeenCalledWith(
      { receiverId: 'u2', content: 'New message' },
      expect.objectContaining({
        onSuccess: expect.any(Function),
      })
    );
    expect(mockSetTyping).toHaveBeenCalledWith('u2', false);
  });

  it('désactive l’envoi si le message est vide', async () => {
    const user = userEvent.setup();

    render(<DiscussionPage />);

    await user.click(screen.getByRole('button', { name: /bob/i }));

    const submitButton = document.querySelector('button[type="submit"]') as HTMLButtonElement;

    expect(submitButton).toBeDisabled();
  });

  it('désactive l’input si l’envoi est pending', async () => {
    const user = userEvent.setup();

    mockUseSendMessage.mockReturnValue({
      mutate: mockSendMutate,
      isPending: true,
    });

    render(<DiscussionPage />);

    await user.click(screen.getByRole('button', { name: /bob/i }));

    expect(screen.getByPlaceholderText(/type a message/i)).toBeDisabled();
  });
});
