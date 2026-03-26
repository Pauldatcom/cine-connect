import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { HomePage } from '@/routes/index';

const {
  mockUseAuth,
  mockUseRegisterFilm,
  mockUseIsInWatchlist,
  mockUseToggleWatchlist,
  mockGetTrending,
  mockGetPopular,
  mockGetNowPlaying,
  mockGetTopRated,
  mockGetIndependentFilms,
  mockGetImageUrl,
} = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
  mockUseRegisterFilm: vi.fn(),
  mockUseIsInWatchlist: vi.fn(),
  mockUseToggleWatchlist: vi.fn(),
  mockGetTrending: vi.fn(),
  mockGetPopular: vi.fn(),
  mockGetNowPlaying: vi.fn(),
  mockGetTopRated: vi.fn(),
  mockGetIndependentFilms: vi.fn(),
  mockGetImageUrl: vi.fn(),
}));

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => () => ({}),
  Link: ({
    children,
    to,
    params,
    className,
  }: {
    children: ReactNode;
    to: string;
    params?: Record<string, string>;
    className?: string;
  }) => (
    <a
      href={params?.id ? `${to.replace('$id', params.id)}` : to}
      className={className}
      data-testid="mock-link"
    >
      {children}
    </a>
  ),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: mockUseAuth,
}));

vi.mock('@/hooks', () => ({
  useRegisterFilm: mockUseRegisterFilm,
  useIsInWatchlist: mockUseIsInWatchlist,
  useToggleWatchlist: mockUseToggleWatchlist,
}));

vi.mock('@/lib/api/tmdb', () => ({
  getImageUrl: mockGetImageUrl,
  getNowPlaying: mockGetNowPlaying,
  getPopular: mockGetPopular,
  getTopRated: mockGetTopRated,
  getTrending: mockGetTrending,
  getIndependentFilms: mockGetIndependentFilms,
}));

vi.mock('@/components/features/FilmPoster', () => ({
  FilmPoster: ({ film }: { film: { title?: string } }) => (
    <div data-testid="film-poster">{film.title}</div>
  ),
}));

vi.mock('@/components/ui/FilmStrip', () => ({
  FilmStrip: ({ films }: { films?: unknown[] }) => (
    <div data-testid="film-strip">FilmStrip {films?.length ?? 0}</div>
  ),
}));

