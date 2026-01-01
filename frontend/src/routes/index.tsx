import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Star, TrendingUp, Clock, Sparkles, Film, Users, ArrowRight } from 'lucide-react';
import {
  getTrending,
  getPopular,
  getNowPlaying,
  getTopRated,
  getImageUrl,
  type TMDbMovie,
} from '@/lib/api/tmdb';
import { FilmPoster } from '@/components/features/FilmPoster';
import { FilmStrip } from '@/components/ui/FilmStrip';
import { StarRatingDisplay } from '@/components/ui/StarRating';

/**
 * Home page - Letterboxd-inspired design with hero, sections, and film strip
 */
export const Route = createFileRoute('/')({
  component: HomePage,
});

function HomePage() {
  const { data: trending } = useQuery({
    queryKey: ['movies', 'trending'],
    queryFn: () => getTrending('week'),
  });

  const { data: popular } = useQuery({
    queryKey: ['movies', 'popular'],
    queryFn: () => getPopular(),
  });

  const { data: nowPlaying } = useQuery({
    queryKey: ['movies', 'now-playing'],
    queryFn: () => getNowPlaying(),
  });

  const { data: topRated } = useQuery({
    queryKey: ['movies', 'top-rated'],
    queryFn: () => getTopRated(),
  });

  // Featured film (first trending)
  const featured = trending?.results[0];

  return (
    <div className="animate-fade-in">
      {/* Hero Section with Featured Film */}
      {featured && <HeroSection film={featured} />}

      {/* Welcome / CTA Section */}
      <WelcomeSection />

      {/* Content Sections */}
      <div className="mx-auto max-w-7xl space-y-16 px-4 py-12">
        {/* Trending This Week */}
        <FilmSection
          title="Trending This Week"
          icon={<TrendingUp className="text-letterboxd-orange h-5 w-5" />}
          films={trending?.results.slice(1, 11)}
          linkTo="/films"
          linkText="View all trending"
        />

        {/* Film Strip Divider */}
        <FilmStrip films={popular?.results} height="sm" />

        {/* Popular Films */}
        <FilmSection
          title="Popular Films"
          icon={<Sparkles className="text-letterboxd-green h-5 w-5" />}
          films={popular?.results.slice(0, 10)}
          linkTo="/films"
          linkText="Browse all films"
        />

        {/* Top Rated */}
        <FilmSection
          title="Top Rated"
          icon={<Star className="h-5 w-5 text-yellow-500" />}
          films={topRated?.results.slice(0, 10)}
          linkTo="/films"
          linkText="See top rated"
        />

        {/* Now Playing */}
        <FilmSection
          title="In Theaters Now"
          icon={<Clock className="text-letterboxd-blue h-5 w-5" />}
          films={nowPlaying?.results.slice(0, 10)}
          linkTo="/films"
          linkText="What's playing"
        />
      </div>

      {/* Bottom CTA */}
      <BottomCTA />
    </div>
  );
}

