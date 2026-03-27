/**
 * Public user profile - View another member's profile (reviews, etc.)
 */

import { useUserReviews } from '@/hooks/useReviews';
import { useUserById } from '@/hooks/useFriends';
import { createFileRoute, Link } from '@tanstack/react-router';
import { Loader2, Star, User } from 'lucide-react';

export const Route = createFileRoute('/user/$id')({
  component: UserProfilePage,
});

function UserProfilePage() {
  const { id } = Route.useParams() as { id: string };
  const { data: user, isLoading: userLoading, error: userError } = useUserById(id);
  const { data: reviews = [], isLoading: reviewsLoading } = useUserReviews(user?.id);

  if (userLoading || !id) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="text-letterboxd-green h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (userError || !user) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-text-secondary">User not found.</p>
        <Link to="/members" className="text-letterboxd-green mt-4 inline-block text-sm font-medium">
          Back to Members
        </Link>
      </div>
    );
  }

  const memberSince = new Date(user.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Profile header */}
      <div className="card">
        <div className="flex flex-col items-center gap-6 sm:flex-row">
          <div className="bg-letterboxd-green/20 flex h-24 w-24 shrink-0 items-center justify-center rounded-full">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="h-24 w-24 rounded-full object-cover" />
            ) : (
              <User className="text-letterboxd-green h-12 w-12" />
            )}
          </div>
          <div className="text-center sm:text-left">
            <h1 className="font-display text-text-primary text-2xl font-bold">{user.username}</h1>
            <p className="text-text-tertiary mt-1 text-sm">Member since {memberSince}</p>
          </div>
          <div className="sm:ml-auto">
            <Link to="/members" className="btn-secondary">
              ← Back to Members
            </Link>
          </div>
        </div>
      </div>

      {/* Reviews */}
      <div className="card mt-6">
        <h2 className="section-header mb-4 flex items-center gap-2">
          <Star className="h-5 w-5" />
          Reviews
        </h2>
        {reviewsLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="text-letterboxd-green h-6 w-6 animate-spin" />
          </div>
        ) : reviews.length === 0 ? (
          <p className="text-text-tertiary py-8 text-center">No reviews yet.</p>
        ) : (
          <ul className="space-y-4">
            {reviews.slice(0, 10).map((review) => {
              const content = (
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-letterboxd-green font-bold">{review.rating}/10</span>
                    <Star className="text-letterboxd-green h-4 w-4 fill-current" />
                  </div>
                  {review.film && (
                    <p className="text-letterboxd-green mt-1 font-medium">{review.film.title}</p>
                  )}
                  {review.comment && (
                    <p className="text-text-secondary mt-2 line-clamp-2">{review.comment}</p>
                  )}
                  <p className="text-text-tertiary mt-2 text-xs">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </p>
                </div>
              );
              const filmTmdbId = review.film?.tmdbId;
              return filmTmdbId !== null && filmTmdbId !== undefined ? (
                <Link
                  key={review.id}
                  to="/film/$id"
                  params={{ id: String(filmTmdbId) }}
                  className="bg-bg-tertiary block flex items-start gap-4 rounded-lg p-4 transition-opacity hover:opacity-90"
                >
                  {content}
                </Link>
              ) : (
                <div
                  key={review.id}
                  className="bg-bg-tertiary flex items-start gap-4 rounded-lg p-4"
                >
                  {content}
                </div>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
