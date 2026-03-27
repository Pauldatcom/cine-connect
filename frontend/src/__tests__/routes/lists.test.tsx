import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { ListsPage } from '@/routes/lists';

const {
  mockUseAuth,
  mockUseWatchlist,
  mockUseRemoveFromWatchlist,
  mockGetImageUrl,
  mockMutateAsync,
} = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
  mockUseWatchlist: vi.fn(),
  mockUseRemoveFromWatchlist: vi.fn(),
  mockGetImageUrl: vi.fn(),
  mockMutateAsync: vi.fn(),
}));

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => () => ({}),
  Link: ({
    children,
    to,
    params,
    search,
    className,
    'aria-label': ariaLabel,
  }: {
    children: ReactNode;
    to: string;
    params?: Record<string, string>;
    search?: Record<string, string>;
    className?: string;
    'aria-label'?: string;
  }) => {
    let href = to;

    if (params?.id) {
      href = to.replace('$id', params.id);
    }

    if (search?.mode) {
      href = `${href}?mode=${search.mode}`;
    }

    return (
      <a href={href} className={className} aria-label={ariaLabel} data-testid="mock-link">
        {children}
      </a>
    );
  },
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: mockUseAuth,
}));

vi.mock('@/hooks', () => ({
  useWatchlist: mockUseWatchlist,
  useRemoveFromWatchlist: mockUseRemoveFromWatchlist,
}));

vi.mock('@/lib/api/tmdb', () => ({
  getImageUrl: mockGetImageUrl,
}));

vi.mock('@/components/ui/FilmStrip', () => ({
  FilmStrip: ({ films, height }: { films?: unknown[]; height?: string }) => (
    <div data-testid="film-strip">
      FilmStrip {films?.length ?? 0} {height ?? ''}
    </div>
  ),
}));

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
}

