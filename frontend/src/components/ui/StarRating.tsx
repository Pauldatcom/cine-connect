import { Star } from 'lucide-react';
import { useState } from 'react';

interface StarRatingProps {
  /** Rating value from 0 to 10 (displayed as 5 stars with half-star precision) */
  rating?: number;
  /** Callback when rating changes (makes it interactive) - returns value 1-10 */
  onRatingChange?: (rating: number) => void;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Show rating number next to stars */
  showValue?: boolean;
  /** Make rating readonly */
  readonly?: boolean;
  /** Custom class for container */
  className?: string;
}

/**
 * Star Rating Component - Exact Letterboxd style
 * Supports 1-10 rating displayed as 5 stars with half-star precision
 * Internal: 1=0.5 star, 2=1 star, ..., 10=5 stars
 */
export function StarRating({
  rating = 0,
  onRatingChange,
  size = 'md',
  showValue = false,
  readonly = false,
  className = '',
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  // Convert 1-10 rating to 0-5 star display value
  const ratingToStars = (r: number) => r / 2;
  // Convert 0-5 star display to 1-10 rating
  const starsToRating = (s: number) => Math.round(s * 2);

  const displayStars = hoverRating !== null ? hoverRating : ratingToStars(rating);
  const isInteractive = !readonly && !!onRatingChange;

  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-6 w-6',
    xl: 'h-8 w-8',
  };

  const gapClasses = {
    sm: 'gap-0.5',
    md: 'gap-0.5',
    lg: 'gap-1',
    xl: 'gap-1',
  };

  const textClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-lg',
    xl: 'text-xl',
  };

  /**
   * Handle click on a star position
   * Each star has two clickable halves for half-star precision
   * Returns rating as 1-10 value
   */
  const handleClick = (starIndex: number, isLeftHalf: boolean) => {
    if (!isInteractive) return;
    const newStars = isLeftHalf ? starIndex + 0.5 : starIndex + 1;
    const newRating = starsToRating(newStars);
    // Toggle off if clicking same rating
    onRatingChange(newRating === rating ? 0 : newRating);
  };

  /**
   * Handle mouse enter on a star position
   */
  const handleMouseEnter = (starIndex: number, isLeftHalf: boolean) => {
    if (!isInteractive) return;
    setHoverRating(isLeftHalf ? starIndex + 0.5 : starIndex + 1);
  };

  /**
   * Render a single star (full, half, or empty)
   */
  const renderStar = (index: number) => {
    const value = displayStars - index;
    const isFull = value >= 1;
    const isHalf = value >= 0.5 && value < 1;

    return (
      <div key={index} className="relative">
        {/* Base empty star */}
        <Star className={`${sizeClasses[size]} text-border`} strokeWidth={1.5} />

        {/* Filled portion */}
        {(isFull || isHalf) && (
          <div
            className="absolute inset-0 overflow-hidden"
            style={{ width: isHalf ? '50%' : '100%' }}
          >
            <Star
              className={`${sizeClasses[size]} text-letterboxd-green fill-letterboxd-green`}
              strokeWidth={1.5}
            />
          </div>
        )}

        {/* Interactive hover zones */}
        {isInteractive && (
          <>
            {/* Left half */}
            <button
              type="button"
              className="absolute inset-y-0 left-0 w-1/2 cursor-pointer"
              onClick={() => handleClick(index, true)}
              onMouseEnter={() => handleMouseEnter(index, true)}
              aria-label={`Rate ${index + 0.5} stars`}
            />
            {/* Right half */}
            <button
              type="button"
              className="absolute inset-y-0 right-0 w-1/2 cursor-pointer"
              onClick={() => handleClick(index, false)}
              onMouseEnter={() => handleMouseEnter(index, false)}
              aria-label={`Rate ${index + 1} stars`}
            />
          </>
        )}
      </div>
    );
  };

  return (
    <div
      className={`flex items-center ${gapClasses[size]} ${className}`}
      onMouseLeave={() => isInteractive && setHoverRating(null)}
    >
      {/* Stars */}
      <div className={`flex ${gapClasses[size]}`}>{[0, 1, 2, 3, 4].map(renderStar)}</div>

      {/* Optional value display - shows as X/10 */}
      {showValue && rating > 0 && (
        <span className={`${textClasses[size]} text-letterboxd-green ml-1 font-semibold`}>
          {rating}/10
        </span>
      )}
    </div>
  );
}

/**
 * Simple display-only star rating (lighter weight)
 * Expects rating as 1-10 value, displays as 5 stars
 */
export function StarRatingDisplay({
  rating,
  size = 'sm',
  className = '',
}: {
  rating: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  // Convert 1-10 rating to star display
  const stars = rating / 2;
  const fullStars = Math.floor(stars);
  const hasHalf = stars % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);

  return (
    <div className={`flex gap-0.5 ${className}`}>
      {/* Full stars */}
      {Array.from({ length: fullStars }).map((_, i) => (
        <Star
          key={`full-${i}`}
          className={`${sizeClasses[size]} text-letterboxd-green fill-letterboxd-green`}
        />
      ))}
      {/* Half star */}
      {hasHalf && (
        <div className="relative">
          <Star className={`${sizeClasses[size]} text-border`} />
          <div className="absolute inset-0 w-1/2 overflow-hidden">
            <Star className={`${sizeClasses[size]} text-letterboxd-green fill-letterboxd-green`} />
          </div>
        </div>
      )}
      {/* Empty stars */}
      {Array.from({ length: emptyStars }).map((_, i) => (
        <Star key={`empty-${i}`} className={`${sizeClasses[size]} text-border`} />
      ))}
    </div>
  );
}
