import { FilmPoster } from '@/components/features/FilmPoster';
import { usePerson, usePersonMovieCredits } from '@/hooks';
import type { TMDbPersonMovieCredits } from '@/lib/api/tmdb';
import { getImageUrl } from '@/lib/api/tmdb';
import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowLeft, Calendar, Film, MapPin, User } from 'lucide-react';
import { useMemo, useState } from 'react';

type CastFilm = TMDbPersonMovieCredits['cast'][number];
type CrewFilm = TMDbPersonMovieCredits['crew'][number];

/**
 * Person detail page - Shows biography and filmography
 */
export const Route = createFileRoute('/person/$id')({
  component: PersonDetailPage,
});

const CAST_PAGE_SIZE = 24;

export function PersonDetailPage() {
  const { id } = Route.useParams() as { id: string };
  const [castVisible, setCastVisible] = useState(CAST_PAGE_SIZE);

  // Fetch person details and credits
  const { data: person, isLoading, error } = usePerson(id);
  const { data: credits } = usePersonMovieCredits(id, !!person);

  // Filter films with posters and sort by popularity
  const castFilms = useMemo(() => {
    if (!credits?.cast) return [];
    return credits.cast
      .filter((f: CastFilm) => f.poster_path)
      .sort((a: CastFilm, b: CastFilm) => (b.popularity || 0) - (a.popularity || 0));
  }, [credits?.cast]);

  const crewFilms = useMemo(() => {
    if (!credits?.crew) return [];
    return credits.crew
      .filter((f: CrewFilm) => f.poster_path)
      .sort((a: CrewFilm, b: CrewFilm) => (b.popularity || 0) - (a.popularity || 0));
  }, [credits?.crew]);

  // Group crew by department
  const crewByDepartment = useMemo(() => {
    const grouped: Record<string, CrewFilm[]> = {};
    crewFilms.forEach((film: CrewFilm) => {
      if (!grouped[film.department]) {
        grouped[film.department] = [];
      }
      const arr = grouped[film.department];
      if (arr) arr.push(film);
    });
    return grouped;
  }, [crewFilms]);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="border-letterboxd-green h-10 w-10 animate-spin rounded-full border-2 border-t-transparent" />
      </div>
    );
  }

  if (error || !person) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <User className="text-text-tertiary mx-auto mb-4 h-16 w-16" />
        <h1 className="text-text-primary text-2xl font-bold">Person Not Found</h1>
        <p className="text-text-secondary mt-2">
          We couldn&apos;t find the person you&apos;re looking for.
        </p>
        <Link to="/films" className="btn-primary mt-6 inline-flex">
          <ArrowLeft className="h-4 w-4" />
          Back to Films
        </Link>
      </div>
    );
  }

  const birthYear = person.birthday ? new Date(person.birthday).getFullYear() : null;
  const deathYear = person.deathday ? new Date(person.deathday).getFullYear() : null;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="bg-bg-secondary border-border border-b">
        <div className="mx-auto max-w-7xl px-4 py-8">
          {/* Back Button */}
          <Link
            to="/films"
            className="text-text-secondary hover:text-text-primary mb-6 inline-flex items-center gap-2 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>

          <div className="flex flex-col gap-8 md:flex-row">
            {/* Profile Photo */}
            <div className="shrink-0">
              <div className="bg-bg-tertiary mx-auto h-48 w-48 overflow-hidden rounded-lg md:mx-0">
                {person.profile_path ? (
                  <img
                    src={getImageUrl(person.profile_path, 'profile', 'large')}
                    alt={person.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="text-text-tertiary flex h-full w-full items-center justify-center text-6xl font-bold">
                    {person.name[0]}
                  </div>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1">
              <h1 className="font-display text-text-primary text-3xl font-bold md:text-4xl">
                {person.name}
              </h1>

              {/* Known for */}
              {person.known_for_department && (
                <p className="text-text-secondary mt-2 flex items-center gap-2">
                  <Film className="h-4 w-4" />
                  Known for {person.known_for_department}
                </p>
              )}

              {/* Birth info */}
              <div className="text-text-secondary mt-4 flex flex-wrap gap-x-6 gap-y-2">
                {birthYear && (
                  <span className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {birthYear}
                    {deathYear && ` - ${deathYear}`}
                  </span>
                )}
                {person.place_of_birth && (
                  <span className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {person.place_of_birth}
                  </span>
                )}
              </div>

              {/* Biography */}
              {person.biography && (
                <div className="mt-6">
                  <h2 className="text-text-tertiary mb-2 text-sm font-semibold uppercase tracking-wider">
                    Biography
                  </h2>
                  <p className="text-text-secondary line-clamp-6 whitespace-pre-line leading-relaxed">
                    {person.biography}
                  </p>
                </div>
              )}

              {/* Also known as */}
              {person.also_known_as && person.also_known_as.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-text-tertiary mb-1 text-sm font-semibold uppercase tracking-wider">
                    Also Known As
                  </h3>
                  <p className="text-text-secondary text-sm">
                    {person.also_known_as.slice(0, 3).join(', ')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Filmography */}
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* As Actor */}
        {castFilms.length > 0 && (
          <section className="mb-12">
            <h2 className="section-header mb-6 flex items-center gap-2">
              <Film className="text-letterboxd-green h-5 w-5" />
              As Actor
              <span className="text-text-tertiary text-base font-normal">({castFilms.length})</span>
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {castFilms.slice(0, castVisible).map((film: CastFilm) => (
                <FilmPoster key={film.credit_id} film={film} showTitle />
              ))}
            </div>
            {castVisible < castFilms.length && (
              <div className="mt-6 text-center">
                <p className="text-text-tertiary mb-3 text-sm">
                  Showing {castVisible} of {castFilms.length} films
                </p>
                <button
                  className="btn-secondary"
                  onClick={() => setCastVisible((v) => v + CAST_PAGE_SIZE)}
                >
                  Show more
                </button>
              </div>
            )}
          </section>
        )}

        {/* As Crew */}
        {Object.keys(crewByDepartment).length > 0 && (
          <section>
            <h2 className="section-header mb-6 flex items-center gap-2">
              <Film className="text-letterboxd-blue h-5 w-5" />
              Behind the Camera
              <span className="text-text-tertiary text-base font-normal">({crewFilms.length})</span>
            </h2>
            <div className="space-y-8">
              {Object.entries(crewByDepartment)
                .sort(([, a], [, b]) => b.length - a.length)
                .slice(0, 5)
                .map(([department, films]) => (
                  <div key={department}>
                    <h3 className="text-text-primary mb-4 text-lg font-semibold">
                      {department}{' '}
                      <span className="text-text-tertiary text-sm font-normal">
                        ({films.length})
                      </span>
                    </h3>
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                      {films.slice(0, 12).map((film: CrewFilm) => (
                        <FilmPoster key={film.credit_id} film={film} showTitle />
                      ))}
                    </div>
                    {films.length > 12 && (
                      <p className="text-text-secondary mt-3 text-sm">
                        Showing 12 of {films.length} films
                      </p>
                    )}
                  </div>
                ))}
            </div>
          </section>
        )}

        {/* No credits */}
        {castFilms.length === 0 && crewFilms.length === 0 && (
          <div className="text-text-tertiary py-20 text-center">
            <Film className="mx-auto mb-4 h-12 w-12 opacity-50" />
            <p className="text-lg">No filmography available</p>
          </div>
        )}
      </div>
    </div>
  );
}
