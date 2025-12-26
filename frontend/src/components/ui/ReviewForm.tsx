/**
 * Review Form Component - Modal for writing/editing reviews
 */

import { useState, type FormEvent } from 'react';
import { X, Loader2, AlertCircle, Film } from 'lucide-react';
import { StarRating } from './StarRating';

interface ReviewFormProps {
  /** Film information */
  film: {
    id: string;
    title: string;
    year?: string | number | null;
    posterUrl?: string | null;
  };
  /** Existing rating (for editing) */
  initialRating?: number;
  /** Existing comment (for editing) */
  initialComment?: string;
  /** Whether the form is submitting */
  isSubmitting?: boolean;
  /** Error message to display */
  error?: string | null;
  /** Called when form is submitted */
  onSubmit: (data: { rating: number; comment: string }) => void;
  /** Called when form is closed */
  onClose: () => void;
}

/**
 * Review Form Modal
 */
export function ReviewForm({
  film,
  initialRating = 0,
  initialComment = '',
  isSubmitting = false,
  error,
  onSubmit,
  onClose,
}: ReviewFormProps) {
  const [rating, setRating] = useState(initialRating);
  const [comment, setComment] = useState(initialComment);
  const [validationError, setValidationError] = useState<string | null>(null);

  const isEditing = !!initialRating;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Validate rating
    if (rating === 0) {
      setValidationError('Please select a rating');
      return;
    }

    onSubmit({ rating, comment });
  };

  const displayError = validationError || error;
  const characterCount = comment.length;
  const maxCharacters = 2000;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="bg-bg-primary/80 absolute inset-0 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="bg-bg-secondary border-border animate-scale-in relative w-full max-w-lg rounded-lg border shadow-xl">
        {/* Header */}
        <div className="border-border flex items-center justify-between border-b p-4">
          <h2 className="font-display text-text-primary text-lg font-semibold">
            {isEditing ? 'Edit Review' : 'Write a Review'}
          </h2>
          <button
            onClick={onClose}
            className="text-text-tertiary hover:text-text-primary transition-colors"
            disabled={isSubmitting}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-4">
          {/* Film info */}
          <div className="mb-6 flex items-center gap-4">
            <div className="bg-bg-tertiary flex h-20 w-14 shrink-0 items-center justify-center overflow-hidden rounded">
              {film.posterUrl ? (
                <img src={film.posterUrl} alt={film.title} className="h-full w-full object-cover" />
              ) : (
                <Film className="text-text-tertiary h-6 w-6" />
              )}
            </div>
            <div>
              <h3 className="font-display text-text-primary font-semibold">{film.title}</h3>
              {film.year && <p className="text-text-tertiary text-sm">{film.year}</p>}
            </div>
          </div>

          {/* Rating */}
          <div className="mb-6">
            <label className="text-text-secondary mb-3 block text-sm font-medium">
              Your Rating
            </label>
            <StarRating rating={rating} onRatingChange={setRating} size="xl" showValue />
          </div>

          {/* Comment */}
          <div className="mb-4">
            <label
              htmlFor="review-comment"
              className="text-text-secondary mb-2 block text-sm font-medium"
            >
              Review (optional)
            </label>
            <textarea
              id="review-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your thoughts about this film..."
              className="input min-h-[150px] resize-y"
              maxLength={maxCharacters}
              disabled={isSubmitting}
            />
            <div className="mt-1 flex justify-end">
              <span
                className={`text-xs ${
                  characterCount > maxCharacters * 0.9
                    ? 'text-letterboxd-orange'
                    : 'text-text-tertiary'
                }`}
              >
                {characterCount}/{maxCharacters}
              </span>
            </div>
          </div>

          {/* Error */}
          {displayError && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-500/10 p-3 text-red-400">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm">{displayError}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex-1"
              disabled={isSubmitting || rating === 0}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {isEditing ? 'Updating...' : 'Submitting...'}
                </span>
              ) : isEditing ? (
                'Update Review'
              ) : (
                'Submit Review'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ReviewForm;
