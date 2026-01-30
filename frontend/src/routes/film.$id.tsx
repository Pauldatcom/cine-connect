import { FilmPoster } from '@/components/features/FilmPoster';
import { ReviewCard } from '@/components/features/ReviewCard';
import { ReviewForm } from '@/components/features/ReviewForm';
import { StarRating } from '@/components/ui/StarRating';
import { useAuth } from '@/contexts/AuthContext';
import {
  useCreateReview,
  useFilm,
  useFilmCredits,
  useFilmReviews,
  useFilmVideos,
  useLikeReview,
  useRegisterFilm,
  useSimilarFilms,
  useUpdateReview,
  type Review,
} from '@/hooks';
import { getImageUrl } from '@/lib/api/tmdb';
import { createFileRoute, Link } from '@tanstack/react-router';
import {
  ArrowLeft,
  Calendar,
  Clock,
  ExternalLink,
  Film,
  Info,
  List,
  Loader2,
  MessageSquare,
  Play,
  Share2,
  Star,
  Users,
} from 'lucide-react';
import { useState } from 'react';

type TabId = 'cast' | 'crew' | 'details' | 'genres' | 'releases';

/**
 * Film detail page - Letterboxd-inspired layout with tabs
 */
export const Route = createFileRoute('/film/$id')({
  component: FilmDetailPage,
});

