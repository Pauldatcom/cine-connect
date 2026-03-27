import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { FilmDetailPage } from '@/routes/film.$id';

const {
  mockUseParams,
  mockUseAuth,
  mockUseFilm,
  mockUseFilmCredits,
  mockUseFilmVideos,
  mockUseSimilarFilms,
  mockUseWatchProviders,
  mockUseRegisterFilm,
  mockUseFilmReviews,
  mockUseUserFilmReview,
  mockUseCreateReview,
  mockUseUpdateReview,
  mockUseLikeReview,
  mockUseIsInWatchlist,
  mockUseToggleWatchlist,
  mockGetImageUrl,
  mockCreateReviewMutate,
  mockUpdateReviewMutate,
  mockLikeReviewMutate,
  mockToggleWatchlist,
} = vi.hoisted(() => ({
  mockUseParams: vi.fn(),
  mockUseAuth: vi.fn(),
  mockUseFilm: vi.fn(),
  mockUseFilmCredits: vi.fn(),
  mockUseFilmVideos: vi.fn(),
  mockUseSimilarFilms: vi.fn(),
  mockUseWatchProviders: vi.fn(),
  mockUseRegisterFilm: vi.fn(),
  mockUseFilmReviews: vi.fn(),
  mockUseUserFilmReview: vi.fn(),
  mockUseCreateReview: vi.fn(),
  mockUseUpdateReview: vi.fn(),
  mockUseLikeReview: vi.fn(),
  mockUseIsInWatchlist: vi.fn(),
  mockUseToggleWatchlist: vi.fn(),
  mockGetImageUrl: vi.fn(),
  mockCreateReviewMutate: vi.fn(),
  mockUpdateReviewMutate: vi.fn(),
  mockLikeReviewMutate: vi.fn(),
  mockToggleWatchlist: vi.fn(),
}));

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => () => ({
    useParams: mockUseParams,
  }),
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
  }) => {
    let href = to;
    if (params?.id) href = to.replace('$id', params.id);
    if (params?.categorie) href = to.replace('$categorie', params.categorie);

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
  useFilm: mockUseFilm,
  useFilmCredits: mockUseFilmCredits,
  useFilmVideos: mockUseFilmVideos,
  useSimilarFilms: mockUseSimilarFilms,
  useWatchProviders: mockUseWatchProviders,
  useRegisterFilm: mockUseRegisterFilm,
  useFilmReviews: mockUseFilmReviews,
  useUserFilmReview: mockUseUserFilmReview,
  useCreateReview: mockUseCreateReview,
  useUpdateReview: mockUseUpdateReview,
  useLikeReview: mockUseLikeReview,
  useIsInWatchlist: mockUseIsInWatchlist,
  useToggleWatchlist: mockUseToggleWatchlist,
}));

vi.mock('@/lib/api/tmdb', () => ({
  getImageUrl: mockGetImageUrl,
}));

vi.mock('@/components/features/FilmPoster', () => ({
  FilmPoster: ({ film }: { film: { title?: string } }) => (
    <div data-testid="film-poster">{film.title}</div>
  ),
}));

vi.mock('@/components/features/ReviewCard', () => ({
  ReviewCard: ({
    user,
    content,
    onLike,
    id,
  }: {
    user: { name: string };
    content: string;
    onLike?: (id: string) => void;
    id: string;
  }) => (
    <div data-testid="review-card">
      <span>{user.name}</span>
      <span>{content}</span>
      <button onClick={() => onLike?.(id)}>Like Review</button>
    </div>
  ),
}));

vi.mock('@/components/features/ReviewForm', () => ({
  ReviewForm: ({
    film,
    initialRating,
    initialComment,
    onSubmit,
    onClose,
    error,
  }: {
    film: { title: string };
    initialRating: number;
    initialComment: string;
    onSubmit: (data: { rating: number; comment: string }) => void;
    onClose: () => void;
    error?: string | null;
  }) => (
    <div data-testid="review-form">
      <span>{film.title}</span>
      <span>Initial rating: {initialRating}</span>
      <span>Initial comment: {initialComment}</span>
      {error && <span>{error}</span>}
      <button onClick={() => onSubmit({ rating: 4, comment: 'Great film' })}>Submit Review</button>
      <button onClick={onClose}>Close Review Form</button>
    </div>
  ),
}));