vi.mock('@/components/ui/StarRating', () => ({
  StarRatingDisplay: ({ rating }: { rating: number }) => (
    <div data-testid="star-rating">Rating {rating}</div>
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

const trendingMovies = [
  {
    id: 101,
    title: 'Featured Film',
    backdrop_path: '/featured-backdrop.jpg',
    poster_path: '/featured-poster.jpg',
    release_date: '2024-01-15',
    vote_average: 8.4,
    overview: 'A featured overview.',
  },
  {
    id: 102,
    title: 'Trending Two',
    backdrop_path: '/t2-backdrop.jpg',
    poster_path: '/t2-poster.jpg',
    release_date: '2023-07-10',
    vote_average: 7.8,
    overview: 'Trending overview 2.',
  },
  {
    id: 103,
    title: 'Trending Three',
    backdrop_path: '/t3-backdrop.jpg',
    poster_path: '/t3-poster.jpg',
    release_date: '2022-03-01',
    vote_average: 7.5,
    overview: 'Trending overview 3.',
  },
];

const popularMovies = Array.from({ length: 10 }, (_, i) => ({
  id: 200 + i,
  title: `Popular ${i + 1}`,
  poster_path: `/popular-${i + 1}.jpg`,
  backdrop_path: `/popular-backdrop-${i + 1}.jpg`,
  release_date: '2020-01-01',
  vote_average: 7.1,
  overview: `Popular overview ${i + 1}`,
}));

const nowPlayingMovies = Array.from({ length: 10 }, (_, i) => ({
  id: 300 + i,
  title: `Now Playing ${i + 1}`,
  poster_path: `/now-${i + 1}.jpg`,
  backdrop_path: `/now-backdrop-${i + 1}.jpg`,
  release_date: '2025-01-01',
  vote_average: 6.9,
  overview: `Now playing overview ${i + 1}`,
}));

const topRatedMovies = Array.from({ length: 10 }, (_, i) => ({
  id: 400 + i,
  title: `Top Rated ${i + 1}`,
  poster_path: `/top-${i + 1}.jpg`,
  backdrop_path: `/top-backdrop-${i + 1}.jpg`,
  release_date: '2019-01-01',
  vote_average: 9.0,
  overview: `Top rated overview ${i + 1}`,
}));

const independentMovies = Array.from({ length: 10 }, (_, i) => ({
  id: 500 + i,
  title: `Independent ${i + 1}`,
  poster_path: `/indie-${i + 1}.jpg`,
  backdrop_path: `/indie-backdrop-${i + 1}.jpg`,
  release_date: '2021-01-01',
  vote_average: 7.3,
  overview: `Independent overview ${i + 1}`,
}));

describe('HomePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
    });

    mockUseRegisterFilm.mockReturnValue({
      data: { id: 'backend-film-101' },
    });

    mockUseIsInWatchlist.mockReturnValue({
      data: { isInWatchlist: false },
    });

    mockUseToggleWatchlist.mockReturnValue({
      toggleWatchlist: vi.fn(),
      isLoading: false,
    });

    mockGetTrending.mockResolvedValue({
      results: trendingMovies,
    });

    mockGetPopular.mockResolvedValue({
      results: popularMovies,
    });

    mockGetNowPlaying.mockResolvedValue({
      results: nowPlayingMovies,
    });

    mockGetTopRated.mockResolvedValue({
      results: topRatedMovies,
    });

    mockGetIndependentFilms.mockResolvedValue({
      results: independentMovies,
    });

    mockGetImageUrl.mockImplementation((path: string) => `https://image.test${path}`);
  });

  it('affiche la home page avec le film mis en avant et les sections', async () => {
    renderWithClient(<HomePage />);

    expect(await screen.findByRole('heading', { name: 'Featured Film' })).toBeInTheDocument();
    expect(screen.getByText('Trending This Week')).toBeInTheDocument();
    expect(screen.getByText('Popular Films')).toBeInTheDocument();
    expect(screen.getByText('Top Rated')).toBeInTheDocument();
    expect(screen.getByText('In Theaters Now')).toBeInTheDocument();
    expect(screen.getByText('Independent Productions')).toBeInTheDocument();
    expect(screen.getByTestId('star-rating')).toHaveTextContent('Rating 4.2');
  });

  it('affiche le message invité quand l’utilisateur n’est pas connecté', async () => {
    renderWithClient(<HomePage />);

    expect(await screen.findByText(/track films you've watched/i)).toBeInTheDocument();
    expect(screen.getByText(/tell your friends what's good/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /get started/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /^browse films$/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /create your free account/i })).toBeInTheDocument();
  });

  it('affiche le message utilisateur connecté quand l’utilisateur est authentifié', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { username: 'alice' },
    });

    renderWithClient(<HomePage />);

    expect(await screen.findByText(/welcome back,/i)).toBeInTheDocument();
    expect(screen.getByText('alice')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /^browse films$/i }).length).toBeGreaterThan(0);
    expect(screen.getByRole('link', { name: /my watchlist/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /join discussion/i })).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: /create your free account/i })
    ).not.toBeInTheDocument();
  });

  it('appelle les requêtes TMDB attendues', async () => {
    renderWithClient(<HomePage />);

    await screen.findByRole('heading', { name: 'Featured Film' });

    expect(mockGetTrending).toHaveBeenCalledWith('week');
    expect(mockGetPopular).toHaveBeenCalledTimes(1);
    expect(mockGetNowPlaying).toHaveBeenCalledTimes(1);
    expect(mockGetTopRated).toHaveBeenCalledTimes(1);
    expect(mockGetIndependentFilms).toHaveBeenCalledTimes(1);
  });

  it('affiche le bon texte du bouton watchlist quand le film n’est pas dans la liste', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { username: 'alice' },
    });

    mockUseIsInWatchlist.mockReturnValue({
      data: { isInWatchlist: false },
    });

    renderWithClient(<HomePage />);

    expect(await screen.findByRole('heading', { name: 'Featured Film' })).toBeInTheDocument();
    expect(screen.getByTestId('watchlist-button')).toHaveTextContent('To Watch');
  });

  it('affiche le bon texte du bouton watchlist quand le film est déjà dans la liste', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { username: 'alice' },
    });

    mockUseIsInWatchlist.mockReturnValue({
      data: { isInWatchlist: true },
    });

    renderWithClient(<HomePage />);

    expect(await screen.findByRole('heading', { name: 'Featured Film' })).toBeInTheDocument();
    expect(screen.getByTestId('watchlist-button')).toHaveTextContent('In list');
  });

  it('désactive le bouton watchlist si l’utilisateur n’est pas authentifié', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
    });

    renderWithClient(<HomePage />);

    expect(await screen.findByRole('heading', { name: 'Featured Film' })).toBeInTheDocument();
    expect(screen.getByTestId('watchlist-button')).toBeDisabled();
  });

  it('n’affiche pas une section si elle n’a pas de films', async () => {
    mockGetIndependentFilms.mockResolvedValue({
      results: [],
    });

    renderWithClient(<HomePage />);

    expect(await screen.findByRole('heading', { name: 'Featured Film' })).toBeInTheDocument();
    expect(screen.queryByText('Independent Productions')).not.toBeInTheDocument();
  });

  it('n’affiche pas le hero s’il n’y a pas de film trending', async () => {
    mockGetTrending.mockResolvedValue({
      results: [],
    });

    renderWithClient(<HomePage />);

    expect(await screen.findByText(/track films you've watched/i)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Featured Film' })).not.toBeInTheDocument();
  });

  it('affiche bien la film strip avec les films populaires', async () => {
    renderWithClient(<HomePage />);

    await screen.findByRole('heading', { name: 'Featured Film' });

    const strips = screen.getAllByTestId('film-strip');
    expect(strips.length).toBeGreaterThan(0);
    expect(strips[0]).toHaveTextContent(`FilmStrip ${popularMovies.length}`);
  });
});
