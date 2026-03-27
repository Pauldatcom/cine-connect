import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { PersonDetailPage } from '@/routes/person.$id';

const { mockUseParams, mockUsePerson, mockUsePersonMovieCredits, mockGetImageUrl } = vi.hoisted(
  () => ({
    mockUseParams: vi.fn(),
    mockUsePerson: vi.fn(),
    mockUsePersonMovieCredits: vi.fn(),
    mockGetImageUrl: vi.fn(),
  })
);

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

vi.mock('@/hooks', () => ({
  usePerson: mockUsePerson,
  usePersonMovieCredits: mockUsePersonMovieCredits,
}));

vi.mock('@/lib/api/tmdb', () => ({
  getImageUrl: mockGetImageUrl,
}));

vi.mock('@/components/features/FilmPoster', () => ({
  FilmPoster: ({ film, showTitle }: { film: { title?: string }; showTitle?: boolean }) => (
    <div data-testid="film-poster">
      <span>{film.title}</span>
      <span>{showTitle ? 'show-title' : 'hide-title'}</span>
    </div>
  ),
}));

const mockPerson = {
  id: 287,
  name: 'Brad Pitt',
  profile_path: '/brad-pitt.jpg',
  known_for_department: 'Acting',
  birthday: '1963-12-18',
  deathday: null,
  place_of_birth: 'Shawnee, Oklahoma, USA',
  biography: 'Brad Pitt is an American actor and film producer.',
  also_known_as: ['William Bradley Pitt', 'ブラッド・ピット', '布拉德·皮特'],
};

const mockCredits = {
  cast: [
    {
      id: 550,
      credit_id: 'cast-1',
      title: 'Fight Club',
      poster_path: '/fight-club.jpg',
      popularity: 90,
      character: 'Tyler Durden',
    },
    {
      id: 13,
      credit_id: 'cast-2',
      title: 'Se7en',
      poster_path: '/se7en.jpg',
      popularity: 85,
      character: 'Detective Mills',
    },
    {
      id: 999,
      credit_id: 'cast-3',
      title: 'No Poster Movie',
      poster_path: null,
      popularity: 999,
      character: 'Someone',
    },
  ],
  crew: [
    {
      id: 101,
      credit_id: 'crew-1',
      title: 'Movie Produced A',
      poster_path: '/produced-a.jpg',
      popularity: 70,
      department: 'Production',
      job: 'Producer',
    },
    {
      id: 102,
      credit_id: 'crew-2',
      title: 'Movie Produced B',
      poster_path: '/produced-b.jpg',
      popularity: 60,
      department: 'Production',
      job: 'Producer',
    },
    {
      id: 103,
      credit_id: 'crew-3',
      title: 'Movie Written A',
      poster_path: '/written-a.jpg',
      popularity: 80,
      department: 'Writing',
      job: 'Writer',
    },
    {
      id: 104,
      credit_id: 'crew-4',
      title: 'Crew Without Poster',
      poster_path: null,
      popularity: 999,
      department: 'Directing',
      job: 'Director',
    },
  ],
};