function FilmDetailPage() {
  const { id } = Route.useParams();
  const { isAuthenticated, user } = useAuth();

  const [activeTab, setActiveTab] = useState<TabId>('cast');
  const [userRating, setUserRating] = useState<number>(0);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  // Fetch film details from TMDb using custom hook
  const { data: film, isLoading, error } = useFilm(id);

  // Fetch credits, videos, and similar films using custom hooks
  const { data: credits } = useFilmCredits(id, !!film);
  const { data: videos } = useFilmVideos(id, !!film);
  const { data: similar } = useSimilarFilms(id, !!film);

  // Register film in our backend to get internal UUID
  const { data: backendFilm } = useRegisterFilm(film, !!film);

  // Fetch reviews from our backend using internal UUID
  const { data: reviewsData, isLoading: reviewsLoading } = useFilmReviews(backendFilm?.id);

  // Derive user's existing review from film reviews list (reviews-only branch: no useUserFilmReview)
  const existingReview = reviewsData?.items?.find((r) => r.userId === user?.id);
  const hasReviewed = !!existingReview;

  // Create and update review mutations
  const createReviewMutation = useCreateReview(backendFilm?.id);
  const updateReviewMutation = useUpdateReview(backendFilm?.id);

  // Like review mutation using custom hook
  const likeReviewMutation = useLikeReview(backendFilm?.id);

  const handleSubmitReview = (data: { rating: number; comment: string }) => {
    if (!backendFilm?.id) {
      setReviewError('Film not registered yet, please try again');
      return;
    }
    setReviewError(null);

    // If user already has a review, update it instead of creating
    if (hasReviewed && existingReview) {
      updateReviewMutation.mutate(
        {
          reviewId: existingReview.id,
          input: {
            rating: data.rating,
            comment: data.comment || undefined,
          },
        },
        {
          onSuccess: () => {
            setShowReviewForm(false);
            setReviewError(null);
          },
          onError: (error: Error) => {
            setReviewError(error.message || 'Failed to update review');
          },
        }
      );
    } else {
      createReviewMutation.mutate(
        {
          filmId: backendFilm.id,
          rating: data.rating,
          comment: data.comment || undefined,
        },
        {
          onSuccess: () => {
            setShowReviewForm(false);
            setReviewError(null);
          },
          onError: (error: Error) => {
            setReviewError(error.message || 'Failed to submit review');
          },
        }
      );
    }
  };

  const handleWriteReview = () => {
    if (!isAuthenticated) {
      // Redirect to login
      window.location.href = '/profil?mode=login';
      return;
    }
    // Pre-fill rating if editing existing review
    if (hasReviewed && existingReview) {
      setUserRating(existingReview.rating);
    }
    setShowReviewForm(true);
  };

  const handleLikeReview = (reviewId: string) => {
    if (!isAuthenticated) return;
    likeReviewMutation.mutate(reviewId);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="border-letterboxd-green h-10 w-10 animate-spin rounded-full border-2 border-t-transparent" />
      </div>
    );
  }

  if (error || !film) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <Film className="text-text-tertiary mx-auto mb-4 h-16 w-16" />
        <h1 className="text-text-primary text-2xl font-bold">Film Not Found</h1>
        <p className="text-text-secondary mt-2">
          We couldn&apos;t find the film you&apos;re looking for.
        </p>
        <Link to="/films" className="btn-primary mt-6 inline-flex">
          <ArrowLeft className="h-4 w-4" />
          Back to Films
        </Link>
      </div>
    );
  }

  const year = film.release_date ? new Date(film.release_date).getFullYear() : null;
  const director = credits?.crew.find((c) => c.job === 'Director');
  const writers = credits?.crew.filter((c) => c.department === 'Writing').slice(0, 3) || [];
  const trailer = videos?.results.find((v) => v.type === 'Trailer' && v.site === 'YouTube');
  const topCast = credits?.cast.slice(0, 12) || [];
  const topCrew = credits?.crew.slice(0, 12) || [];
  const reviews = reviewsData?.items || [];

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'cast', label: 'Cast', icon: <Users className="h-4 w-4" /> },
    { id: 'crew', label: 'Crew', icon: <Film className="h-4 w-4" /> },
    { id: 'details', label: 'Details', icon: <Info className="h-4 w-4" /> },
    { id: 'genres', label: 'Genres', icon: <List className="h-4 w-4" /> },
  ];

  return (
    <div className="animate-fade-in">
      {/* Review Form Modal */}
      {showReviewForm && (
        <ReviewForm
          film={{
            id: id,
            title: film.title,
            year: year,
            posterUrl: getImageUrl(film.poster_path, 'poster', 'small'),
          }}
          initialRating={userRating}
          initialComment={existingReview?.comment || ''}
          isSubmitting={createReviewMutation.isPending || updateReviewMutation.isPending}
          error={reviewError}
          onSubmit={handleSubmitReview}
          onClose={() => {
            setShowReviewForm(false);
            setReviewError(null);
          }}
        />
      )}

      {/* Backdrop Header */}
      <div className="relative">
        {/* Backdrop Image */}
        {film.backdrop_path && (
          <div className="absolute inset-0 h-[60vh] overflow-hidden">
            <img
              src={getImageUrl(film.backdrop_path, 'backdrop', 'large')}
              alt=""
              className="h-full w-full object-cover object-top"
            />
            <div className="from-bg-primary via-bg-primary/80 to-bg-primary/30 absolute inset-0 bg-gradient-to-t" />
            <div className="from-bg-primary/90 absolute inset-0 bg-gradient-to-r via-transparent to-transparent" />
          </div>
        )}

        {/* Content */}
        <div className="relative mx-auto max-w-7xl px-4 pt-8">
          {/* Back Button */}
          <Link
            to="/films"
            className="text-text-secondary hover:text-text-primary mb-8 inline-flex items-center gap-2 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Films
          </Link>

          {/* Film Header */}
          <div className="flex flex-col gap-8 pb-8 lg:flex-row">
            {/* Left: Poster & Actions */}
            <div className="shrink-0 lg:w-72">
              {/* Poster */}
              <div className="relative">
                <img
                  src={getImageUrl(film.poster_path, 'poster', 'large')}
                  alt={film.title}
                  className="mx-auto w-full max-w-[288px] rounded-lg shadow-2xl lg:mx-0"
                />
                {/* Trailer overlay button */}
                {trailer && (
                  <a
                    href={`https://www.youtube.com/watch?v=${trailer.key}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50 opacity-0 transition-opacity hover:opacity-100"
                  >
                    <div className="bg-letterboxd-orange flex items-center gap-2 rounded-full px-4 py-2 font-medium text-white">
                      <Play className="h-5 w-5 fill-current" />
                      Watch Trailer
                    </div>
                  </a>
                )}
              </div>

              {/* Rate this film */}
              <div className="bg-bg-secondary/80 mx-auto mt-6 max-w-[288px] rounded-lg p-4 backdrop-blur lg:mx-0">
                <p className="text-text-secondary mb-3 text-sm">Rate this film</p>
                <StarRating
                  rating={userRating}
                  onRatingChange={(rating) => {
                    setUserRating(rating);
                    if (isAuthenticated && rating > 0) {
                      setShowReviewForm(true);
                    }
                  }}
                  size="lg"
                />
              </div>

              {/* Share */}
              <button className="btn-ghost mx-auto mt-4 w-full max-w-[288px] justify-center lg:mx-0">
                <Share2 className="h-4 w-4" />
                Share
              </button>
            </div>

            {/* Right: Film Info */}
            <div className="min-w-0 flex-1 pt-4 lg:pt-0">
              {/* Title */}
              <h1 className="font-display text-3xl font-bold leading-tight text-white md:text-4xl lg:text-5xl">
                {film.title}
              </h1>

              {/* Year, Runtime, Director */}
              <div className="text-text-secondary mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                {year && (
                  <span className="flex items-center gap-1.5 text-lg">
                    <Calendar className="h-4 w-4" />
                    {year}
                  </span>
                )}
                {film.runtime > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    {Math.floor(film.runtime / 60)}h {film.runtime % 60}m
                  </span>
                )}
                {director && (
                  <span>
                    Directed by{' '}
                    <span className="text-text-primary font-medium">{director.name}</span>
                  </span>
                )}
              </div>

              {/* Rating */}
              {film.vote_average > 0 && (
                <div className="mt-6 flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Star className="text-letterboxd-green fill-letterboxd-green h-8 w-8" />
                    <span className="text-3xl font-bold text-white">
                      {film.vote_average.toFixed(1)}
                    </span>
                    <span className="text-text-tertiary text-lg">/ 10</span>
                  </div>
                  <div className="text-text-tertiary">
                    <span className="text-text-secondary font-medium">
                      {film.vote_count.toLocaleString()}
                    </span>{' '}
                    ratings
                  </div>
                </div>
              )}

              {/* Tagline */}
              {film.tagline && (
                <p className="text-text-secondary border-letterboxd-green mt-6 border-l-2 pl-4 text-xl italic">
                  &ldquo;{film.tagline}&rdquo;
                </p>
              )}

              {/* Genres */}
              {film.genres.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-2">
                  {film.genres.map((genre) => (
                    <Link
                      key={genre.id}
                      to="/films/$categorie"
                      params={{ categorie: genre.name.toLowerCase().replace(/ /g, '-') }}
                      className="genre-tag"
                    >
                      {genre.name}
                    </Link>
                  ))}
                </div>
              )}

              {/* Overview */}
              <div className="mt-8">
                <h2 className="text-text-tertiary mb-3 text-sm font-semibold uppercase tracking-wider">
                  Overview
                </h2>
                <p className="text-text-secondary text-lg leading-relaxed">
                  {film.overview || 'No overview available.'}
                </p>
              </div>

              {/* Writers */}
              {writers.length > 0 && (
                <div className="mt-6">
                  <span className="text-text-tertiary">Written by </span>
                  {writers.map((w, i) => (
                    <span key={`${w.id}-${i}`}>
                      <span className="text-text-primary">{w.name}</span>
                      {i < writers.length - 1 && <span className="text-text-tertiary">, </span>}
                    </span>
                  ))}
                </div>
              )}

              {/* External Links */}
              <div className="mt-8 flex flex-wrap gap-3">
                {trailer && (
                  <a
                    href={`https://www.youtube.com/watch?v=${trailer.key}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-orange"
                  >
                    <Play className="h-4 w-4" />
                    Watch Trailer
                  </a>
                )}
                {film.homepage && (
                  <a
                    href={film.homepage}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Official Site
                  </a>
                )}
                {film.imdb_id && (
                  <a
                    href={`https://www.imdb.com/title/${film.imdb_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary"
                  >
                    IMDb
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="border-border bg-bg-secondary sticky top-14 z-30 border-t">
        <div className="mx-auto max-w-7xl px-4">
          <div className="scrollbar-hide flex gap-1 overflow-x-auto py-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 rounded px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-letterboxd-green text-bg-primary'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Cast Tab */}
        {activeTab === 'cast' && topCast.length > 0 && (
          <div className="animate-fade-in">
            <h2 className="section-header mb-6">Top Billed Cast</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {topCast.map((person, index) => (
                <div key={`${person.id}-${index}`} className="card p-4 text-center">
                  <div className="bg-bg-tertiary mx-auto mb-3 aspect-square w-24 overflow-hidden rounded-full">
                    {person.profile_path ? (
                      <img
                        src={getImageUrl(person.profile_path, 'profile', 'medium')}
                        alt={person.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="text-text-tertiary flex h-full w-full items-center justify-center text-3xl font-bold">
                        {person.name[0]}
                      </div>
                    )}
                  </div>
                  <p className="text-text-primary line-clamp-1 font-medium">{person.name}</p>
                  <p className="text-text-tertiary mt-1 line-clamp-1 text-sm">{person.character}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Crew Tab */}
        {activeTab === 'crew' && topCrew.length > 0 && (
          <div className="animate-fade-in">
            <h2 className="section-header mb-6">Crew</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {topCrew.map((person, index) => (
                <div
                  key={`${person.id}-${index}`}
                  className="bg-bg-secondary flex items-center gap-4 rounded-lg p-4"
                >
                  <div className="bg-bg-tertiary flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full">
                    {person.profile_path ? (
                      <img
                        src={getImageUrl(person.profile_path, 'profile', 'small')}
                        alt={person.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-text-tertiary text-lg font-bold">{person.name[0]}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-text-primary font-medium">{person.name}</p>
                    <p className="text-text-tertiary text-sm">{person.job}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Details Tab */}
        {activeTab === 'details' && (
          <div className="animate-fade-in max-w-2xl">
            <h2 className="section-header mb-6">Details</h2>
            <dl className="space-y-4">
              <DetailRow label="Status" value={film.status} />
              <DetailRow label="Original Language" value={film.original_language?.toUpperCase()} />
              <DetailRow
                label="Budget"
                value={film.budget ? `$${film.budget.toLocaleString()}` : 'Not available'}
              />
              <DetailRow
                label="Revenue"
                value={film.revenue ? `$${film.revenue.toLocaleString()}` : 'Not available'}
              />
              {film.production_companies.length > 0 && (
                <DetailRow
                  label="Production Companies"
                  value={film.production_companies.map((c) => c.name).join(', ')}
                />
              )}
              {film.production_countries.length > 0 && (
                <DetailRow
                  label="Countries"
                  value={film.production_countries.map((c) => c.name).join(', ')}
                />
              )}
              {film.spoken_languages.length > 0 && (
                <DetailRow
                  label="Languages"
                  value={film.spoken_languages.map((l) => l.name).join(', ')}
                />
              )}
            </dl>
          </div>
        )}

        {/* Genres Tab */}
        {activeTab === 'genres' && (
          <div className="animate-fade-in">
            <h2 className="section-header mb-6">Genres</h2>
            <div className="flex flex-wrap gap-3">
              {film.genres.map((genre) => (
                <Link
                  key={genre.id}
                  to="/films/$categorie"
                  params={{ categorie: genre.name.toLowerCase().replace(/ /g, '-') }}
                  className="bg-bg-secondary text-text-primary hover:bg-letterboxd-green hover:text-bg-primary rounded-lg px-6 py-3 text-lg font-medium transition-colors"
                >
                  {genre.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Similar Films */}
      {similar && similar.results.length > 0 && (
        <section className="border-border mx-auto max-w-7xl border-t px-4 py-8">
          <h2 className="section-header mb-6">Similar Films</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {similar.results.slice(0, 12).map((movie, index) => (
              <FilmPoster key={`${movie.id}-${index}`} film={movie} showTitle />
            ))}
          </div>
        </section>
      )}

      {/* Reviews Section */}
      <section className="border-border mx-auto max-w-7xl border-t px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="section-header flex items-center gap-2">
            <MessageSquare className="text-letterboxd-blue h-5 w-5" />
            Reviews
            {reviewsData && reviewsData.total > 0 && (
              <span className="text-text-tertiary text-base font-normal">
                ({reviewsData.total})
              </span>
            )}
          </h2>
          <button onClick={handleWriteReview} className="btn-secondary">
            {hasReviewed ? 'Edit Your Review' : 'Write a Review'}
          </button>
        </div>

        {/* Loading state */}
        {reviewsLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="text-letterboxd-green h-8 w-8 animate-spin" />
          </div>
        )}

        {/* No reviews */}
        {!reviewsLoading && reviews.length === 0 && (
          <div className="text-text-tertiary py-12 text-center">
            <MessageSquare className="mx-auto mb-4 h-12 w-12 opacity-50" />
            <p className="text-lg">No reviews yet</p>
            <p className="mt-1 text-sm">Be the first to share your thoughts!</p>
          </div>
        )}

        {/* Reviews list */}
        {!reviewsLoading && reviews.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2">
            {reviews.map((review: Review) => (
              <ReviewCard
                key={review.id}
                id={review.id}
                film={film ?? undefined}
                showFilm={true}
                user={{
                  id: review.user?.id || review.userId,
                  name: review.user?.username || 'Anonymous',
                  avatar: review.user?.avatarUrl || undefined,
                }}
                rating={review.rating}
                content={review.comment || ''}
                reviewDate={formatRelativeDate(review.createdAt)}
                likes={review.likesCount || 0}
                comments={review.commentsCount || 0}
                isLiked={review.isLikedByCurrentUser || false}
                onLike={handleLikeReview}
              />
            ))}
          </div>
        )}

        {/* Load more */}
        {reviewsData && reviewsData.totalPages > 1 && (
          <div className="mt-6 text-center">
            <button className="btn-secondary">Load More Reviews</button>
          </div>
        )}
      </section>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="border-border flex flex-col gap-1 border-b py-3 sm:flex-row sm:items-start sm:gap-4">
      <dt className="text-text-tertiary w-40 shrink-0 text-sm font-medium">{label}</dt>
      <dd className="text-text-primary">{value}</dd>
    </div>
  );
}

/**
 * Format a date string to relative time (e.g., "2 days ago")
 */
function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  if (diffWeeks < 4) return `${diffWeeks} week${diffWeeks === 1 ? '' : 's'} ago`;
  if (diffMonths < 12) return `${diffMonths} month${diffMonths === 1 ? '' : 's'} ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
