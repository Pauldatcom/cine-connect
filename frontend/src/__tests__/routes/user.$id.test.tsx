import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { UserProfilePage } from '@/routes/user.$id';

const { mockUseParams, mockUseUserById, mockUseUserReviews } = vi.hoisted(() => ({
  mockUseParams: vi.fn(),
  mockUseUserById: vi.fn(),
  mockUseUserReviews: vi.fn(),
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

    if (params?.id) {
      href = to.replace('$id', params.id);
    }

    return (
      <a href={href} className={className} data-testid="mock-link">
        {children}
      </a>
    );
  },
}));

vi.mock('@/hooks/useFriends', () => ({
  useUserById: mockUseUserById,
}));

vi.mock('@/hooks/useReviews', () => ({
  useUserReviews: mockUseUserReviews,
}));

const mockUser = {
  id: 'user-1',
  username: 'alice',
  avatarUrl: null,
  createdAt: '2024-01-15T10:00:00.000Z',
};

const mockReviews = [
  {
    id: 'review-1',
    rating: 9,
    comment: 'Amazing movie with a great atmosphere.',
    createdAt: '2025-03-20T10:00:00.000Z',
    film: {
      id: 'film-1',
      tmdbId: 550,
      title: 'Fight Club',
    },
  },
  {
    id: 'review-2',
    rating: 8,
    comment: 'Really solid thriller.',
    createdAt: '2025-03-21T12:00:00.000Z',
    film: {
      id: 'film-2',
      tmdbId: 13,
      title: 'Se7en',
    },
  },
];

describe('UserProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockUseParams.mockReturnValue({ id: 'user-1' });

    mockUseUserById.mockReturnValue({
      data: mockUser,
      isLoading: false,
      error: null,
    });

    mockUseUserReviews.mockReturnValue({
      data: mockReviews,
      isLoading: false,
    });
  });

  it('affiche le loader pendant le chargement utilisateur', () => {
    mockUseUserById.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });

    render(<UserProfilePage />);

    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('affiche le loader si id est absent', () => {
    mockUseParams.mockReturnValue({ id: '' });

    render(<UserProfilePage />);

    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('affiche une erreur si l’utilisateur est introuvable', () => {
    mockUseUserById.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Not found'),
    });

    render(<UserProfilePage />);

    expect(screen.getByText('User not found.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to members/i })).toHaveAttribute(
      'href',
      '/members'
    );
  });

  it('affiche les informations principales du profil', () => {
    render(<UserProfilePage />);

    expect(screen.getByRole('heading', { name: 'alice' })).toBeInTheDocument();
    expect(screen.getByText(/member since january 2024/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to members/i })).toHaveAttribute(
      'href',
      '/members'
    );
  });

  it('affiche l’avatar si présent', () => {
    mockUseUserById.mockReturnValue({
      data: {
        ...mockUser,
        avatarUrl: 'https://image.test/avatar.jpg',
      },
      isLoading: false,
      error: null,
    });

    render(<UserProfilePage />);

    const img = document.querySelector('img');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://image.test/avatar.jpg');
  });

  it('affiche l’icône par défaut si avatar absent', () => {
    render(<UserProfilePage />);

    const img = document.querySelector('img');
    expect(img).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'alice' })).toBeInTheDocument();
  });

  it('affiche le loader des reviews', () => {
    mockUseUserReviews.mockReturnValue({
      data: [],
      isLoading: true,
    });

    render(<UserProfilePage />);

    expect(screen.getByRole('heading', { name: /reviews/i })).toBeInTheDocument();
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('affiche un état vide si aucune review', () => {
    mockUseUserReviews.mockReturnValue({
      data: [],
      isLoading: false,
    });

    render(<UserProfilePage />);

    expect(screen.getByText('No reviews yet.')).toBeInTheDocument();
  });

  it('affiche les reviews avec les liens vers les films', () => {
    render(<UserProfilePage />);

    expect(screen.getByRole('heading', { name: /reviews/i })).toBeInTheDocument();
    expect(screen.getByText('Fight Club')).toBeInTheDocument();
    expect(screen.getByText('Se7en')).toBeInTheDocument();
    expect(screen.getByText('9/10')).toBeInTheDocument();
    expect(screen.getByText('8/10')).toBeInTheDocument();

    expect(screen.getByRole('link', { name: /fight club/i })).toHaveAttribute('href', '/film/550');
    expect(screen.getByRole('link', { name: /se7en/i })).toHaveAttribute('href', '/film/13');
  });

  it('affiche une review sans lien si le film n’a pas de tmdbId', () => {
    mockUseUserReviews.mockReturnValue({
      data: [
        {
          id: 'review-3',
          rating: 7,
          comment: 'Interesting film.',
          createdAt: '2025-03-22T12:00:00.000Z',
          film: {
            id: 'film-3',
            tmdbId: null,
            title: 'Unknown Film',
          },
        },
      ],
      isLoading: false,
    });

    render(<UserProfilePage />);

    expect(screen.getByText('Unknown Film')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /unknown film/i })).not.toBeInTheDocument();
  });

  it('affiche les commentaires quand ils existent', () => {
    render(<UserProfilePage />);

    expect(screen.getByText('Amazing movie with a great atmosphere.')).toBeInTheDocument();
    expect(screen.getByText('Really solid thriller.')).toBeInTheDocument();
  });

  it('n’affiche pas le commentaire si absent', () => {
    mockUseUserReviews.mockReturnValue({
      data: [
        {
          id: 'review-4',
          rating: 6,
          comment: '',
          createdAt: '2025-03-23T12:00:00.000Z',
          film: {
            id: 'film-4',
            tmdbId: 100,
            title: 'Minimal Film',
          },
        },
      ],
      isLoading: false,
    });

    render(<UserProfilePage />);

    expect(screen.getByText('Minimal Film')).toBeInTheDocument();
    expect(screen.queryByText(/really solid thriller/i)).not.toBeInTheDocument();
  });

  it('limite l’affichage à 10 reviews', () => {
    const manyReviews = Array.from({ length: 12 }, (_, index) => ({
      id: `review-${index + 1}`,
      rating: 8,
      comment: `Comment ${index + 1}`,
      createdAt: '2025-03-20T10:00:00.000Z',
      film: {
        id: `film-${index + 1}`,
        tmdbId: 1000 + index,
        title: `Film ${index + 1}`,
      },
    }));

    mockUseUserReviews.mockReturnValue({
      data: manyReviews,
      isLoading: false,
    });

    render(<UserProfilePage />);

    expect(screen.getByText('Film 1')).toBeInTheDocument();
    expect(screen.getByText('Film 10')).toBeInTheDocument();
    expect(screen.queryByText('Film 11')).not.toBeInTheDocument();
    expect(screen.queryByText('Film 12')).not.toBeInTheDocument();
  });

  it('appelle les hooks avec les bons paramètres', () => {
    render(<UserProfilePage />);

    expect(mockUseUserById).toHaveBeenCalledWith('user-1');
    expect(mockUseUserReviews).toHaveBeenCalledWith('user-1');
  });
});
