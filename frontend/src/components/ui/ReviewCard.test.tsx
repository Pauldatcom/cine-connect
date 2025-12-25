/**
 * ReviewCard Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { createTestWrapper, mockFilm, mockUser } from '@/test/test-utils';

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

import { ReviewCard, ReviewList } from './ReviewCard';

const defaultReviewProps = {
  film: mockFilm,
  user: { id: mockUser.id, name: mockUser.name },
  content: 'This was a fantastic movie!',
  reviewDate: 'January 15, 2024',
};

describe('ReviewCard', () => {
  describe('rendering', () => {
    it('renders user name', () => {
      const Wrapper = createTestWrapper();
      render(<ReviewCard {...defaultReviewProps} />, { wrapper: Wrapper });
      expect(screen.getByText(mockUser.name)).toBeInTheDocument();
    });

    it('renders review content', () => {
      const Wrapper = createTestWrapper();
      render(<ReviewCard {...defaultReviewProps} />, { wrapper: Wrapper });
      expect(screen.getByText('This was a fantastic movie!')).toBeInTheDocument();
    });

    it('renders review date', () => {
      const Wrapper = createTestWrapper();
      render(<ReviewCard {...defaultReviewProps} />, { wrapper: Wrapper });
      expect(screen.getByText('January 15, 2024')).toBeInTheDocument();
    });

    it('renders film title when showFilm is true', () => {
      const Wrapper = createTestWrapper();
      render(<ReviewCard {...defaultReviewProps} showFilm />, { wrapper: Wrapper });
      expect(screen.getByText('Test Movie')).toBeInTheDocument();
    });
  });

  describe('rating', () => {
    it('renders rating stars when provided', () => {
      const Wrapper = createTestWrapper();
      const { container } = render(<ReviewCard {...defaultReviewProps} rating={4} />, {
        wrapper: Wrapper,
      });
      expect(container.querySelectorAll('.fill-letterboxd-green').length).toBeGreaterThan(0);
    });

    it('does not render rating when not provided', () => {
      const Wrapper = createTestWrapper();
      const { container } = render(<ReviewCard {...defaultReviewProps} />, { wrapper: Wrapper });
      expect(container.querySelectorAll('.fill-letterboxd-green').length).toBe(0);
    });
  });

  describe('spoilers', () => {
    it('blurs content when hasSpoilers is true', () => {
      const Wrapper = createTestWrapper();
      const { container } = render(<ReviewCard {...defaultReviewProps} hasSpoilers />, {
        wrapper: Wrapper,
      });
      expect(container.querySelector('.blur-md')).toBeInTheDocument();
    });

    it('shows spoiler warning', () => {
      const Wrapper = createTestWrapper();
      render(<ReviewCard {...defaultReviewProps} hasSpoilers />, { wrapper: Wrapper });
      expect(screen.getByText('This review contains spoilers')).toBeInTheDocument();
    });

    it('reveals content when button clicked', () => {
      const Wrapper = createTestWrapper();
      render(<ReviewCard {...defaultReviewProps} hasSpoilers />, { wrapper: Wrapper });

      const revealButton = screen.getByText('Reveal Spoilers');
      fireEvent.click(revealButton);

      expect(screen.queryByText('This review contains spoilers')).not.toBeInTheDocument();
    });
  });

  describe('watched date', () => {
    it('renders watched date when provided', () => {
      const Wrapper = createTestWrapper();
      render(<ReviewCard {...defaultReviewProps} watchedDate="December 25, 2023" />, {
        wrapper: Wrapper,
      });
      expect(screen.getByText(/Watched December 25, 2023/)).toBeInTheDocument();
    });
  });

  describe('likes', () => {
    it('renders like count', () => {
      const Wrapper = createTestWrapper();
      render(<ReviewCard {...defaultReviewProps} likes={42} />, { wrapper: Wrapper });
      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('toggles like on click', () => {
      const Wrapper = createTestWrapper();
      render(<ReviewCard {...defaultReviewProps} likes={10} />, { wrapper: Wrapper });

      const likeButton = screen.getByText('10').closest('button');
      fireEvent.click(likeButton!);

      expect(screen.getByText('11')).toBeInTheDocument();
    });

    it('shows filled heart when liked', () => {
      const Wrapper = createTestWrapper();
      const { container } = render(<ReviewCard {...defaultReviewProps} likes={10} isLiked />, {
        wrapper: Wrapper,
      });
      expect(container.querySelector('.fill-current')).toBeInTheDocument();
    });

    it('unlikes when clicking on already liked review', () => {
      const Wrapper = createTestWrapper();
      render(<ReviewCard {...defaultReviewProps} likes={10} isLiked />, { wrapper: Wrapper });

      const likeButton = screen.getByText('10').closest('button');
      fireEvent.click(likeButton!);

      expect(screen.getByText('9')).toBeInTheDocument();
    });

    it('does not show count when likes is 0', () => {
      const Wrapper = createTestWrapper();
      render(<ReviewCard {...defaultReviewProps} likes={0} />, { wrapper: Wrapper });

      // Should not render '0' next to heart
      expect(screen.queryByText('0')).not.toBeInTheDocument();
    });
  });

  describe('comments', () => {
    it('renders comment count', () => {
      const Wrapper = createTestWrapper();
      render(<ReviewCard {...defaultReviewProps} comments={5} />, { wrapper: Wrapper });
      expect(screen.getByText('5')).toBeInTheDocument();
    });
  });

  describe('compact mode', () => {
    it('renders compact version', () => {
      const Wrapper = createTestWrapper();
      const { container } = render(<ReviewCard {...defaultReviewProps} compact />, {
        wrapper: Wrapper,
      });
      expect(container.querySelector('.h-8')).toBeInTheDocument();
    });

    it('shows abbreviated content in compact mode', () => {
      const Wrapper = createTestWrapper();
      const { container } = render(<ReviewCard {...defaultReviewProps} compact />, {
        wrapper: Wrapper,
      });
      expect(container.querySelector('.line-clamp-2')).toBeInTheDocument();
    });

    it('shows spoiler button in compact mode when has spoilers', () => {
      const Wrapper = createTestWrapper();
      render(<ReviewCard {...defaultReviewProps} hasSpoilers compact />, { wrapper: Wrapper });
      expect(screen.getByText('Show spoilers')).toBeInTheDocument();
    });

    it('shows avatar image in compact mode when provided', () => {
      const Wrapper = createTestWrapper();
      const { container } = render(
        <ReviewCard
          {...defaultReviewProps}
          compact
          user={{ ...defaultReviewProps.user, avatar: 'https://example.com/compact-avatar.jpg' }}
        />,
        { wrapper: Wrapper }
      );

      const avatarImg = container.querySelector(
        'img[src="https://example.com/compact-avatar.jpg"]'
      );
      expect(avatarImg).toBeInTheDocument();
    });

    it('reveals spoilers in compact mode when button clicked', () => {
      const Wrapper = createTestWrapper();
      const { container } = render(<ReviewCard {...defaultReviewProps} hasSpoilers compact />, {
        wrapper: Wrapper,
      });

      const spoilerButton = screen.getByText('Show spoilers');
      fireEvent.click(spoilerButton);

      // After clicking, the blur should be removed
      expect(container.querySelector('.blur-sm')).not.toBeInTheDocument();
    });

    it('does not show rating in compact mode when not provided', () => {
      const Wrapper = createTestWrapper();
      const { container } = render(<ReviewCard {...defaultReviewProps} compact />, {
        wrapper: Wrapper,
      });

      // Should not have rating stars
      expect(container.querySelector('.fill-letterboxd-green')).not.toBeInTheDocument();
    });

    it('shows rating in compact mode when provided', () => {
      const Wrapper = createTestWrapper();
      const { container } = render(<ReviewCard {...defaultReviewProps} compact rating={4} />, {
        wrapper: Wrapper,
      });

      // Should have rating stars
      expect(container.querySelector('.fill-letterboxd-green')).toBeInTheDocument();
    });
  });

  describe('user avatar', () => {
    it('shows user initial when no avatar', () => {
      const Wrapper = createTestWrapper();
      render(<ReviewCard {...defaultReviewProps} />, { wrapper: Wrapper });
      expect(screen.getByText('T')).toBeInTheDocument();
    });

    it('shows avatar image when provided', () => {
      const Wrapper = createTestWrapper();
      const { container } = render(
        <ReviewCard
          {...defaultReviewProps}
          user={{ ...defaultReviewProps.user, avatar: 'https://example.com/avatar.jpg' }}
        />,
        { wrapper: Wrapper }
      );

      const avatar = container.querySelector('img[src="https://example.com/avatar.jpg"]');
      expect(avatar).toBeInTheDocument();
    });
  });
});

describe('ReviewList', () => {
  it('renders multiple reviews', () => {
    const Wrapper = createTestWrapper();
    const reviews = [
      { ...defaultReviewProps, user: { id: '1', name: 'User 1' } },
      { ...defaultReviewProps, user: { id: '2', name: 'User 2' } },
      { ...defaultReviewProps, user: { id: '3', name: 'User 3' } },
    ];

    render(<ReviewList reviews={reviews} />, { wrapper: Wrapper });

    expect(screen.getByText('User 1')).toBeInTheDocument();
    expect(screen.getByText('User 2')).toBeInTheDocument();
    expect(screen.getByText('User 3')).toBeInTheDocument();
  });

  it('has proper spacing between reviews', () => {
    const Wrapper = createTestWrapper();
    const reviews = [
      { ...defaultReviewProps, user: { id: '1', name: 'User 1' } },
      { ...defaultReviewProps, user: { id: '2', name: 'User 2' } },
    ];

    const { container } = render(<ReviewList reviews={reviews} />, { wrapper: Wrapper });
    expect(container.querySelector('.space-y-4')).toBeInTheDocument();
  });
});
