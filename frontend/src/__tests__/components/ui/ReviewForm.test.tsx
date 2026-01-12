/**
 * ReviewForm (UI) Component Tests
 */

import { ReviewForm } from '@/components/ui/ReviewForm';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

// Mock StarRating
vi.mock('@/components/ui/StarRating', () => ({
  StarRating: ({
    rating,
    onRatingChange,
    showValue,
  }: {
    rating: number;
    onRatingChange?: (r: number) => void;
    showValue?: boolean;
  }) => (
    <div data-testid="star-rating">
      <span>Rating: {rating}</span>
      {showValue && <span>{rating}/10</span>}
      {onRatingChange && (
        <>
          <button onClick={() => onRatingChange(5)} data-testid="set-rating-5">
            Set 5
          </button>
          <button onClick={() => onRatingChange(8)} data-testid="set-rating-8">
            Set 8
          </button>
        </>
      )}
    </div>
  ),
}));

describe('ReviewForm', () => {
  const defaultFilm = {
    id: 'film-1',
    title: 'Test Movie',
    year: 2024,
    posterUrl: 'https://example.com/poster.jpg',
  };

  const defaultProps = {
    film: defaultFilm,
    onSubmit: vi.fn(),
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders modal with form', () => {
      render(<ReviewForm {...defaultProps} />);

      expect(screen.getByText('Write a Review')).toBeInTheDocument();
    });

    it('renders film info', () => {
      render(<ReviewForm {...defaultProps} />);

      expect(screen.getByText('Test Movie')).toBeInTheDocument();
      expect(screen.getByText('2024')).toBeInTheDocument();
    });

    it('renders film poster when provided', () => {
      render(<ReviewForm {...defaultProps} />);

      const poster = screen.getByRole('img', { name: 'Test Movie' });
      expect(poster).toHaveAttribute('src', 'https://example.com/poster.jpg');
    });

    it('renders placeholder when no poster', () => {
      const filmNoPoster = { ...defaultFilm, posterUrl: null };
      const { container } = render(<ReviewForm {...defaultProps} film={filmNoPoster} />);

      // Should render Film icon as placeholder
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('renders star rating component', () => {
      render(<ReviewForm {...defaultProps} />);

      expect(screen.getByTestId('star-rating')).toBeInTheDocument();
    });

    it('renders comment textarea', () => {
      render(<ReviewForm {...defaultProps} />);

      expect(
        screen.getByPlaceholderText('Share your thoughts about this film...')
      ).toBeInTheDocument();
    });

    it('renders character count', () => {
      render(<ReviewForm {...defaultProps} />);

      expect(screen.getByText('0/2000')).toBeInTheDocument();
    });

    it('renders submit and cancel buttons', () => {
      render(<ReviewForm {...defaultProps} />);

      expect(screen.getByText('Submit Review')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });
  });

  describe('edit mode', () => {
    it('shows "Edit Review" title when editing', () => {
      render(<ReviewForm {...defaultProps} initialRating={7} />);

      expect(screen.getByText('Edit Review')).toBeInTheDocument();
    });

    it('shows "Update Review" button when editing', () => {
      render(<ReviewForm {...defaultProps} initialRating={7} />);

      expect(screen.getByText('Update Review')).toBeInTheDocument();
    });

    it('pre-fills rating when editing', () => {
      render(<ReviewForm {...defaultProps} initialRating={7} />);

      expect(screen.getByText('Rating: 7')).toBeInTheDocument();
    });

    it('pre-fills comment when editing', () => {
      render(
        <ReviewForm {...defaultProps} initialRating={7} initialComment="Previous review text" />
      );

      const textarea = screen.getByPlaceholderText('Share your thoughts about this film...');
      expect(textarea).toHaveValue('Previous review text');
    });
  });

  describe('form submission', () => {
    it('disables submit button when no rating is set', () => {
      render(<ReviewForm {...defaultProps} />);

      const submitButton = screen.getByText('Submit Review');
      expect(submitButton).toBeDisabled();
    });

    it('calls onSubmit with rating and comment', () => {
      render(<ReviewForm {...defaultProps} />);

      // Set rating
      const setRatingButton = screen.getByTestId('set-rating-8');
      fireEvent.click(setRatingButton);

      // Enter comment
      const textarea = screen.getByPlaceholderText('Share your thoughts about this film...');
      fireEvent.change(textarea, { target: { value: 'Great movie!' } });

      // Submit
      const submitButton = screen.getByText('Submit Review');
      fireEvent.click(submitButton);

      expect(defaultProps.onSubmit).toHaveBeenCalledWith({
        rating: 8,
        comment: 'Great movie!',
      });
    });

    it('enables submit button when rating is set', () => {
      render(<ReviewForm {...defaultProps} />);

      // Set rating
      const setRatingButton = screen.getByTestId('set-rating-5');
      fireEvent.click(setRatingButton);

      const submitButton = screen.getByText('Submit Review');
      expect(submitButton).not.toBeDisabled();
    });

    it('allows submission without comment (optional)', () => {
      render(<ReviewForm {...defaultProps} />);

      // Set rating only
      const setRatingButton = screen.getByTestId('set-rating-5');
      fireEvent.click(setRatingButton);

      // Submit
      const submitButton = screen.getByText('Submit Review');
      fireEvent.click(submitButton);

      expect(defaultProps.onSubmit).toHaveBeenCalledWith({
        rating: 5,
        comment: '',
      });
    });
  });

  describe('close functionality', () => {
    it('calls onClose when clicking cancel button', () => {
      render(<ReviewForm {...defaultProps} />);

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('calls onClose when clicking close (X) button', () => {
      const { container } = render(<ReviewForm {...defaultProps} />);

      // Find the X button in the header
      const closeButton = container.querySelector('.border-border button');
      fireEvent.click(closeButton!);

      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('calls onClose when clicking backdrop', () => {
      const { container } = render(<ReviewForm {...defaultProps} />);

      // Click the backdrop
      const backdrop = container.querySelector('.absolute.inset-0.backdrop-blur-sm');
      fireEvent.click(backdrop!);

      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });

  describe('loading state', () => {
    it('shows loading spinner when isSubmitting', () => {
      render(<ReviewForm {...defaultProps} isSubmitting />);

      expect(screen.getByText('Submitting...')).toBeInTheDocument();
    });

    it('shows "Updating..." when editing and submitting', () => {
      render(<ReviewForm {...defaultProps} initialRating={7} isSubmitting />);

      expect(screen.getByText('Updating...')).toBeInTheDocument();
    });

    it('disables submit button when submitting', () => {
      render(<ReviewForm {...defaultProps} isSubmitting />);

      const submitButton = screen.getByRole('button', { name: /Submitting/ });
      expect(submitButton).toBeDisabled();
    });

    it('disables cancel button when submitting', () => {
      render(<ReviewForm {...defaultProps} isSubmitting />);

      const cancelButton = screen.getByText('Cancel');
      expect(cancelButton).toBeDisabled();
    });

    it('disables close button when submitting', () => {
      const { container } = render(<ReviewForm {...defaultProps} isSubmitting />);

      const closeButton = container.querySelector('.border-border button');
      expect(closeButton).toBeDisabled();
    });

    it('disables textarea when submitting', () => {
      render(<ReviewForm {...defaultProps} isSubmitting />);

      const textarea = screen.getByPlaceholderText('Share your thoughts about this film...');
      expect(textarea).toBeDisabled();
    });
  });

  describe('error handling', () => {
    it('displays error message from props', () => {
      render(<ReviewForm {...defaultProps} error="Something went wrong" />);

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('shows error icon with error message', () => {
      const { container } = render(<ReviewForm {...defaultProps} error="Error occurred" />);

      // Should have error styling
      expect(container.querySelector('.bg-red-500\\/10')).toBeInTheDocument();
    });
  });

  describe('character count', () => {
    it('updates character count on input', () => {
      render(<ReviewForm {...defaultProps} />);

      const textarea = screen.getByPlaceholderText('Share your thoughts about this film...');
      fireEvent.change(textarea, { target: { value: 'Hello' } });

      expect(screen.getByText('5/2000')).toBeInTheDocument();
    });

    it('shows warning color when approaching limit', () => {
      const longText = 'a'.repeat(1900);
      render(<ReviewForm {...defaultProps} initialComment={longText} />);

      expect(screen.getByText('1900/2000')).toBeInTheDocument();
      // Should have orange warning color class
      const counter = screen.getByText('1900/2000');
      expect(counter).toHaveClass('text-letterboxd-orange');
    });
  });

  describe('button disabled state', () => {
    it('submit button reflects rating state', () => {
      render(<ReviewForm {...defaultProps} />);

      // Initially disabled
      expect(screen.getByText('Submit Review')).toBeDisabled();

      // Verify rating component is present
      expect(screen.getByTestId('star-rating')).toBeInTheDocument();
    });
  });
});