describe('PersonDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockUseParams.mockReturnValue({ id: '287' });

    mockUsePerson.mockReturnValue({
      data: mockPerson,
      isLoading: false,
      error: null,
    });

    mockUsePersonMovieCredits.mockReturnValue({
      data: mockCredits,
    });

    mockGetImageUrl.mockImplementation(
      (path: string | null) => `https://image.test${path ?? '/fallback.jpg'}`
    );
  });

  it('affiche le loader pendant le chargement', () => {
    mockUsePerson.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });

    render(<PersonDetailPage />);

    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('affiche une erreur si la personne est introuvable', () => {
    mockUsePerson.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Not found'),
    });

    render(<PersonDetailPage />);

    expect(screen.getByRole('heading', { name: /person not found/i })).toBeInTheDocument();
    expect(
      screen.getByText(/we couldn't find the person you're looking for\./i)
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to films/i })).toHaveAttribute('href', '/films');
  });

  it('affiche les informations principales de la personne', () => {
    render(<PersonDetailPage />);

    expect(screen.getByRole('heading', { name: 'Brad Pitt' })).toBeInTheDocument();
    expect(screen.getByText(/known for acting/i)).toBeInTheDocument();
    expect(screen.getByText('1963')).toBeInTheDocument();
    expect(screen.getByText('Shawnee, Oklahoma, USA')).toBeInTheDocument();
    expect(
      screen.getByText('Brad Pitt is an American actor and film producer.')
    ).toBeInTheDocument();
    expect(
      screen.getByText('William Bradley Pitt, ブラッド・ピット, 布拉德·皮特')
    ).toBeInTheDocument();
  });

  it('affiche la photo de profil quand elle existe', () => {
    render(<PersonDetailPage />);

    const image = screen.getByAltText('Brad Pitt');
    expect(image).toHaveAttribute('src', 'https://image.test/brad-pitt.jpg');
  });

  it('affiche l’initiale si aucune photo de profil n’existe', () => {
    mockUsePerson.mockReturnValue({
      data: {
        ...mockPerson,
        profile_path: null,
      },
      isLoading: false,
      error: null,
    });

    render(<PersonDetailPage />);

    expect(screen.getByText('B')).toBeInTheDocument();
    expect(screen.queryByAltText('Brad Pitt')).not.toBeInTheDocument();
  });

  it('affiche le lien retour', () => {
    render(<PersonDetailPage />);

    expect(screen.getByRole('link', { name: /back/i })).toHaveAttribute('href', '/films');
  });

  it('affiche les films de cast avec poster, triés par popularité', () => {
    render(<PersonDetailPage />);

    expect(screen.getByRole('heading', { name: /as actor/i })).toBeInTheDocument();

    const posters = screen.getAllByTestId('film-poster');
    expect(posters).toHaveLength(5);
    expect(posters[0]).toHaveTextContent('Fight Club');
    expect(posters[1]).toHaveTextContent('Se7en');

    expect(screen.queryByText('No Poster Movie')).not.toBeInTheDocument();
  });

  it('affiche les sections crew groupées par département', () => {
    render(<PersonDetailPage />);

    expect(screen.getByRole('heading', { name: /behind the camera/i })).toBeInTheDocument();
    expect(screen.getByText(/production/i)).toBeInTheDocument();
    expect(screen.getByText(/writing/i)).toBeInTheDocument();
    expect(screen.getByText('Movie Produced A')).toBeInTheDocument();
    expect(screen.getByText('Movie Produced B')).toBeInTheDocument();
    expect(screen.getByText('Movie Written A')).toBeInTheDocument();
    expect(screen.queryByText('Crew Without Poster')).not.toBeInTheDocument();
  });

  it('n’affiche pas la section acteur si aucun cast valide n’existe', () => {
    mockUsePersonMovieCredits.mockReturnValue({
      data: {
        cast: [
          {
            id: 1,
            credit_id: 'cast-x',
            title: 'Cast Without Poster',
            poster_path: null,
            popularity: 100,
            character: 'X',
          },
        ],
        crew: mockCredits.crew,
      },
    });

    render(<PersonDetailPage />);

    expect(screen.queryByRole('heading', { name: /as actor/i })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /behind the camera/i })).toBeInTheDocument();
  });

  it('n’affiche pas la section crew si aucun crew valide n’existe', () => {
    mockUsePersonMovieCredits.mockReturnValue({
      data: {
        cast: mockCredits.cast,
        crew: [
          {
            id: 1,
            credit_id: 'crew-x',
            title: 'Crew Without Poster',
            poster_path: null,
            popularity: 100,
            department: 'Directing',
            job: 'Director',
          },
        ],
      },
    });

    render(<PersonDetailPage />);

    expect(screen.getByRole('heading', { name: /as actor/i })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /behind the camera/i })).not.toBeInTheDocument();
  });

  it('affiche le message no filmography available si aucun crédit valide n’existe', () => {
    mockUsePersonMovieCredits.mockReturnValue({
      data: {
        cast: [],
        crew: [],
      },
    });

    render(<PersonDetailPage />);

    expect(screen.getByText(/no filmography available/i)).toBeInTheDocument();
  });

  it('n’affiche pas biography si elle est vide', () => {
    mockUsePerson.mockReturnValue({
      data: {
        ...mockPerson,
        biography: '',
      },
      isLoading: false,
      error: null,
    });

    render(<PersonDetailPage />);

    expect(screen.queryByText(/biography/i)).not.toBeInTheDocument();
  });

  it('n’affiche pas also known as si la liste est vide', () => {
    mockUsePerson.mockReturnValue({
      data: {
        ...mockPerson,
        also_known_as: [],
      },
      isLoading: false,
      error: null,
    });

    render(<PersonDetailPage />);

    expect(screen.queryByText(/also known as/i)).not.toBeInTheDocument();
  });

  it('affiche la death year si présente', () => {
    mockUsePerson.mockReturnValue({
      data: {
        ...mockPerson,
        deathday: '2020-01-01',
      },
      isLoading: false,
      error: null,
    });

    render(<PersonDetailPage />);

    expect(screen.getByText(/1963 - 2020/i)).toBeInTheDocument();
  });

  it('appelle les hooks avec le bon id', () => {
    render(<PersonDetailPage />);

    expect(mockUsePerson).toHaveBeenCalledWith('287');
    expect(mockUsePersonMovieCredits).toHaveBeenCalledWith('287', true);
  });
});
