import { createFileRoute, Link } from '@tanstack/react-router';
import { Film, Users, Star, Github } from 'lucide-react';

export const Route = createFileRoute('/about')({
  component: AboutPage,
});

export function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      {/* Hero */}
      <div className="mb-16 text-center">
        <div className="bg-letterboxd-green/20 mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full">
          <Film className="text-letterboxd-green h-10 w-10" />
        </div>
        <h1 className="font-display text-text-primary text-4xl font-bold">About CinéConnect</h1>
        <p className="text-text-secondary mx-auto mt-4 max-w-xl text-lg">
          A student project born from a passion for cinema — track films, share opinions, and
          connect with fellow film lovers.
        </p>
      </div>

      {/* What is CinéConnect */}
      <section className="card mb-8">
        <h2 className="text-text-primary mb-4 text-2xl font-bold">What is CinéConnect?</h2>
        <p className="text-text-secondary leading-relaxed">
          CinéConnect is a social platform for cinema enthusiasts. You can browse thousands of
          films, build your watchlist, write reviews, rate movies, and discover what your friends
          are watching. Think of it as a social diary for your film life.
        </p>
        <p className="text-text-secondary mt-4 leading-relaxed">
          The project was built as part of our computer science studies, combining a modern React
          frontend with a Node.js/TypeScript backend. Film data is powered by the{' '}
          <a
            href="https://www.omdbapi.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-letterboxd-green hover:underline"
          >
            OMDB API
          </a>{' '}
          and{' '}
          <a
            href="https://www.themoviedb.org"
            target="_blank"
            rel="noopener noreferrer"
            className="text-letterboxd-green hover:underline"
          >
            TMDb
          </a>
          .
        </p>
      </section>

      {/* Features */}
      <section className="mb-8 grid gap-4 sm:grid-cols-3">
        {[
          {
            icon: <Film className="text-letterboxd-green h-6 w-6" />,
            title: 'Track Films',
            desc: 'Add films to your watchlist and mark them as watched.',
          },
          {
            icon: <Star className="text-letterboxd-green h-6 w-6" />,
            title: 'Rate & Review',
            desc: 'Share your thoughts and discover what others think.',
          },
          {
            icon: <Users className="text-letterboxd-green h-6 w-6" />,
            title: 'Connect',
            desc: 'Follow friends and see their film activity in real time.',
          },
        ].map(({ icon, title, desc }) => (
          <div key={title} className="card flex flex-col items-center gap-3 text-center">
            <div className="bg-letterboxd-green/10 flex h-12 w-12 items-center justify-center rounded-full">
              {icon}
            </div>
            <h3 className="text-text-primary font-semibold">{title}</h3>
            <p className="text-text-secondary text-sm">{desc}</p>
          </div>
        ))}
      </section>

      {/* Team */}
      <section className="card mb-8">
        <h2 className="text-text-primary mb-6 text-2xl font-bold">The Team</h2>
        <div className="grid gap-6 sm:grid-cols-2">
          {[
            {
              name: 'Paul Compagnon',
              role: 'Developer',
              initial: 'P',
            },
            {
              name: 'Franck YAPI',
              role: 'Developer',
              initial: 'F',
            },
          ].map(({ name, role, initial }) => (
            <div key={name} className="bg-bg-tertiary flex items-center gap-4 rounded-lg p-4">
              <div className="bg-letterboxd-green/20 text-letterboxd-green flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-xl font-bold">
                {initial}
              </div>
              <div>
                <p className="text-text-primary font-semibold">{name}</p>
                <p className="text-text-secondary text-sm">{role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Tech stack */}
      <section className="card mb-8">
        <h2 className="text-text-primary mb-4 text-2xl font-bold">Tech Stack</h2>
        <div className="flex flex-wrap gap-2">
          {[
            'React',
            'TypeScript',
            'TanStack Router',
            'TanStack Query',
            'Tailwind CSS',
            'Node.js',
            'Express',
            'PostgreSQL',
            'Drizzle ORM',
            'OMDB API',
            'TMDb API',
          ].map((tech) => (
            <span
              key={tech}
              className="bg-bg-tertiary text-text-secondary rounded-full px-3 py-1 text-sm"
            >
              {tech}
            </span>
          ))}
        </div>
      </section>

      <div className="flex flex-wrap justify-center gap-4">
        <Link to="/" className="btn-primary">
          Start exploring
        </Link>
        <a
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary inline-flex items-center gap-2"
        >
          <Github className="h-4 w-4" />
          View on GitHub
        </a>
      </div>
    </div>
  );
}
