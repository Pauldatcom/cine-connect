/**
 * FilmCard (UI) Component Tests
 *
 * Tests for FilmActivityCard and FilmRow components
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FilmActivityCard, FilmRow } from '@/components/ui/FilmCard';
import { mockFilm, createMockFilm, createMockFilmList } from '@/__tests__/test-utils';

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

// Mock StarRatingDisplay
vi.mock('@/components/ui/StarRating', () => ({
  StarRatingDisplay: ({ rating }: { rating: number }) => (
    <div data-testid="star-rating-display">{rating}/10</div>
  ),
}));

describe('FilmActivityCard', () => {
  const defaultUser = {
    name: 'John Doe',
    avatar: undefined,
  };

  describe('compact mode', () => {
    it('renders compact card with film info', () => {
      render(<FilmActivityCard film={mockFilm} activity="watched" user={defaultUser} compact />);

      expect(screen.getByText(mockFilm.title)).toBeInTheDocument();
      expect(screen.getByRole('img', { name: mockFilm.title })).toBeInTheDocument();
    });

    it('renders year in compact mode', () => {
      render(<FilmActivityCard film={mockFilm} activity="watched" user={defaultUser} compact />);

      expect(screen.getByText('2024')).toBeInTheDocument();
    });

    it('renders rating in compact mode', () => {
      render(
        <FilmActivityCard
          film={mockFilm}
          activity="reviewed"
          user={defaultUser}
          rating={8}
          compact
        />
      );

      expect(screen.getByTestId('star-rating-display')).toBeInTheDocument();
    });

    it('links to film detail page in compact mode', () => {
      render(<FilmActivityCard film={mockFilm} activity="liked" user={defaultUser} compact />);

      const link = screen.getByTestId('router-link');
      expect(link).toBeInTheDocument();
    });
  });

  describe('full mode', () => {
    it('renders full card with film poster', () => {
      render(<FilmActivityCard film={mockFilm} activity="reviewed" user={defaultUser} />);

      expect(screen.getByRole('img', { name: mockFilm.title })).toBeInTheDocument();
    });

    it('renders user info when provided', () => {
      render(<FilmActivityCard film={mockFilm} activity="watched" user={defaultUser} />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('renders user avatar when provided', () => {
      const userWithAvatar = {
        name: 'Jane',
        avatar: 'https://example.com/avatar.jpg',
      };

      const { container } = render(
        <FilmActivityCard film={mockFilm} activity="liked" user={userWithAvatar} />
      );

      // Find avatar by src attribute
      const avatarImg = container.querySelector('img[src="https://example.com/avatar.jpg"]');
      expect(avatarImg).toBeInTheDocument();
    });

    it('renders user initial when no avatar', () => {
      render(<FilmActivityCard film={mockFilm} activity="watched" user={{ name: 'Alice' }} />);

      expect(screen.getByText('A')).toBeInTheDocument();
    });

    it('renders film title and year', () => {
      render(<FilmActivityCard film={mockFilm} activity="reviewed" />);

      expect(screen.getByText(mockFilm.title)).toBeInTheDocument();
      expect(screen.getByText('2024')).toBeInTheDocument();
    });

    it('renders rating when provided', () => {
      render(<FilmActivityCard film={mockFilm} activity="logged" rating={7} />);

      expect(screen.getByTestId('star-rating-display')).toBeInTheDocument();
    });

    it('renders review text when provided', () => {
      render(
        <FilmActivityCard
          film={mockFilm}
          activity="reviewed"
          reviewText="Great movie! Highly recommend."
        />
      );

      expect(screen.getByText('Great movie! Highly recommend.')).toBeInTheDocument();
    });

    it('renders date when provided', () => {
      render(<FilmActivityCard film={mockFilm} activity="watched" date="Jan 15, 2024" />);

      expect(screen.getByText('Jan 15, 2024')).toBeInTheDocument();
    });
  });

  describe('activity types', () => {
    it.each(['watched', 'liked', 'reviewed', 'logged'] as const)(
      'renders %s activity correctly',
      (activity) => {
        const { container } = render(
          <FilmActivityCard film={mockFilm} activity={activity} user={defaultUser} />
        );

        // Should render without errors
        expect(container).toBeInTheDocument();
      }
    );
  });

  describe('edge cases', () => {
    it('handles film without release_date', () => {
      const filmNoDate = createMockFilm({ release_date: '' });

      render(<FilmActivityCard film={filmNoDate} activity="watched" />);

      expect(screen.getByText(filmNoDate.title)).toBeInTheDocument();
    });

    it('renders without user info', () => {
      render(<FilmActivityCard film={mockFilm} activity="watched" />);

      expect(screen.getByText(mockFilm.title)).toBeInTheDocument();
    });
  });
});

describe('FilmRow', () => {
  it('renders multiple films', () => {
    const films = createMockFilmList(5);

    render(<FilmRow films={films} />);

    films.forEach((film) => {
      expect(screen.getByRole('img', { name: film.title })).toBeInTheDocument();
    });
  });

  it('renders empty when no films', () => {
    const { container } = render(<FilmRow films={[]} />);

    const images = container.querySelectorAll('img');
    expect(images.length).toBe(0);
  });

  it('renders film links', () => {
    const films = createMockFilmList(3);

    render(<FilmRow films={films} />);

    const links = screen.getAllByTestId('router-link');
    expect(links.length).toBe(3);
  });

  it('shows rating when showRating is true', () => {
    const films = createMockFilmList(2);

    render(<FilmRow films={films} showRating />);

    const ratings = screen.getAllByTestId('star-rating-display');
    expect(ratings.length).toBe(2);
  });

  it('does not show rating when showRating is false', () => {
    const films = createMockFilmList(2);

    render(<FilmRow films={films} showRating={false} />);

    expect(screen.queryByTestId('star-rating-display')).not.toBeInTheDocument();
  });

  it('does not show rating for films with vote_average 0', () => {
    const films = [createMockFilm({ vote_average: 0, id: 1 })];

    render(<FilmRow films={films} showRating />);

    expect(screen.queryByTestId('star-rating-display')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <FilmRow films={createMockFilmList(1)} className="custom-class" />
    );

    expect(container.querySelector('.custom-class')).toBeInTheDocument();
  });
});
