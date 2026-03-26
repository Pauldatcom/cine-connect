import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { FilmsLayout } from '@/routes/films';

const { mockGetGenres } = vi.hoisted(() => ({
  mockGetGenres: vi.fn(),
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
      href={params?.categorie ? to.replace('$categorie', params.categorie) : to}
      className={className}
      data-testid="mock-link"
    >
      {children}
    </a>
  ),
  Outlet: () => <div data-testid="outlet">Outlet Content</div>,
}));

vi.mock('@/lib/api/tmdb', () => ({
  getGenres: mockGetGenres,
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

describe('FilmsLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockGetGenres.mockResolvedValue({
      genres: [
        { id: 28, name: 'Action' },
        { id: 35, name: 'Comedy' },
        { id: 878, name: 'Science Fiction' },
      ],
    });
  });

  it('affiche le lien All Films', async () => {
    renderWithClient(<FilmsLayout />);

    expect(await screen.findByRole('link', { name: /all films/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /all films/i })).toHaveAttribute('href', '/films');
  });

  it('affiche les genres récupérés depuis l’API', async () => {
    renderWithClient(<FilmsLayout />);

    expect(await screen.findByRole('link', { name: 'Action' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Comedy' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Science Fiction' })).toBeInTheDocument();
  });

  it('génère le bon lien pour chaque genre', async () => {
    renderWithClient(<FilmsLayout />);

    expect(await screen.findByRole('link', { name: 'Action' })).toHaveAttribute(
      'href',
      '/films/action'
    );

    expect(screen.getByRole('link', { name: 'Comedy' })).toHaveAttribute('href', '/films/comedy');

    expect(screen.getByRole('link', { name: 'Science Fiction' })).toHaveAttribute(
      'href',
      '/films/science-fiction'
    );
  });

  it('affiche le contenu enfant via Outlet', async () => {
    renderWithClient(<FilmsLayout />);

    expect(await screen.findByTestId('outlet')).toBeInTheDocument();
    expect(screen.getByTestId('outlet')).toHaveTextContent('Outlet Content');
  });

  it('appelle getGenres', async () => {
    renderWithClient(<FilmsLayout />);

    await screen.findByRole('link', { name: 'Action' });

    expect(mockGetGenres).toHaveBeenCalledTimes(1);
  });

  it('n’affiche que All Films si aucun genre n’est retourné', async () => {
    mockGetGenres.mockResolvedValueOnce({
      genres: [],
    });

    renderWithClient(<FilmsLayout />);

    expect(await screen.findByRole('link', { name: /all films/i })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Action' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Comedy' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Science Fiction' })).not.toBeInTheDocument();
  });

  it('n’affiche que All Films si la requête ne renvoie pas encore de données', async () => {
    mockGetGenres.mockResolvedValueOnce(undefined);

    renderWithClient(<FilmsLayout />);

    expect(await screen.findByRole('link', { name: /all films/i })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Action' })).not.toBeInTheDocument();
  });
});
