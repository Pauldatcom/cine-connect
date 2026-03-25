import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { FilmsCategoryPage } from '@/routes/films.$categorie';

const { mockUseParams, mockGetMoviesByGenre, mockGetGenres } = vi.hoisted(() => ({
  mockUseParams: vi.fn(),
  mockGetMoviesByGenre: vi.fn(),
  mockGetGenres: vi.fn(),
}));

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => () => ({
    useParams: mockUseParams,
  }),
}));

vi.mock('@/lib/api/tmdb', () => ({
  GENRE_MAP: {
    action: 28,
    comedy: 35,
    drama: 18,
  },
  getMoviesByGenre: mockGetMoviesByGenre,
  getGenres: mockGetGenres,
}));

vi.mock('@/components/features/FilmPoster', () => ({
  FilmPoster: ({ film }: { film: { title?: string; name?: string } }) => (
    <div data-testid="film-poster">{film.title || film.name}</div>
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

describe('FilmsCategoryPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('affiche les films de la catégorie', async () => {
    mockUseParams.mockReturnValue({ categorie: 'action' });

    mockGetGenres.mockResolvedValue({
      genres: [{ id: 28, name: 'Action' }],
    });

    mockGetMoviesByGenre.mockResolvedValue({
      page: 1,
      total_pages: 1,
      total_results: 2,
      results: [
        { id: 1, title: 'Mad Max: Fury Road' },
        { id: 2, title: 'John Wick' },
      ],
    });

    renderWithClient(<FilmsCategoryPage />);

    expect(await screen.findByText('Mad Max: Fury Road')).toBeInTheDocument();
    expect(screen.getByText('John Wick')).toBeInTheDocument();
    expect(screen.getByText('2 films')).toBeInTheDocument();
  });

  it('affiche un message si la catégorie n’existe pas', async () => {
    mockUseParams.mockReturnValue({ categorie: 'inconnue' });

    mockGetGenres.mockResolvedValue({
      genres: [
        { id: 28, name: 'Action' },
        { id: 35, name: 'Comedy' },
      ],
    });

    renderWithClient(<FilmsCategoryPage />);

    expect(await screen.findByText(/category not found/i)).toBeInTheDocument();
    expect(screen.getByText(/the category/i)).toBeInTheDocument();
  });

  it('affiche une erreur si la requête films échoue', async () => {
    mockUseParams.mockReturnValue({ categorie: 'action' });

    mockGetGenres.mockResolvedValue({
      genres: [{ id: 28, name: 'Action' }],
    });

    mockGetMoviesByGenre.mockRejectedValue(new Error('API Error'));

    renderWithClient(<FilmsCategoryPage />);

    expect(
      await screen.findByText(/error loading films\. please try again\./i)
    ).toBeInTheDocument();
  });

  it('affiche un message si aucun film n’est trouvé', async () => {
    mockUseParams.mockReturnValue({ categorie: 'action' });

    mockGetGenres.mockResolvedValue({
      genres: [{ id: 28, name: 'Action' }],
    });

    mockGetMoviesByGenre.mockResolvedValue({
      page: 1,
      total_pages: 1,
      total_results: 0,
      results: [],
    });

    renderWithClient(<FilmsCategoryPage />);

    expect(await screen.findByText(/no action films found\./i)).toBeInTheDocument();
  });

  it('affiche le bouton load more et charge la page suivante', async () => {
    mockUseParams.mockReturnValue({ categorie: 'action' });

    mockGetGenres.mockResolvedValue({
      genres: [{ id: 28, name: 'Action' }],
    });

    mockGetMoviesByGenre
      .mockResolvedValueOnce({
        page: 1,
        total_pages: 2,
        total_results: 4,
        results: [
          { id: 1, title: 'Film 1' },
          { id: 2, title: 'Film 2' },
        ],
      })
      .mockResolvedValueOnce({
        page: 2,
        total_pages: 2,
        total_results: 4,
        results: [
          { id: 3, title: 'Film 3' },
          { id: 4, title: 'Film 4' },
        ],
      });

    renderWithClient(<FilmsCategoryPage />);

    expect(await screen.findByText('Film 1')).toBeInTheDocument();
    expect(screen.getByText('Film 2')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button'));

    expect(await screen.findByText('Film 3')).toBeInTheDocument();
    expect(screen.getByText('Film 4')).toBeInTheDocument();

    expect(mockGetMoviesByGenre).toHaveBeenNthCalledWith(1, 28, 1);
    expect(mockGetMoviesByGenre).toHaveBeenNthCalledWith(2, 28, 2);
  });

  it('n’affiche pas le bouton load more sur la dernière page', async () => {
    mockUseParams.mockReturnValue({ categorie: 'action' });

    mockGetGenres.mockResolvedValue({
      genres: [{ id: 28, name: 'Action' }],
    });

    mockGetMoviesByGenre.mockResolvedValue({
      page: 1,
      total_pages: 1,
      total_results: 2,
      results: [
        { id: 1, title: 'Film 1' },
        { id: 2, title: 'Film 2' },
      ],
    });

    renderWithClient(<FilmsCategoryPage />);

    expect(await screen.findByText('Film 1')).toBeInTheDocument();
    expect(screen.getByText('Film 2')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
