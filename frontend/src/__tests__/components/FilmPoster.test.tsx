/**
 * FilmPoster Component Tests (Root level)
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FilmPoster, FilmPosterCompact, FilmPosterLarge } from '@/components/FilmPoster';
import { mockFilm, createMockFilm } from '@/__tests__/test-utils';

// Mock TanStack Router
vi.mock('@tanstack/react-router', () => ({
  Link: ({
    children,
    to,
    params: _params,
    ...props
  }: {
    children: React.ReactNode;
    to: string;
    params?: unknown;
    [key: string]: unknown;
  }) => (
    <a href={to} data-testid="router-link" {...props}>
      {children}
    </a>
  ),
}));

// Mock TMDb API
vi.mock('@/lib/api/tmdb', () => ({
  getImageUrl: (path: string | null, _type: string, _size: string) =>
    path ? `https://image.tmdb.org/t/p/w500${path}` : '/placeholder.jpg',
}));

describe('FilmPoster', () => {
  describe('rendering', () => {
    it('renders film poster with image', () => {
      render(<FilmPoster film={mockFilm} />);

      const img = screen.getByRole('img', { name: mockFilm.title });
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', expect.stringContaining('test-poster.jpg'));
    });

    it('renders film title when showTitle is true', () => {
      render(<FilmPoster film={mockFilm} showTitle />);

      expect(screen.getByText(mockFilm.title)).toBeInTheDocument();
    });

    it('does not render title when showTitle is false', () => {
      render(<FilmPoster film={mockFilm} showTitle={false} />);

      expect(screen.queryByText(mockFilm.title)).not.toBeInTheDocument();
    });

    it('renders year from release_date', () => {
      render(<FilmPoster film={mockFilm} showTitle />);

      expect(screen.getByText('2024')).toBeInTheDocument();
    });

    it('does not render year when release_date is null', () => {
      const filmNoDate = createMockFilm({ release_date: '' });
      render(<FilmPoster film={filmNoDate} showTitle />);

      expect(screen.queryByText(/^\d{4}$/)).not.toBeInTheDocument();
    });

    it('renders rating badge on hover when showRating is true', () => {
      const { container } = render(<FilmPoster film={mockFilm} showRating />);

      // Rating text should exist (visible on hover)
      expect(container.textContent).toContain('8.5');
    });

    it('does not render rating when vote_average is 0', () => {
      const filmNoRating = createMockFilm({ vote_average: 0 });
      const { container } = render(<FilmPoster film={filmNoRating} showRating />);

      // Should not contain a rating
      expect(container.querySelector('.text-sm.font-semibold')).toBeNull();
    });
  });

  describe('link behavior', () => {
    it('links to film detail page', () => {
      render(<FilmPoster film={mockFilm} />);

      const link = screen.getByTestId('router-link');
      expect(link).toHaveAttribute('href', '/film/$id');
    });
  });

  describe('loading behavior', () => {
    it('uses lazy loading by default', () => {
      render(<FilmPoster film={mockFilm} />);

      const img = screen.getByRole('img', { name: mockFilm.title });
      expect(img).toHaveAttribute('loading', 'lazy');
    });

    it('uses eager loading when priority is true', () => {
      render(<FilmPoster film={mockFilm} priority />);

      const img = screen.getByRole('img', { name: mockFilm.title });
      expect(img).toHaveAttribute('loading', 'eager');
    });
  });
});

describe('FilmPosterCompact', () => {
  it('renders compact poster without title', () => {
    render(<FilmPosterCompact film={mockFilm} />);

    const img = screen.getByRole('img', { name: mockFilm.title });
    expect(img).toBeInTheDocument();

    // Should not have title text outside of alt
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('links to film detail page', () => {
    render(<FilmPosterCompact film={mockFilm} />);

    const link = screen.getByTestId('router-link');
    expect(link).toHaveAttribute('href', '/film/$id');
  });

  it('uses lazy loading', () => {
    render(<FilmPosterCompact film={mockFilm} />);

    const img = screen.getByRole('img', { name: mockFilm.title });
    expect(img).toHaveAttribute('loading', 'lazy');
  });
});

describe('FilmPosterLarge', () => {
  it('renders large poster with image', () => {
    render(<FilmPosterLarge film={mockFilm} />);

    const img = screen.getByRole('img', { name: mockFilm.title });
    expect(img).toBeInTheDocument();
  });

  it('renders film title on hover overlay', () => {
    render(<FilmPosterLarge film={mockFilm} />);

    expect(screen.getByText(mockFilm.title)).toBeInTheDocument();
  });

  it('renders year when release_date exists', () => {
    render(<FilmPosterLarge film={mockFilm} />);

    expect(screen.getByText('2024')).toBeInTheDocument();
  });

  it('does not render year when release_date is empty', () => {
    const filmNoDate = createMockFilm({ release_date: '' });
    render(<FilmPosterLarge film={filmNoDate} />);

    expect(screen.queryByText(/^\d{4}$/)).not.toBeInTheDocument();
  });

  it('renders rating when vote_average > 0', () => {
    render(<FilmPosterLarge film={mockFilm} />);

    expect(screen.getByText('8.5')).toBeInTheDocument();
  });

  it('does not render rating when vote_average is 0', () => {
    const filmNoRating = createMockFilm({ vote_average: 0 });
    const { container } = render(<FilmPosterLarge film={filmNoRating} />);

    // Should not have the rating star icon
    expect(container.querySelector('.h-3.w-3.fill-current')).toBeNull();
  });

  it('links to film detail page', () => {
    render(<FilmPosterLarge film={mockFilm} />);

    const link = screen.getByTestId('router-link');
    expect(link).toHaveAttribute('href', '/film/$id');
  });
});
