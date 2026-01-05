/**
 * FilmCard Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createTestWrapper, mockFilm, createMockFilm } from '@/__tests__/test-utils';

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

import { FilmActivityCard, FilmRow } from '@/components/features/FilmCard';

describe('FilmActivityCard', () => {
  describe('rendering', () => {
    it('renders film title', () => {
      const Wrapper = createTestWrapper();
      render(<FilmActivityCard film={mockFilm} activity="watched" />, { wrapper: Wrapper });
      expect(screen.getByText('Test Movie')).toBeInTheDocument();
    });

    it('renders release year', () => {
      const Wrapper = createTestWrapper();
      render(<FilmActivityCard film={mockFilm} activity="watched" />, { wrapper: Wrapper });
      expect(screen.getByText('2024')).toBeInTheDocument();
    });

    it('renders poster image', () => {
      const Wrapper = createTestWrapper();
      render(<FilmActivityCard film={mockFilm} activity="watched" />, { wrapper: Wrapper });
      const img = screen.getByAltText('Test Movie');
      expect(img).toBeInTheDocument();
    });
  });

  describe('activity types', () => {
    it('shows watched activity icon', () => {
      const Wrapper = createTestWrapper();
      const { container } = render(
        <FilmActivityCard film={mockFilm} activity="watched" user={{ name: 'Test' }} />,
        { wrapper: Wrapper }
      );
      expect(container.querySelector('.text-letterboxd-green')).toBeInTheDocument();
    });

    it('shows liked activity icon', () => {
      const Wrapper = createTestWrapper();
      const { container } = render(
        <FilmActivityCard film={mockFilm} activity="liked" user={{ name: 'Test' }} />,
        { wrapper: Wrapper }
      );
      expect(container.querySelector('.text-letterboxd-orange')).toBeInTheDocument();
    });

    it('shows reviewed activity icon', () => {
      const Wrapper = createTestWrapper();
      const { container } = render(
        <FilmActivityCard film={mockFilm} activity="reviewed" user={{ name: 'Test' }} />,
        { wrapper: Wrapper }
      );
      expect(container.querySelector('.text-letterboxd-blue')).toBeInTheDocument();
    });
  });

  describe('user info', () => {
    it('renders user name when provided', () => {
      const Wrapper = createTestWrapper();
      render(<FilmActivityCard film={mockFilm} activity="watched" user={{ name: 'John Doe' }} />, {
        wrapper: Wrapper,
      });
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('shows user initial when no avatar', () => {
      const Wrapper = createTestWrapper();
      render(<FilmActivityCard film={mockFilm} activity="watched" user={{ name: 'John Doe' }} />, {
        wrapper: Wrapper,
      });
      expect(screen.getByText('J')).toBeInTheDocument();
    });

    it('shows avatar image when provided', () => {
      const Wrapper = createTestWrapper();
      const { container } = render(
        <FilmActivityCard
          film={mockFilm}
          activity="watched"
          user={{ name: 'John Doe', avatar: 'https://example.com/avatar.jpg' }}
        />,
        { wrapper: Wrapper }
      );

      const avatarImg = container.querySelector('img[src="https://example.com/avatar.jpg"]');
      expect(avatarImg).toBeInTheDocument();
    });

    it('shows user initial fallback for empty name', () => {
      const Wrapper = createTestWrapper();
      render(<FilmActivityCard film={mockFilm} activity="watched" user={{ name: '' }} />, {
        wrapper: Wrapper,
      });
      // Should show 'U' as fallback when name is empty
      expect(screen.getByText('U')).toBeInTheDocument();
    });
  });

  describe('rating', () => {
    it('renders rating when provided', () => {
      const Wrapper = createTestWrapper();
      const { container } = render(
        <FilmActivityCard film={mockFilm} activity="reviewed" rating={4} />,
        { wrapper: Wrapper }
      );
      expect(container.querySelector('.fill-letterboxd-green')).toBeInTheDocument();
    });
  });

  describe('review text', () => {
    it('renders review text when provided', () => {
      const Wrapper = createTestWrapper();
      render(
        <FilmActivityCard
          film={mockFilm}
          activity="reviewed"
          reviewText="This was an amazing movie!"
        />,
        { wrapper: Wrapper }
      );
      expect(screen.getByText('This was an amazing movie!')).toBeInTheDocument();
    });
  });

  describe('date', () => {
    it('renders date when provided', () => {
      const Wrapper = createTestWrapper();
      render(<FilmActivityCard film={mockFilm} activity="watched" date="January 15, 2024" />, {
        wrapper: Wrapper,
      });
      expect(screen.getByText('January 15, 2024')).toBeInTheDocument();
    });
  });

  describe('compact mode', () => {
    it('renders compact version', () => {
      const Wrapper = createTestWrapper();
      const { container } = render(
        <FilmActivityCard film={mockFilm} activity="watched" compact />,
        { wrapper: Wrapper }
      );
      expect(container.querySelector('.rounded-lg')).toBeInTheDocument();
    });

    it('shows smaller poster in compact mode', () => {
      const Wrapper = createTestWrapper();
      const { container } = render(
        <FilmActivityCard film={mockFilm} activity="watched" compact />,
        { wrapper: Wrapper }
      );
      expect(container.querySelector('.w-12')).toBeInTheDocument();
    });

    it('renders rating in compact mode when provided', () => {
      const Wrapper = createTestWrapper();
      const { container } = render(
        <FilmActivityCard film={mockFilm} activity="watched" compact rating={4} />,
        { wrapper: Wrapper }
      );
      expect(container.querySelector('.fill-letterboxd-green')).toBeInTheDocument();
    });

    it('does not render rating in compact mode when not provided', () => {
      const Wrapper = createTestWrapper();
      const { container } = render(
        <FilmActivityCard film={mockFilm} activity="watched" compact />,
        { wrapper: Wrapper }
      );
      // Should not have filled stars when no rating
      expect(container.querySelectorAll('.fill-letterboxd-green').length).toBe(0);
    });
  });

  describe('edge cases', () => {
    it('handles missing release date', () => {
      const Wrapper = createTestWrapper();
      const filmNoDate = createMockFilm({ release_date: '' });
      render(<FilmActivityCard film={filmNoDate} activity="watched" />, { wrapper: Wrapper });

      expect(screen.getByText(filmNoDate.title)).toBeInTheDocument();
    });

    it('renders logged activity type', () => {
      const Wrapper = createTestWrapper();
      const { container } = render(
        <FilmActivityCard film={mockFilm} activity="logged" user={{ name: 'Test' }} />,
        { wrapper: Wrapper }
      );
      expect(container.querySelector('.text-text-secondary')).toBeInTheDocument();
    });
  });
});

describe('FilmRow', () => {
  const mockFilms = [
    mockFilm,
    createMockFilm({ id: 456, title: 'Another Movie' }),
    createMockFilm({ id: 789, title: 'Third Movie' }),
  ];

  it('renders all films', () => {
    const Wrapper = createTestWrapper();
    render(<FilmRow films={mockFilms} />, { wrapper: Wrapper });

    expect(screen.getByAltText('Test Movie')).toBeInTheDocument();
    expect(screen.getByAltText('Another Movie')).toBeInTheDocument();
    expect(screen.getByAltText('Third Movie')).toBeInTheDocument();
  });

  it('has horizontal scroll container', () => {
    const Wrapper = createTestWrapper();
    const { container } = render(<FilmRow films={mockFilms} />, { wrapper: Wrapper });
    expect(container.querySelector('.overflow-x-auto')).toBeInTheDocument();
  });

  it('can show ratings when enabled', () => {
    const Wrapper = createTestWrapper();
    const { container } = render(<FilmRow films={mockFilms} showRating />, { wrapper: Wrapper });
    expect(container.querySelectorAll('.fill-letterboxd-green').length).toBeGreaterThan(0);
  });

  it('applies custom className', () => {
    const Wrapper = createTestWrapper();
    const { container } = render(<FilmRow films={mockFilms} className="custom-class" />, {
      wrapper: Wrapper,
    });
    expect(container.querySelector('.custom-class')).toBeInTheDocument();
  });
});
