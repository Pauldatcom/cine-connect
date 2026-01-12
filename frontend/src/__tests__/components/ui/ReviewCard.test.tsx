/**
 * ReviewCard (UI) Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ReviewCard, ReviewList } from '@/components/ui/ReviewCard';
import { mockFilm } from '@/__tests__/test-utils';

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

describe('ReviewCard', () => {
  const defaultUser = {
    id: 'user-1',
    name: 'John Doe',
    avatar: undefined,
  };

  const defaultProps = {
    id: 'review-1',
    user: defaultUser,
    content: 'This is a great movie!',
    reviewDate: 'Jan 15, 2024',
  };

  describe('full mode (default)', () => {
    it('renders user name', () => {
      render(<ReviewCard {...defaultProps} />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('renders user initial when no avatar', () => {
      render(<ReviewCard {...defaultProps} />);

      expect(screen.getByText('J')).toBeInTheDocument();
    });

    it('renders user avatar when provided', () => {
      const userWithAvatar = {
        ...defaultUser,
        avatar: 'https://example.com/avatar.jpg',
      };

      const { container } = render(<ReviewCard {...defaultProps} user={userWithAvatar} />);

      // Find avatar by src attribute
      const avatar = container.querySelector('img[src="https://example.com/avatar.jpg"]');
      expect(avatar).toBeInTheDocument();
    });

    it('renders review content', () => {
      render(<ReviewCard {...defaultProps} />);

      expect(screen.getByText('This is a great movie!')).toBeInTheDocument();
    });

    it('renders review date', () => {
      render(<ReviewCard {...defaultProps} />);

      expect(screen.getByText('Jan 15, 2024')).toBeInTheDocument();
    });

    it('renders rating when provided', () => {
      render(<ReviewCard {...defaultProps} rating={8} />);

      expect(screen.getByTestId('star-rating-display')).toBeInTheDocument();
    });

    it('renders like count when > 0', () => {
      render(<ReviewCard {...defaultProps} likes={42} />);

      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('renders comment count when > 0', () => {
      render(<ReviewCard {...defaultProps} comments={10} />);

      expect(screen.getByText('10')).toBeInTheDocument();
    });

    it('renders watched date when provided', () => {
      render(<ReviewCard {...defaultProps} watchedDate="Jan 10, 2024" />);

      expect(screen.getByText(/Watched Jan 10, 2024/)).toBeInTheDocument();
    });
  });

  describe('film display', () => {
    it('renders film poster when showFilm is true', () => {
      render(<ReviewCard {...defaultProps} film={mockFilm} showFilm />);

      expect(screen.getByRole('img', { name: mockFilm.title })).toBeInTheDocument();
    });

    it('renders film title when showFilm is true', () => {
      render(<ReviewCard {...defaultProps} film={mockFilm} showFilm />);

      expect(screen.getByText(mockFilm.title)).toBeInTheDocument();
    });

    it('renders film year when showFilm is true', () => {
      render(<ReviewCard {...defaultProps} film={mockFilm} showFilm />);

      expect(screen.getByText('2024')).toBeInTheDocument();
    });

    it('does not render film info when showFilm is false', () => {
      render(<ReviewCard {...defaultProps} film={mockFilm} showFilm={false} />);

      expect(screen.queryByRole('img', { name: mockFilm.title })).not.toBeInTheDocument();
    });
  });

  describe('like functionality', () => {
    it('calls onLike callback when clicking like button', () => {
      const onLike = vi.fn();
      const { container } = render(<ReviewCard {...defaultProps} onLike={onLike} />);

      // Find like button by the Heart icon in the footer
      const footerButtons = container.querySelectorAll('.border-t button');
      const likeButton = footerButtons[0];
      expect(likeButton).toBeInTheDocument();

      fireEvent.click(likeButton!);

      expect(onLike).toHaveBeenCalledWith('review-1');
    });

    it('updates like count optimistically when liking', () => {
      const { container } = render(<ReviewCard {...defaultProps} likes={5} />);

      // Find like button in footer
      const footerButtons = container.querySelectorAll('.border-t button');
      const likeButton = footerButtons[0];

      fireEvent.click(likeButton!);

      // Should increment to 6
      expect(screen.getByText('6')).toBeInTheDocument();
    });

    it('shows filled heart when liked', () => {
      const { container } = render(<ReviewCard {...defaultProps} isLiked />);

      // Heart should have fill-current class
      expect(container.querySelector('.fill-current')).toBeInTheDocument();
    });

    it('decrements like count when unliking', () => {
      const { container } = render(<ReviewCard {...defaultProps} likes={5} isLiked />);

      // Find like button in footer
      const footerButtons = container.querySelectorAll('.border-t button');
      fireEvent.click(footerButtons[0]!);

      expect(screen.getByText('4')).toBeInTheDocument();
    });
  });

  describe('spoiler handling', () => {
    it('blurs content when hasSpoilers is true', () => {
      const { container } = render(<ReviewCard {...defaultProps} hasSpoilers />);

      expect(container.querySelector('.blur-md')).toBeInTheDocument();
    });

    it('shows reveal button when hasSpoilers is true', () => {
      render(<ReviewCard {...defaultProps} hasSpoilers />);

      expect(screen.getByText('Reveal Spoilers')).toBeInTheDocument();
    });

    it('reveals content when clicking reveal button', () => {
      const { container } = render(<ReviewCard {...defaultProps} hasSpoilers />);

      const revealButton = screen.getByText('Reveal Spoilers');
      fireEvent.click(revealButton);

      expect(container.querySelector('.blur-md')).not.toBeInTheDocument();
    });

    it('shows spoiler warning message', () => {
      render(<ReviewCard {...defaultProps} hasSpoilers />);

      expect(screen.getByText('This review contains spoilers')).toBeInTheDocument();
    });
  });

  describe('compact mode', () => {
    it('renders compact layout', () => {
      render(<ReviewCard {...defaultProps} compact />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('This is a great movie!')).toBeInTheDocument();
    });

    it('renders rating in compact mode', () => {
      render(<ReviewCard {...defaultProps} rating={7} compact />);

      expect(screen.getByTestId('star-rating-display')).toBeInTheDocument();
    });

    it('blurs spoiler content in compact mode', () => {
      const { container } = render(<ReviewCard {...defaultProps} hasSpoilers compact />);

      expect(container.querySelector('.blur-sm')).toBeInTheDocument();
    });

    it('shows reveal button in compact mode', () => {
      render(<ReviewCard {...defaultProps} hasSpoilers compact />);

      expect(screen.getByText('Show spoilers')).toBeInTheDocument();
    });

    it('reveals spoilers in compact mode when clicking', () => {
      const { container } = render(<ReviewCard {...defaultProps} hasSpoilers compact />);

      const revealButton = screen.getByText('Show spoilers');
      fireEvent.click(revealButton);

      expect(container.querySelector('.blur-sm')).not.toBeInTheDocument();
    });
  });
});

describe('ReviewList', () => {
  const reviews = [
    {
      id: 'review-1',
      user: { id: 'user-1', name: 'Alice' },
      content: 'Great movie!',
      reviewDate: 'Jan 1, 2024',
    },
    {
      id: 'review-2',
      user: { id: 'user-2', name: 'Bob' },
      content: 'Loved it!',
      reviewDate: 'Jan 2, 2024',
    },
    {
      id: 'review-3',
      user: { id: 'user-3', name: 'Charlie' },
      content: 'Amazing!',
      reviewDate: 'Jan 3, 2024',
    },
  ];

  it('renders all reviews', () => {
    render(<ReviewList reviews={reviews} />);

    expect(screen.getByText('Great movie!')).toBeInTheDocument();
    expect(screen.getByText('Loved it!')).toBeInTheDocument();
    expect(screen.getByText('Amazing!')).toBeInTheDocument();
  });

  it('renders user names', () => {
    render(<ReviewList reviews={reviews} />);

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Charlie')).toBeInTheDocument();
  });

  it('renders empty list when no reviews', () => {
    const { container } = render(<ReviewList reviews={[]} />);

    expect(container.querySelector('.space-y-4')).toBeInTheDocument();
  });
});