vi.mock('@/components/ui/StarRating', () => ({
  StarRating: ({
    rating,
    onRatingChange,
  }: {
    rating: number;
    onRatingChange?: (rating: number) => void;
  }) => (
    <div>
      <span data-testid="star-rating">Rating {rating}</span>
      <button onClick={() => onRatingChange?.(4)}>Rate 4</button>
    </div>
  ),
}));

const film = {
  id: 550,
  title: 'Fight Club',
  poster_path: '/poster.jpg',
  backdrop_path: '/backdrop.jpg',
  release_date: '1999-10-15',
  runtime: 139,
  vote_average: 8.8,
  vote_count: 12000,
  overview: 'An insomniac office worker crosses paths with a soap maker.',
  tagline: 'Mischief. Mayhem. Soap.',
  genres: [
    { id: 18, name: 'Drama' },
    { id: 53, name: 'Thriller' },
  ],
  homepage: 'https://example.com',
  imdb_id: 'tt0137523',
  status: 'Released',
  original_language: 'en',
  budget: 63000000,
  revenue: 100900000,
  production_companies: [{ name: 'Fox 2000 Pictures' }],
  production_countries: [{ name: 'United States of America' }],
  spoken_languages: [{ name: 'English' }],
};

const credits = {
  cast: [
    { id: 1, name: 'Brad Pitt', character: 'Tyler Durden', profile_path: '/brad.jpg' },
    { id: 2, name: 'Edward Norton', character: 'Narrator', profile_path: null },
  ],
  crew: [
    { id: 10, name: 'David Fincher', job: 'Director', department: 'Directing', profile_path: null },
    { id: 11, name: 'Jim Uhls', job: 'Screenplay', department: 'Writing', profile_path: null },
  ],
};

const videos = {
  results: [{ key: 'abc123', type: 'Trailer', site: 'YouTube' }],
};

const similar = {
  results: [
    { id: 1, title: 'Se7en', poster_path: '/se7en.jpg' },
    { id: 2, title: 'The Game', poster_path: '/game.jpg' },
  ],
};

const reviewsData = {
  items: [
    {
      id: 'r1',
      userId: 'u2',
      user: { id: 'u2', username: 'bob', avatarUrl: null },
      rating: 4.5,
      comment: 'Amazing.',
      createdAt: '2025-03-20T10:00:00.000Z',
      likesCount: 3,
      commentsCount: 0,
      isLikedByCurrentUser: false,
    },
  ],
  total: 1,
  totalPages: 1,
};