function renderWithClient(ui: ReactNode) {
  const queryClient = createTestQueryClient();

  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

const watchlistItems = [
  {
    id: 'w1',
    filmId: 'f1',
    addedAt: '2025-03-10T10:00:00.000Z',
    film: {
      id: 'f1',
      tmdbId: 101,
      title: 'Zodiac',
      poster: '/zodiac.jpg',
      year: 2007,
    },
  },
  {
    id: 'w2',
    filmId: 'f2',
    addedAt: '2025-03-12T10:00:00.000Z',
    film: {
      id: 'f2',
      tmdbId: 102,
      title: 'Arrival',
      poster: '/arrival.jpg',
      year: 2016,
    },
  },
];

const firstWatchlistItem = watchlistItems[0]!;

describe('ListsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
    });

    mockUseWatchlist.mockReturnValue({
      data: { items: [] },
      isLoading: false,
      error: null,
    });

    mockMutateAsync.mockResolvedValue(undefined);

    mockUseRemoveFromWatchlist.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    });

    mockGetImageUrl.mockReturnValue('https://image.test/fallback-poster.jpg');
  });

  it('affiche la vue non connectée', () => {
    renderWithClient(<ListsPage />);

    expect(screen.getByText('Your Watchlist')).toBeInTheDocument();
    expect(screen.getByText(/keep track of films you want to watch/i)).toBeInTheDocument();

    expect(screen.getByRole('link', { name: /sign in/i })).toHaveAttribute(
      'href',
      '/profil?mode=login'
    );

    expect(screen.getByRole('link', { name: /create account/i })).toHaveAttribute(
      'href',
      '/profil?mode=register'
    );

    expect(screen.getByTestId('film-strip')).toHaveTextContent('FilmStrip 0 md');
  });

  it('affiche le loader pendant le chargement', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { username: 'alice' },
    });

    mockUseWatchlist.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });

    renderWithClient(<ListsPage />);

    expect(screen.getByText("alice's Watchlist")).toBeInTheDocument();
    expect(screen.getByText('0 films to watch')).toBeInTheDocument();
    expect(screen.getByTestId('film-strip')).toBeInTheDocument();
  });

  it('affiche une erreur si la watchlist échoue', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { username: 'alice' },
    });

    mockUseWatchlist.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('API error'),
    });

    renderWithClient(<ListsPage />);

    expect(screen.getByText("alice's Watchlist")).toBeInTheDocument();
    expect(screen.getByText(/failed to load watchlist\. please try again\./i)).toBeInTheDocument();
  });

  it('affiche l’état vide quand la watchlist est vide', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { username: 'alice' },
    });

    mockUseWatchlist.mockReturnValue({
      data: { items: [] },
      isLoading: false,
      error: null,
    });

    renderWithClient(<ListsPage />);

    expect(screen.getByText("alice's Watchlist")).toBeInTheDocument();
    expect(screen.getByText('0 films to watch')).toBeInTheDocument();
    expect(screen.getByText(/your watchlist is empty/i)).toBeInTheDocument();
    expect(screen.getByText(/start adding films to your watchlist/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /browse films/i })).toHaveAttribute('href', '/films');
  });

  it('affiche la grille de watchlist quand des films existent', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { username: 'alice' },
    });

    mockUseWatchlist.mockReturnValue({
      data: { items: watchlistItems },
      isLoading: false,
      error: null,
    });

    renderWithClient(<ListsPage />);

    expect(screen.getByText("alice's Watchlist")).toBeInTheDocument();
    expect(screen.getByText('2 films to watch')).toBeInTheDocument();
    expect(screen.getByTestId('watchlist-grid')).toBeInTheDocument();
    expect(screen.getAllByTestId('watchlist-card')).toHaveLength(2);
    expect(screen.getByRole('link', { name: 'Zodiac' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Arrival' })).toBeInTheDocument();
  });

  it('utilise le tri par date ajoutée par défaut', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { username: 'alice' },
    });

    mockUseWatchlist.mockReturnValue({
      data: { items: watchlistItems },
      isLoading: false,
      error: null,
    });

    renderWithClient(<ListsPage />);

    const filmLinks = screen
      .getAllByRole('link')
      .filter((link) => link.getAttribute('href')?.startsWith('/film/'));

    expect(filmLinks[0]!).toHaveAttribute('href', '/film/102');
    expect(filmLinks[1]!).toHaveAttribute('href', '/film/101');
  });

  it('permet de trier par titre', async () => {
    const user = userEvent.setup();

    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { username: 'alice' },
    });

    mockUseWatchlist.mockReturnValue({
      data: { items: watchlistItems },
      isLoading: false,
      error: null,
    });

    renderWithClient(<ListsPage />);

    await user.click(screen.getByRole('button', { name: /title/i }));

    const filmLinks = screen
      .getAllByRole('link')
      .filter((link) => link.getAttribute('href')?.startsWith('/film/'));

    expect(filmLinks[0]!).toHaveAttribute('href', '/film/102');
    expect(filmLinks[1]!).toHaveAttribute('href', '/film/101');
  });

  it('n’affiche pas le tri quand il y a un seul film', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { username: 'alice' },
    });

    mockUseWatchlist.mockReturnValue({
      data: { items: [firstWatchlistItem] },
      isLoading: false,
      error: null,
    });

    renderWithClient(<ListsPage />);

    expect(screen.queryByRole('button', { name: /recently added/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /title/i })).not.toBeInTheDocument();
  });

  it('supprime un film de la watchlist', async () => {
    const user = userEvent.setup();

    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { username: 'alice' },
    });

    mockUseWatchlist.mockReturnValue({
      data: { items: watchlistItems },
      isLoading: false,
      error: null,
    });

    renderWithClient(<ListsPage />);

    const removeButtons = screen.getAllByTitle('Remove from Watchlist');
    await user.click(removeButtons[0]!);

    expect(mockMutateAsync).toHaveBeenCalledTimes(1);
  });

  it('désactive le bouton de suppression pendant la mutation', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { username: 'alice' },
    });

    mockUseWatchlist.mockReturnValue({
      data: { items: watchlistItems },
      isLoading: false,
      error: null,
    });

    mockUseRemoveFromWatchlist.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: true,
    });

    renderWithClient(<ListsPage />);

    const removeButtons = screen.getAllByTitle('Remove from Watchlist');
    expect(removeButtons[0]!).toBeDisabled();
    expect(removeButtons[1]!).toBeDisabled();
  });

  it('utilise le poster TMDB quand un poster existe', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { username: 'alice' },
    });

    mockUseWatchlist.mockReturnValue({
      data: { items: [firstWatchlistItem] },
      isLoading: false,
      error: null,
    });

    renderWithClient(<ListsPage />);

    const poster = screen.getByAltText('Zodiac');
    expect(poster).toHaveAttribute('src', 'https://image.tmdb.org/t/p/w342/zodiac.jpg');
  });

  it('utilise l’image fallback quand aucun poster n’existe', () => {
    const itemWithoutPoster = {
      ...firstWatchlistItem,
      film: {
        ...firstWatchlistItem.film,
        poster: null,
      },
    };

    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { username: 'alice' },
    });

    mockUseWatchlist.mockReturnValue({
      data: {
        items: [itemWithoutPoster],
      },
      isLoading: false,
      error: null,
    });

    renderWithClient(<ListsPage />);

    const poster = screen.getByAltText('Zodiac');
    expect(mockGetImageUrl).toHaveBeenCalledWith(null, 'poster', 'medium');
    expect(poster).toHaveAttribute('src', 'https://image.test/fallback-poster.jpg');
  });

  it('affiche My Watchlist si username est absent', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: null,
    });

    mockUseWatchlist.mockReturnValue({
      data: { items: [] },
      isLoading: false,
      error: null,
    });

    renderWithClient(<ListsPage />);

    expect(screen.getByText('My Watchlist')).toBeInTheDocument();
  });
});
