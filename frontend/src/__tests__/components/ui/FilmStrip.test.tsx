/**
 * FilmStrip Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { createTestWrapper, createMockFilmList } from '@/__tests__/test-utils';
import { FilmStrip, FilmStripMini } from '@/components/ui/FilmStrip';

// Mock TMDb API
vi.mock('@/lib/api/tmdb', async () => {
  const actual = await vi.importActual('@/lib/api/tmdb');
  return {
    ...actual,
    getPopular: vi.fn().mockResolvedValue({
      results: [
        { id: 1, title: 'Movie 1', poster_path: '/poster1.jpg' },
        { id: 2, title: 'Movie 2', poster_path: '/poster2.jpg' },
      ],
    }),
  };
});

// Mock films using shared utility
const mockFilms = createMockFilmList(3);

describe('FilmStrip', () => {
  describe('with provided films', () => {
    it('renders provided films', () => {
      const Wrapper = createTestWrapper();
      const { container } = render(
        <Wrapper>
          <FilmStrip films={mockFilms} />
        </Wrapper>
      );

      const images = container.querySelectorAll('img');
      expect(images.length).toBeGreaterThan(0);
    });

    it('respects count prop', () => {
      const Wrapper = createTestWrapper();
      const { container } = render(
        <Wrapper>
          <FilmStrip films={mockFilms} count={2} />
        </Wrapper>
      );

      const images = container.querySelectorAll('img');
      expect(images.length).toBe(2);
    });

    it('renders with overlay by default', () => {
      const Wrapper = createTestWrapper();
      const { container } = render(
        <Wrapper>
          <FilmStrip films={mockFilms} />
        </Wrapper>
      );

      expect(container.querySelector('.bg-gradient-to-b')).toBeInTheDocument();
    });

    it('can hide overlay', () => {
      const Wrapper = createTestWrapper();
      const { container } = render(
        <Wrapper>
          <FilmStrip films={mockFilms} overlay={false} />
        </Wrapper>
      );

      expect(container.querySelector('.bg-gradient-to-b')).not.toBeInTheDocument();
    });
  });

  describe('heights', () => {
    it('applies small height', () => {
      const Wrapper = createTestWrapper();
      const { container } = render(
        <Wrapper>
          <FilmStrip films={mockFilms} height="sm" />
        </Wrapper>
      );

      expect(container.querySelector('.h-24')).toBeInTheDocument();
    });

    it('applies medium height', () => {
      const Wrapper = createTestWrapper();
      const { container } = render(
        <Wrapper>
          <FilmStrip films={mockFilms} height="md" />
        </Wrapper>
      );

      expect(container.querySelector('.h-36')).toBeInTheDocument();
    });

    it('applies large height', () => {
      const Wrapper = createTestWrapper();
      const { container } = render(
        <Wrapper>
          <FilmStrip films={mockFilms} height="lg" />
        </Wrapper>
      );

      expect(container.querySelector('.h-48')).toBeInTheDocument();
    });
  });

  describe('film strip perforations', () => {
    it('renders perforation elements', () => {
      const Wrapper = createTestWrapper();
      const { container } = render(
        <Wrapper>
          <FilmStrip films={mockFilms} />
        </Wrapper>
      );

      // Should have top and bottom perforation bars
      const perforations = container.querySelectorAll('.rounded-sm');
      expect(perforations.length).toBeGreaterThan(0);
    });
  });

  describe('empty state', () => {
    it('renders placeholder when no films', () => {
      const Wrapper = createTestWrapper();
      const { container } = render(
        <Wrapper>
          <FilmStrip films={[]} />
        </Wrapper>
      );

      expect(container.querySelector('.bg-bg-secondary')).toBeInTheDocument();
    });

    it('uses providedFilms over popularData when both exist', () => {
      const Wrapper = createTestWrapper();
      const { container } = render(
        <Wrapper>
          <FilmStrip films={mockFilms} />
        </Wrapper>
      );

      // Should use the provided films
      const images = container.querySelectorAll('img');
      expect(images.length).toBe(3);
    });
  });

  describe('custom className', () => {
    it('applies custom className', () => {
      const Wrapper = createTestWrapper();
      const { container } = render(
        <Wrapper>
          <FilmStrip films={mockFilms} className="custom-class" />
        </Wrapper>
      );

      expect(container.querySelector('.custom-class')).toBeInTheDocument();
    });
  });
});

describe('FilmStripMini', () => {
  it('renders with small height', () => {
    const Wrapper = createTestWrapper();
    const { container } = render(
      <Wrapper>
        <FilmStripMini films={mockFilms} />
      </Wrapper>
    );

    expect(container.querySelector('.h-24')).toBeInTheDocument();
  });

  it('shows 12 films by default', () => {
    const Wrapper = createTestWrapper();
    const { container } = render(
      <Wrapper>
        <FilmStripMini films={mockFilms} />
      </Wrapper>
    );

    // Will only show 3 since we only provided 3
    const images = container.querySelectorAll('img');
    expect(images.length).toBe(3);
  });
});
