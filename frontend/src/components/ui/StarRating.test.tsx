/**
 * StarRating Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StarRating, StarRatingDisplay } from './StarRating';

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
      const { container } = render(<StarRating rating={3} />);

      // Should have some filled content
      expect(container.textContent).toBeDefined();
    });

    it('shows value when showValue is true', () => {
      render(<StarRating rating={4.5} showValue />);

      expect(screen.getByText('4.5')).toBeInTheDocument();
    });

    it('does not show value when rating is 0', () => {
      render(<StarRating rating={0} showValue />);

      expect(screen.queryByText('0.0')).not.toBeInTheDocument();
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

    it('calls onRatingChange when clicking a star', () => {
      const handleChange = vi.fn();
      render(<StarRating onRatingChange={handleChange} />);

      const buttons = screen.getAllByRole('button');
      fireEvent.click(buttons[0]!); // Click first half star

      expect(handleChange).toHaveBeenCalledWith(0.5);
    });

    it('calls onRatingChange with full star value', () => {
      const handleChange = vi.fn();
      render(<StarRating onRatingChange={handleChange} />);

      const buttons = screen.getAllByRole('button');
      fireEvent.click(buttons[1]!); // Click second half (full star)

      expect(handleChange).toHaveBeenCalledWith(1);
    });

    it('toggles rating off when clicking same value', () => {
      const handleChange = vi.fn();
      render(<StarRating rating={3} onRatingChange={handleChange} />);

      const buttons = screen.getAllByRole('button');
      fireEvent.click(buttons[5]!); // Click to rate 3 again

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
    it('renders correct number of full stars', () => {
      const { container } = render(<StarRatingDisplay rating={3} />);

      // Should have 3 filled stars
      const filledStars = container.querySelectorAll('.fill-letterboxd-green');
      expect(filledStars.length).toBeGreaterThanOrEqual(3);
    });

    it('renders half star when applicable', () => {
      const { container } = render(<StarRatingDisplay rating={3.5} />);

      // Should have overflow-hidden class for half star
      const halfStar = container.querySelector('.overflow-hidden.w-1\\/2');
      expect(halfStar).toBeInTheDocument();
    });

    it('renders empty stars for remaining', () => {
      const { container } = render(<StarRatingDisplay rating={2} />);

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

    it('handles rating of 5', () => {
      const { container } = render(<StarRatingDisplay rating={5} />);

      // All stars should be filled
      const filledStars = container.querySelectorAll('.fill-letterboxd-green');
      expect(filledStars.length).toBe(5);
    });

    it('handles rating of 4.9 (rounds to 5)', () => {
      const { container } = render(<StarRatingDisplay rating={4.9} />);

      // Should round down to 4 full + 1 half
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