describe('FilmDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockUseParams.mockReturnValue({ id: '550' });

    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: 'u1', username: 'alice' },
    });

    mockUseFilm.mockReturnValue({
      data: film,
      isLoading: false,
      error: null,
    });

    mockUseFilmCredits.mockReturnValue({
      data: credits,
    });

    mockUseFilmVideos.mockReturnValue({
      data: videos,
    });

    mockUseSimilarFilms.mockReturnValue({
      data: similar,
    });

    mockUseWatchProviders.mockReturnValue({
      data: {
        result: {
          flatrate: [
            {
              provider_id: 8,
              provider_name: 'Netflix',
              logo_path: '/netflix.png',
            },
          ],
          rent: [],
          buy: [],
        },
        region: 'FR',
        isFallback: false,
        tmdbWatchPageUrl: 'https://www.themoviedb.org/movie/550/watch',
        hasLists: true,
      },
      isLoading: false,
      isError: false,
    });

    mockUseRegisterFilm.mockReturnValue({
      data: { id: 'backend-film-550' },
    });

    mockUseFilmReviews.mockReturnValue({
      data: reviewsData,
      isLoading: false,
    });

    mockUseUserFilmReview.mockReturnValue({
      existingReview: null,
      hasReviewed: false,
    });

    mockUseCreateReview.mockReturnValue({
      mutate: mockCreateReviewMutate,
      isPending: false,
    });

    mockUseUpdateReview.mockReturnValue({
      mutate: mockUpdateReviewMutate,
      isPending: false,
    });

    mockUseLikeReview.mockReturnValue({
      mutate: mockLikeReviewMutate,
    });

    mockUseIsInWatchlist.mockReturnValue({
      data: { isInWatchlist: false },
    });

    mockUseToggleWatchlist.mockReturnValue({
      toggleWatchlist: mockToggleWatchlist,
      isLoading: false,
    });

    mockGetImageUrl.mockImplementation(
      (path: string | null) => `https://image.test${path ?? '/fallback.jpg'}`
    );
  });

  it('affiche le loader pendant le chargement', () => {
    mockUseFilm.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });

    render(<FilmDetailPage />);

    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('affiche une erreur si le film est introuvable', () => {
    mockUseFilm.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Not found'),
    });

    render(<FilmDetailPage />);

    expect(screen.getByRole('heading', { name: /film not found/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to films/i })).toHaveAttribute('href', '/films');
  });

  it('affiche les informations principales du film', () => {
    render(<FilmDetailPage />);

    expect(screen.getByRole('heading', { name: 'Fight Club' })).toBeInTheDocument();
    expect(screen.getByText(/2h 19m/i)).toBeInTheDocument();
    expect(screen.getByText(/directed by/i)).toBeInTheDocument();
    expect(screen.getByText('David Fincher')).toBeInTheDocument();
    expect(screen.getByText(/mischief\. mayhem\. soap\./i)).toBeInTheDocument();
    expect(
      screen.getByText(/an insomniac office worker crosses paths with a soap maker\./i)
    ).toBeInTheDocument();
  });

  it('affiche les genres et les liens externes', () => {
    render(<FilmDetailPage />);

    expect(screen.getByRole('link', { name: 'Drama' })).toHaveAttribute('href', '/films/drama');
    expect(screen.getByRole('link', { name: 'Thriller' })).toHaveAttribute(
      'href',
      '/films/thriller'
    );
    expect(screen.getByRole('link', { name: /official site/i })).toHaveAttribute(
      'href',
      'https://example.com'
    );
    expect(screen.getByRole('link', { name: 'IMDb' })).toHaveAttribute(
      'href',
      'https://www.imdb.com/title/tt0137523'
    );
  });

  it('affiche les plateformes de streaming', () => {
    render(<FilmDetailPage />);

    expect(screen.getByText(/where to watch/i)).toBeInTheDocument();
    expect(screen.getByAltText('Netflix')).toBeInTheDocument();
  });

  it('toggle la watchlist', async () => {
    const user = userEvent.setup();

    render(<FilmDetailPage />);

    await user.click(screen.getByTestId('watchlist-button'));

    expect(mockToggleWatchlist).toHaveBeenCalledWith('backend-film-550', false);
  });

  it('désactive le bouton watchlist si utilisateur non authentifié', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
    });

    render(<FilmDetailPage />);

    expect(screen.getByTestId('watchlist-button')).toBeDisabled();
  });

  it('ouvre le formulaire de review quand on clique sur Write a Review', async () => {
    const user = userEvent.setup();

    render(<FilmDetailPage />);

    await user.click(screen.getByRole('button', { name: /write a review/i }));

    expect(screen.getByTestId('review-form')).toBeInTheDocument();
  });

  it('ouvre le formulaire de review via la note utilisateur', async () => {
    const user = userEvent.setup();

    render(<FilmDetailPage />);

    await user.click(screen.getByRole('button', { name: /rate 4/i }));

    expect(screen.getByTestId('review-form')).toBeInTheDocument();
  });

  it('soumet une nouvelle review', async () => {
    const user = userEvent.setup();

    render(<FilmDetailPage />);

    await user.click(screen.getByRole('button', { name: /write a review/i }));
    await user.click(screen.getByRole('button', { name: /submit review/i }));

    expect(mockCreateReviewMutate).toHaveBeenCalledWith(
      { filmId: 'backend-film-550', rating: 4, comment: 'Great film' },
      expect.objectContaining({
        onSuccess: expect.any(Function),
        onError: expect.any(Function),
      })
    );
  });

  it('met à jour une review existante', async () => {
    const user = userEvent.setup();

    mockUseUserFilmReview.mockReturnValue({
      existingReview: {
        id: 'r-existing',
        rating: 5,
        comment: 'Old comment',
      },
      hasReviewed: true,
    });

    render(<FilmDetailPage />);

    await user.click(screen.getByRole('button', { name: /edit your review/i }));
    await user.click(screen.getByRole('button', { name: /submit review/i }));

    expect(mockUpdateReviewMutate).toHaveBeenCalledWith(
      {
        reviewId: 'r-existing',
        input: { rating: 4, comment: 'Great film' },
      },
      expect.objectContaining({
        onSuccess: expect.any(Function),
        onError: expect.any(Function),
      })
    );
  });

  it('like une review', async () => {
    const user = userEvent.setup();

    render(<FilmDetailPage />);

    await user.click(screen.getByRole('button', { name: /like review/i }));

    expect(mockLikeReviewMutate).toHaveBeenCalledWith('r1');
  });

  it('affiche les tabs et change de tab', async () => {
    const user = userEvent.setup();

    render(<FilmDetailPage />);

    expect(screen.getByRole('button', { name: /cast/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /crew/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /details/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /genres/i })).toBeInTheDocument();

    expect(screen.getByText('Brad Pitt')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /crew/i }));
    expect(screen.getAllByText('Jim Uhls').length).toBeGreaterThan(0);

    await user.click(screen.getByRole('button', { name: /details/i }));
    expect(screen.getByText('Released')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /genres/i }));
    expect(screen.getAllByRole('link', { name: 'Drama' }).length).toBeGreaterThan(0);
  });

  it('affiche les films similaires', () => {
    render(<FilmDetailPage />);

    expect(screen.getByText(/similar films/i)).toBeInTheDocument();
    expect(screen.getAllByTestId('film-poster')).toHaveLength(2);
  });

  it('affiche les reviews', () => {
    render(<FilmDetailPage />);

    expect(screen.getByRole('heading', { name: /reviews/i })).toBeInTheDocument();
    expect(screen.getByTestId('review-card')).toBeInTheDocument();
    expect(screen.getByText('bob')).toBeInTheDocument();
    expect(screen.getByText('Amazing.')).toBeInTheDocument();
  });

  it('affiche l’état vide des reviews', () => {
    mockUseFilmReviews.mockReturnValue({
      data: { items: [], total: 0, totalPages: 0 },
      isLoading: false,
    });

    render(<FilmDetailPage />);

    expect(screen.getByText(/no reviews yet/i)).toBeInTheDocument();
    expect(screen.getByText(/be the first to share your thoughts/i)).toBeInTheDocument();
  });

  it('affiche le loader des reviews', () => {
    mockUseFilmReviews.mockReturnValue({
      data: undefined,
      isLoading: true,
    });

    render(<FilmDetailPage />);

    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('redirige vers login si non authentifié pour écrire une review', async () => {
    const user = userEvent.setup();

    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
    });

    const originalLocation = window.location;

    Object.defineProperty(window, 'location', {
      writable: true,
      value: { ...originalLocation, href: '' } as Location,
    });

    render(<FilmDetailPage />);

    await user.click(screen.getByRole('button', { name: /write a review/i }));

    expect(window.location.href).toBe('/profil?mode=login');

    Object.defineProperty(window, 'location', {
      writable: true,
      value: originalLocation as Location,
    });
  });
});
