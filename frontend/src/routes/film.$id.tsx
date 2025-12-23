import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import {
  ArrowLeft,
  Star,
  Clock,
  Calendar,
  Play,
  Heart,
  Eye,
  List,
  Share2,
  ExternalLink,
  Film,
  Users,
  Info,
  MessageSquare,
} from 'lucide-react';
import {
  getMovieDetails,
  getMovieCredits,
  getMovieVideos,
  getSimilarMovies,
  getImageUrl,
} from '@/lib/api/tmdb';
import { FilmPoster } from '@/components/FilmPoster';
import { StarRating } from '@/components/ui/StarRating';
import { ReviewCard } from '@/components/ui/ReviewCard';

type TabId = 'cast' | 'crew' | 'details' | 'genres' | 'releases';

/**
 * Film detail page - Letterboxd-inspired layout with tabs
 */
export const Route = createFileRoute('/film/$id')({
  component: FilmDetailPage,
});

function FilmDetailPage() {
  const { id } = Route.useParams();
  const [activeTab, setActiveTab] = useState<TabId>('cast');
  const [userRating, setUserRating] = useState<number>(0);

  const {
    data: film,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['movie', id],
    queryFn: () => getMovieDetails(id),
  });

  const { data: credits } = useQuery({
    queryKey: ['movie', id, 'credits'],
    queryFn: () => getMovieCredits(id),
    enabled: !!film,
  });

  const { data: videos } = useQuery({
    queryKey: ['movie', id, 'videos'],
    queryFn: () => getMovieVideos(id),
    enabled: !!film,
  });

  const { data: similar } = useQuery({
    queryKey: ['movie', id, 'similar'],
    queryFn: () => getSimilarMovies(id),
    enabled: !!film,
  });

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
        <p className="text-text-secondary mt-2">We couldn't find the film you're looking for.</p>
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

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'cast', label: 'Cast', icon: <Users className="h-4 w-4" /> },
    { id: 'crew', label: 'Crew', icon: <Film className="h-4 w-4" /> },
    { id: 'details', label: 'Details', icon: <Info className="h-4 w-4" /> },
    { id: 'genres', label: 'Genres', icon: <List className="h-4 w-4" /> },
  ];

  return (
    <div className="animate-fade-in">
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

              {/* Action Buttons */}
              <div className="mx-auto mt-6 grid max-w-[288px] grid-cols-3 gap-2 lg:mx-0">
                <ActionButton
                  icon={<Eye className="h-5 w-5" />}
                  label="Watch"
                  active={false}
                  activeColor="text-letterboxd-green"
                />
                <ActionButton
                  icon={<Heart className="h-5 w-5" />}
                  label="Like"
                  active={false}
                  activeColor="text-letterboxd-orange"
                />
                <ActionButton
                  icon={<List className="h-5 w-5" />}
                  label="Watchlist"
                  active={false}
                  activeColor="text-letterboxd-blue"
                />
              </div>

              {/* Rate this film */}
              <div className="bg-bg-secondary/80 mx-auto mt-6 max-w-[288px] rounded-lg p-4 backdrop-blur lg:mx-0">
                <p className="text-text-secondary mb-3 text-sm">Rate this film</p>
                <StarRating rating={userRating} onRatingChange={setUserRating} size="lg" />
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
                  "{film.tagline}"
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
                    <span key={w.id}>
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
              {topCast.map((person) => (
                <div key={person.id} className="card p-4 text-center">
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
            {similar.results.slice(0, 12).map((movie) => (
              <FilmPoster key={movie.id} film={movie} showTitle />
            ))}
          </div>
        </section>
      )}

      {/* Reviews Section */}
      <section className="border-border mx-auto max-w-7xl border-t px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="section-header flex items-center gap-2">
            <MessageSquare className="text-letterboxd-blue h-5 w-5" />
            Recent Reviews
          </h2>
          <button className="btn-secondary">Write a Review</button>
        </div>

        {/* Placeholder reviews */}
        <div className="grid gap-4 md:grid-cols-2">
          <ReviewCard
            user={{ id: '1', name: 'MovieBuff42' }}
            rating={4.5}
            content="An absolutely stunning film that delivers on every level. The cinematography alone is worth the price of admission."
            reviewDate="2 days ago"
            watchedDate="Dec 10, 2024"
            likes={24}
            comments={3}
          />
          <ReviewCard
            user={{ id: '2', name: 'CinemaLover' }}
            rating={4}
            content="Great performances all around. While the pacing can be slow at times, the payoff is well worth it."
            reviewDate="1 week ago"
            likes={15}
            comments={1}
          />
        </div>
      </section>
    </div>
  );
}

function ActionButton({
  icon,
  label,
  active,
  activeColor,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  activeColor: string;
}) {
  return (
    <button
      className={`flex flex-col items-center gap-1.5 rounded-lg px-2 py-3 transition-colors ${
        active
          ? `bg-bg-tertiary ${activeColor}`
          : 'bg-bg-secondary hover:bg-bg-tertiary text-text-secondary hover:text-text-primary'
      }`}
      title={label}
    >
      {icon}
      <span className="text-xs font-medium">{label}</span>
    </button>
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