function HeroSection({ film }: { film: TMDbMovie }) {
  return (
    <section className="relative h-[75vh] min-h-[550px] overflow-hidden">
      {/* Backdrop Image */}
      <div className="absolute inset-0">
        <img
          src={getImageUrl(film.backdrop_path, 'backdrop', 'large')}
          alt=""
          className="h-full w-full object-cover object-top"
        />
        {/* Gradient overlays */}
        <div className="from-bg-primary via-bg-primary/70 absolute inset-0 bg-gradient-to-r to-transparent" />
        <div className="from-bg-primary to-bg-primary/40 absolute inset-0 bg-gradient-to-t via-transparent" />
      </div>

      {/* Content */}
      <div className="relative mx-auto flex h-full max-w-7xl items-end px-4 pb-16">
        <div className="flex flex-col items-end gap-8 md:flex-row">
          {/* Poster */}
          <Link
            to="/film/$id"
            params={{ id: String(film.id) }}
            className="group hidden shrink-0 md:block"
          >
            <img
              src={getImageUrl(film.poster_path, 'poster', 'medium')}
              alt={film.title}
              className="w-52 rounded-lg shadow-2xl transition-transform duration-300 group-hover:scale-105"
            />
          </Link>

          {/* Info */}
          <div className="max-w-2xl pb-4">
            <p className="text-letterboxd-green mb-3 text-sm font-semibold uppercase tracking-wider">
              Featured Film
            </p>
            <Link to="/film/$id" params={{ id: String(film.id) }} className="group">
              <h1 className="font-display group-hover:text-letterboxd-green text-4xl font-bold leading-tight text-white transition-colors md:text-5xl lg:text-6xl">
                {film.title}
              </h1>
            </Link>
            <p className="text-text-secondary mt-3 text-xl">
              {new Date(film.release_date).getFullYear()}
            </p>

            {/* Rating */}
            <div className="mt-5 flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Star className="text-letterboxd-green fill-letterboxd-green h-6 w-6" />
                <span className="text-2xl font-bold text-white">
                  {film.vote_average.toFixed(1)}
                </span>
                <span className="text-text-tertiary text-lg">/ 10</span>
              </div>
              <StarRatingDisplay rating={film.vote_average / 2} size="md" />
            </div>

            {/* Overview */}
            <p className="text-text-secondary mt-5 line-clamp-3 text-lg leading-relaxed">
              {film.overview}
            </p>

            {/* CTA */}
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                to="/film/$id"
                params={{ id: String(film.id) }}
                className="btn-primary px-6 py-3 text-base"
              >
                View Details
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
              <button className="btn-secondary px-6 py-3 text-base">Add to Watchlist</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function WelcomeSection() {
  return (
    <section className="from-bg-primary to-bg-secondary bg-gradient-to-b py-16">
      <div className="mx-auto max-w-4xl px-4 text-center">
        <div className="mb-6 flex justify-center gap-4">
          <div className="bg-letterboxd-green/20 flex h-14 w-14 items-center justify-center rounded-full">
            <Film className="text-letterboxd-green h-7 w-7" />
          </div>
          <div className="bg-letterboxd-orange/20 flex h-14 w-14 items-center justify-center rounded-full">
            <Star className="text-letterboxd-orange h-7 w-7" />
          </div>
          <div className="bg-letterboxd-blue/20 flex h-14 w-14 items-center justify-center rounded-full">
            <Users className="text-letterboxd-blue h-7 w-7" />
          </div>
        </div>
        <h2 className="font-display text-text-primary mb-4 text-3xl font-bold md:text-4xl">
          Track films you&apos;ve watched.
          <br />
          <span className="text-letterboxd-green">Tell your friends what&apos;s good.</span>
        </h2>
        <p className="text-text-secondary mx-auto max-w-2xl text-lg">
          The social network for film lovers. Rate, review, and discover your next favorite movie
          with friends.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link to="/profil" className="btn-primary px-8 py-3 text-base">
            Get Started — It&apos;s Free
          </Link>
          <Link to="/films" className="btn-ghost px-8 py-3 text-base">
            Browse Films
          </Link>
        </div>
      </div>
    </section>
  );
}

function FilmSection({
  title,
  icon,
  films,
  linkTo,
  linkText,
}: {
  title: string;
  icon: React.ReactNode;
  films?: TMDbMovie[];
  linkTo: string;
  linkText?: string;
}) {
  if (!films?.length) return null;

  return (
    <section>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {icon}
          <h2 className="font-display text-text-primary text-xl font-bold">{title}</h2>
        </div>
        <Link
          to={linkTo}
          className="text-text-secondary hover:text-letterboxd-green group flex items-center gap-1 text-sm font-medium transition-colors"
        >
          {linkText || 'View all'}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {/* Film Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {films.map((film, index) => (
          <FilmPoster key={film.id} film={film} priority={index < 5} />
        ))}
      </div>
    </section>
  );
}

function BottomCTA() {
  return (
    <section className="bg-bg-secondary border-border border-t py-20">
      <div className="mx-auto max-w-4xl px-4 text-center">
        <h2 className="font-display text-text-primary mb-4 text-3xl font-bold">
          Ready to start your film journey?
        </h2>
        <p className="text-text-secondary mx-auto mb-8 max-w-lg">
          Join CinéConnect today and connect with a community of film enthusiasts.
        </p>
        <Link to="/profil" className="btn-primary px-10 py-4 text-lg">
          Create Your Free Account
        </Link>
      </div>
    </section>
  );
}
