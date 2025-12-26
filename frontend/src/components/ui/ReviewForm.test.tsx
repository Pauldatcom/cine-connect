/**
 * ReviewForm Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReviewForm } from './ReviewForm';

// Mock StarRating component
vi.mock('./StarRating', () => ({
  StarRating: ({
    rating,
    onRatingChange,
    size: _size,
    showValue: _showValue,
  }: {
    rating: number;
    onRatingChange?: (rating: number) => void;
    size?: string;
    showValue?: boolean;
  }) => (
    <div data-testid="star-rating">
      <span data-testid="current-rating">{rating}</span>
      {onRatingChange && (
        <button data-testid="set-rating-4" onClick={() => onRatingChange(4)}>
          Set 4 Stars
        </button>
      )}
      {onRatingChange && (
        <button data-testid="set-rating-0" onClick={() => onRatingChange(0)}>
          Set 0 Stars
        </button>
      )}
    </div>
  ),
}));

const mockFilm = {
  id: 'film-123',
  title: 'Test Movie',
  year: '2024',
  posterUrl: '/test-poster.jpg',
};

const mockFilmNoPoster = {
  id: 'film-456',
  title: 'Another Movie',
  year: null,
  posterUrl: null,
};

describe('ReviewForm', () => {
  const mockOnSubmit = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the form with film info', () => {
    render(<ReviewForm film={mockFilm} onSubmit={mockOnSubmit} onClose={mockOnClose} />);

    expect(screen.getByText('Write a Review')).toBeInTheDocument();
    expect(screen.getByText('Test Movie')).toBeInTheDocument();
    expect(screen.getByText('2024')).toBeInTheDocument();
  });

  it('should render film poster when available', () => {
    render(<ReviewForm film={mockFilm} onSubmit={mockOnSubmit} onClose={mockOnClose} />);

    const poster = screen.getByAltText('Test Movie');
    expect(poster).toHaveAttribute('src', '/test-poster.jpg');
  });

  it('should render placeholder when no poster', () => {
    render(<ReviewForm film={mockFilmNoPoster} onSubmit={mockOnSubmit} onClose={mockOnClose} />);

    // Film icon is rendered (Lucide Film component)
    expect(screen.queryByAltText('Another Movie')).not.toBeInTheDocument();
  });

  it('should show "Edit Review" title when editing', () => {
    render(
      <ReviewForm
        film={mockFilm}
        initialRating={4}
        initialComment="Existing comment"
        onSubmit={mockOnSubmit}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Edit Review')).toBeInTheDocument();
    expect(screen.getByText('Update Review')).toBeInTheDocument();
  });

  it('should call onClose when cancel button is clicked', async () => {
    const user = userEvent.setup();

    render(<ReviewForm film={mockFilm} onSubmit={mockOnSubmit} onClose={mockOnClose} />);

    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    await user.click(cancelButton);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should call onClose when backdrop is clicked', async () => {
    const user = userEvent.setup();

    const { container } = render(
      <ReviewForm film={mockFilm} onSubmit={mockOnSubmit} onClose={mockOnClose} />
    );

    // Click backdrop (the blur overlay)
    const backdrop = container.querySelector('.backdrop-blur-sm');
    expect(backdrop).toBeTruthy();
    if (backdrop) {
      await user.click(backdrop);
      expect(mockOnClose).toHaveBeenCalled();
    }
  });

  it('should have disabled submit button when no rating selected', () => {
    render(<ReviewForm film={mockFilm} onSubmit={mockOnSubmit} onClose={mockOnClose} />);

    // Submit button should be disabled when rating is 0
    const submitButton = screen.getByRole('button', { name: 'Submit Review' });
    expect(submitButton).toBeDisabled();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should submit form with rating and comment', async () => {
    const user = userEvent.setup();

    render(<ReviewForm film={mockFilm} onSubmit={mockOnSubmit} onClose={mockOnClose} />);

    // Set rating
    await user.click(screen.getByTestId('set-rating-4'));

    // Enter comment
    const textarea = screen.getByPlaceholderText('Share your thoughts about this film...');
    await user.type(textarea, 'Great movie!');

    // Submit
    await user.click(screen.getByText('Submit Review'));

    expect(mockOnSubmit).toHaveBeenCalledWith({
      rating: 4,
      comment: 'Great movie!',
    });
  });

  it('should display external error prop', () => {
    render(
      <ReviewForm
        film={mockFilm}
        error="Failed to submit review"
        onSubmit={mockOnSubmit}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Failed to submit review')).toBeInTheDocument();
  });

  it('should disable form when submitting', () => {
    render(
      <ReviewForm
        film={mockFilm}
        isSubmitting={true}
        onSubmit={mockOnSubmit}
        onClose={mockOnClose}
      />
    );

    const textarea = screen.getByPlaceholderText('Share your thoughts about this film...');
    expect(textarea).toBeDisabled();
    // When not editing (no initialRating), shows "Submitting..."
    expect(screen.getByText(/Submitting/)).toBeInTheDocument();
  });

  it('should show "Updating..." when editing and submitting', () => {
    render(
      <ReviewForm
        film={mockFilm}
        initialRating={4}
        initialComment="Original comment"
        isSubmitting={true}
        onSubmit={mockOnSubmit}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Updating...')).toBeInTheDocument();
  });

  it('should show character count', async () => {
    const user = userEvent.setup();

    render(<ReviewForm film={mockFilm} onSubmit={mockOnSubmit} onClose={mockOnClose} />);

    expect(screen.getByText('0/2000')).toBeInTheDocument();

    const textarea = screen.getByPlaceholderText('Share your thoughts about this film...');
    await user.type(textarea, 'Hello');

    expect(screen.getByText('5/2000')).toBeInTheDocument();
  });

  it('should use initial values for rating and comment', () => {
    render(
      <ReviewForm
        film={mockFilm}
        initialRating={5}
        initialComment="This is my review"
        onSubmit={mockOnSubmit}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByTestId('current-rating')).toHaveTextContent('5');
    const textarea = screen.getByPlaceholderText('Share your thoughts about this film...');
    expect(textarea).toHaveValue('This is my review');
  });

  it('should disable submit button when submitting', () => {
    render(
      <ReviewForm
        film={mockFilm}
        initialRating={4}
        isSubmitting={true}
        onSubmit={mockOnSubmit}
        onClose={mockOnClose}
      />
    );

    // Submit button should be disabled while submitting
    const submitButton = screen.getByRole('button', { name: /Updating/ });
    expect(submitButton).toBeDisabled();
  });

  it('should enable submit button when rating is set', async () => {
    const user = userEvent.setup();

    render(<ReviewForm film={mockFilm} onSubmit={mockOnSubmit} onClose={mockOnClose} />);

    // Submit button starts disabled
    const submitButton = screen.getByRole('button', { name: 'Submit Review' });
    expect(submitButton).toBeDisabled();

    // Set rating
    await user.click(screen.getByTestId('set-rating-4'));

    // Submit button should now be enabled
    expect(submitButton).not.toBeDisabled();

    // Submit should work
    await user.click(submitButton);
    expect(mockOnSubmit).toHaveBeenCalled();
  });

  it('should allow multiline input in textarea', async () => {
    const user = userEvent.setup();

    render(
      <ReviewForm film={mockFilm} initialRating={4} onSubmit={mockOnSubmit} onClose={mockOnClose} />
    );

    const textarea = screen.getByPlaceholderText('Share your thoughts about this film...');
    await user.type(textarea, 'Line 1{enter}Line 2');

    // Form should not be submitted on enter - enter creates newline
    expect(mockOnSubmit).not.toHaveBeenCalled();
    expect(textarea).toHaveValue('Line 1\nLine 2');
  });
});
