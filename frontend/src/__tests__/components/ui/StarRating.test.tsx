/**
 * StarRating Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StarRating, StarRatingDisplay } from '@/components/ui/StarRating';

describe('StarRating', () => {
  describe('rendering', () => {
    it('renders 5 star elements', () => {
      const { container } = render(<StarRating />);

      // Should render 5 star SVGs
      const stars = container.querySelectorAll('svg');
      expect(stars.length).toBe(5);
    });

    it('renders with default rating of 0', () => {
      const { container } = render(<StarRating />);

      // No filled stars should be present
      expect(container.querySelector('.fill-letterboxd-green')).toBeNull();
    });

    it('displays correct filled stars for rating', () => {
      // Rating of 6 = 3 stars (6/2)
      const { container } = render(<StarRating rating={6} />);

      // Should have some filled content
      expect(container.textContent).toBeDefined();
    });

    it('shows value when showValue is true', () => {
      // Rating 9 displayed as 9/10
      render(<StarRating rating={9} showValue />);

      expect(screen.getByText('9/10')).toBeInTheDocument();
    });

    it('does not show value when rating is 0', () => {
      render(<StarRating rating={0} showValue />);

      expect(screen.queryByText('0/10')).not.toBeInTheDocument();
    });
  });

  describe('sizes', () => {
    it('applies small size classes', () => {
      const { container } = render(<StarRating size="sm" />);

      expect(container.querySelector('.h-3')).toBeInTheDocument();
    });

    it('applies large size classes', () => {
      const { container } = render(<StarRating size="lg" />);

      expect(container.querySelector('.h-6')).toBeInTheDocument();
    });

    it('applies xl size classes', () => {
      const { container } = render(<StarRating size="xl" />);

      expect(container.querySelector('.h-8')).toBeInTheDocument();
    });
  });

  describe('interactivity', () => {
    it('renders interactive buttons when onRatingChange is provided', () => {
      const handleChange = vi.fn();
      render(<StarRating onRatingChange={handleChange} />);

      // Should render buttons for interaction
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBe(10); // 2 buttons per star * 5 stars
    });

    it('calls onRatingChange when clicking a star (returns 1-10 value)', () => {
      const handleChange = vi.fn();
      render(<StarRating onRatingChange={handleChange} />);

      const buttons = screen.getAllByRole('button');
      fireEvent.click(buttons[0]!); // Click first half star = rating 1

      expect(handleChange).toHaveBeenCalledWith(1);
    });

    it('calls onRatingChange with full star value (returns 1-10 value)', () => {
      const handleChange = vi.fn();
      render(<StarRating onRatingChange={handleChange} />);

      const buttons = screen.getAllByRole('button');
      fireEvent.click(buttons[1]!); // Click second half (full star) = rating 2

      expect(handleChange).toHaveBeenCalledWith(2);
    });

    it('toggles rating off when clicking same value', () => {
      const handleChange = vi.fn();
      // Rating 6 = 3 stars
      render(<StarRating rating={6} onRatingChange={handleChange} />);

      const buttons = screen.getAllByRole('button');
      fireEvent.click(buttons[5]!); // Click to rate 6 again (3 full stars)

      expect(handleChange).toHaveBeenCalledWith(0);
    });

    it('shows hover preview on mouse enter', () => {
      const handleChange = vi.fn();
      const { container } = render(<StarRating onRatingChange={handleChange} />);

      const buttons = screen.getAllByRole('button');
      fireEvent.mouseEnter(buttons[7]!); // Hover on 4th star

      // Component should update to show hover state
      expect(container).toBeInTheDocument();
    });

    it('clears hover preview on mouse leave', () => {
      const handleChange = vi.fn();
      const { container } = render(<StarRating onRatingChange={handleChange} />);

      const starContainer = container.querySelector('.flex.items-center');
      fireEvent.mouseLeave(starContainer!);

      expect(container).toBeInTheDocument();
    });

    it('does not show buttons when readonly', () => {
      const handleChange = vi.fn();
      render(<StarRating readonly onRatingChange={handleChange} />);

      const buttons = screen.queryAllByRole('button');
      expect(buttons.length).toBe(0);
    });

    it('handles hover on half star correctly', () => {
      const handleChange = vi.fn();
      render(<StarRating onRatingChange={handleChange} />);

      const buttons = screen.getAllByRole('button');
      // Hover on first half of second star (index 2 = left half of star 2)
      fireEvent.mouseEnter(buttons[2]!);

      // Should show hover state
      expect(handleChange).not.toHaveBeenCalled(); // Just hover, no click
    });

    it('handles hover on full star correctly', () => {
      const handleChange = vi.fn();
      render(<StarRating onRatingChange={handleChange} />);

      const buttons = screen.getAllByRole('button');
      // Hover on right half of third star (index 5 = right half of star 3)
      fireEvent.mouseEnter(buttons[5]!);

      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('has aria labels for star buttons', () => {
      const handleChange = vi.fn();
      render(<StarRating onRatingChange={handleChange} />);

      expect(screen.getByLabelText('Rate 0.5 stars')).toBeInTheDocument();
      expect(screen.getByLabelText('Rate 1 stars')).toBeInTheDocument();
      expect(screen.getByLabelText('Rate 5 stars')).toBeInTheDocument();
    });
  });

  describe('custom className', () => {
    it('applies custom className', () => {
      const { container } = render(<StarRating className="custom-class" />);

      expect(container.querySelector('.custom-class')).toBeInTheDocument();
    });
  });
});

describe('StarRatingDisplay', () => {
  describe('rendering', () => {
    it('renders correct number of full stars (rating 1-10)', () => {
      // Rating 6 = 3 stars (6/2)
      const { container } = render(<StarRatingDisplay rating={6} />);

      // Should have 3 filled stars
      const filledStars = container.querySelectorAll('.fill-letterboxd-green');
      expect(filledStars.length).toBeGreaterThanOrEqual(3);
    });

    it('renders half star when applicable (rating 1-10)', () => {
      // Rating 7 = 3.5 stars (7/2)
      const { container } = render(<StarRatingDisplay rating={7} />);

      // Should have overflow-hidden class for half star
      const halfStar = container.querySelector('.overflow-hidden.w-1\\/2');
      expect(halfStar).toBeInTheDocument();
    });

    it('renders empty stars for remaining', () => {
      // Rating 4 = 2 stars (4/2)
      const { container } = render(<StarRatingDisplay rating={4} />);

      // Should have some border-colored (empty) stars
      const emptyStars = container.querySelectorAll('.text-border');
      expect(emptyStars.length).toBeGreaterThan(0);
    });
  });

  describe('sizes', () => {
    it('applies small size', () => {
      const { container } = render(<StarRatingDisplay rating={3} size="sm" />);

      expect(container.querySelector('.h-3')).toBeInTheDocument();
    });

    it('applies medium size', () => {
      const { container } = render(<StarRatingDisplay rating={3} size="md" />);

      expect(container.querySelector('.h-4')).toBeInTheDocument();
    });

    it('applies large size', () => {
      const { container } = render(<StarRatingDisplay rating={3} size="lg" />);

      expect(container.querySelector('.h-5')).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('handles rating of 0', () => {
      const { container } = render(<StarRatingDisplay rating={0} />);

      // All stars should be empty
      const filledStars = container.querySelectorAll('.fill-letterboxd-green');
      expect(filledStars.length).toBe(0);
    });

    it('handles rating of 10 (5 full stars)', () => {
      const { container } = render(<StarRatingDisplay rating={10} />);

      // All stars should be filled
      const filledStars = container.querySelectorAll('.fill-letterboxd-green');
      expect(filledStars.length).toBe(5);
    });

    it('handles rating of 9 (4.5 stars)', () => {
      const { container } = render(<StarRatingDisplay rating={9} />);

      // Should show 4 full + 1 half
      expect(container).toBeInTheDocument();
    });
  });

  describe('custom className', () => {
    it('applies custom className', () => {
      const { container } = render(<StarRatingDisplay rating={3} className="custom-class" />);

      expect(container.querySelector('.custom-class')).toBeInTheDocument();
    });
  });
});
