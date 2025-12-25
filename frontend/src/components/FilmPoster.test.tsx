/**
 * FilmPoster Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createTestWrapper, mockFilm, createMockFilm } from '@/test/test-utils';

// Mock TanStack Router - spread props to preserve className
vi.mock('@tanstack/react-router', () => ({
  Link: ({
    children,
    to,
    ...props
  }: {
    children: React.ReactNode;
    to: string;
    [key: string]: unknown;
  }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

import { FilmPoster, FilmPosterCompact, FilmPosterLarge } from './FilmPoster';

describe('FilmPoster', () => {
  it('renders film title', () => {
    const Wrapper = createTestWrapper();
    render(<FilmPoster film={mockFilm} />, { wrapper: Wrapper });
    expect(screen.getByText('Test Movie')).toBeInTheDocument();
  });

  it('renders release year', () => {
    const Wrapper = createTestWrapper();
    render(<FilmPoster film={mockFilm} />, { wrapper: Wrapper });
    expect(screen.getByText('2024')).toBeInTheDocument();
  });

  it('renders poster image with correct src', () => {
    const Wrapper = createTestWrapper();
    render(<FilmPoster film={mockFilm} />, { wrapper: Wrapper });

    const img = screen.getByAltText('Test Movie');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', expect.stringContaining('test-poster.jpg'));
  });

  it('hides title when showTitle is false', () => {
    const Wrapper = createTestWrapper();
    render(<FilmPoster film={mockFilm} showTitle={false} />, { wrapper: Wrapper });
    expect(screen.queryByText('Test Movie')).not.toBeInTheDocument();
  });

  it('sets eager loading for priority images', () => {
    const Wrapper = createTestWrapper();
    render(<FilmPoster film={mockFilm} priority />, { wrapper: Wrapper });

    const img = screen.getByAltText('Test Movie');
    expect(img).toHaveAttribute('loading', 'eager');
  });

  it('sets lazy loading for non-priority images', () => {
    const Wrapper = createTestWrapper();
    render(<FilmPoster film={mockFilm} priority={false} />, { wrapper: Wrapper });

    const img = screen.getByAltText('Test Movie');
    expect(img).toHaveAttribute('loading', 'lazy');
  });

  it('handles missing release date gracefully', () => {
    const Wrapper = createTestWrapper();
    const filmWithoutDate = createMockFilm({ release_date: '' });

    render(<FilmPoster film={filmWithoutDate} />, { wrapper: Wrapper });

    expect(screen.getByText(filmWithoutDate.title)).toBeInTheDocument();
    expect(screen.queryByText('2024')).not.toBeInTheDocument();
  });
});

describe('FilmPosterCompact', () => {
  it('renders without title', () => {
    const Wrapper = createTestWrapper();
    render(<FilmPosterCompact film={mockFilm} />, { wrapper: Wrapper });

    expect(screen.queryByText('Test Movie')).not.toBeInTheDocument();
    expect(screen.getByAltText('Test Movie')).toBeInTheDocument();
  });
});

describe('FilmPosterLarge', () => {
  it('renders with large poster size', () => {
    const Wrapper = createTestWrapper();
    render(<FilmPosterLarge film={mockFilm} />, { wrapper: Wrapper });

    const img = screen.getByAltText('Test Movie');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', expect.stringContaining('w500'));
  });

  it('handles missing release date gracefully', () => {
    const Wrapper = createTestWrapper();
    const filmWithoutDate = createMockFilm({ release_date: '' });

    render(<FilmPosterLarge film={filmWithoutDate} />, { wrapper: Wrapper });

    expect(screen.getByAltText(filmWithoutDate.title)).toBeInTheDocument();
  });

  it('renders year and rating on hover overlay', () => {
    const Wrapper = createTestWrapper();
    render(<FilmPosterLarge film={mockFilm} />, { wrapper: Wrapper });

    expect(screen.getByText('2024')).toBeInTheDocument();
  });

  it('does not show rating when vote_average is 0', () => {
    const Wrapper = createTestWrapper();
    const filmNoRating = createMockFilm({ vote_average: 0 });

    const { container } = render(<FilmPosterLarge film={filmNoRating} />, { wrapper: Wrapper });

    // Should not show the rating span with fill-current
    expect(container.querySelector('.fill-current')).not.toBeInTheDocument();
  });
});
