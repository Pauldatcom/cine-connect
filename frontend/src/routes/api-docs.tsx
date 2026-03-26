import { createFileRoute } from '@tanstack/react-router';
import { Code, ExternalLink } from 'lucide-react';

export const Route = createFileRoute('/api-docs')({
  component: ApiDocsPage,
});

const ENDPOINTS: { method: string; path: string; desc: string }[] = [
  { method: 'POST', path: '/api/v1/auth/register', desc: 'Register a new user account' },
  { method: 'POST', path: '/api/v1/auth/login', desc: 'Login with email and password' },
  { method: 'POST', path: '/api/v1/auth/logout', desc: 'Logout and clear session' },
  { method: 'POST', path: '/api/v1/auth/refresh', desc: 'Refresh the access token' },
  { method: 'GET', path: '/api/v1/auth/google', desc: 'Start Google OAuth flow' },
  { method: 'GET', path: '/api/v1/users/me', desc: 'Get the current user profile' },
  { method: 'PATCH', path: '/api/v1/users/me', desc: 'Update username or avatar URL' },
  { method: 'GET', path: '/api/v1/films', desc: 'List films in the database' },
  { method: 'GET', path: '/api/v1/films/:id', desc: 'Get a film by its TMDB ID' },
  { method: 'GET', path: '/api/v1/reviews', desc: 'List all reviews' },
  { method: 'POST', path: '/api/v1/reviews', desc: 'Create a review for a film' },
  { method: 'DELETE', path: '/api/v1/reviews/:id', desc: 'Delete a review' },
  { method: 'GET', path: '/api/v1/watchlist', desc: "Get the current user's watchlist" },
  { method: 'POST', path: '/api/v1/watchlist', desc: 'Add a film to the watchlist' },
  { method: 'DELETE', path: '/api/v1/watchlist/:id', desc: 'Remove a film from the watchlist' },
  { method: 'GET', path: '/api/v1/friends', desc: 'List friends of the current user' },
  { method: 'POST', path: '/api/v1/friends/request', desc: 'Send a friend request' },
  { method: 'POST', path: '/api/v1/friends/respond', desc: 'Accept or decline a friend request' },
  { method: 'DELETE', path: '/api/v1/friends/:id', desc: 'Remove a friend' },
];

const METHOD_COLORS: Record<string, string> = {
  GET: 'text-green-400 bg-green-400/10',
  POST: 'text-blue-400 bg-blue-400/10',
  PATCH: 'text-yellow-400 bg-yellow-400/10',
  DELETE: 'text-red-400 bg-red-400/10',
};

export function ApiDocsPage() {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
  const swaggerUrl = apiUrl.replace('/api/v1', '/api-docs');

  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <div className="mb-10 text-center">
        <div className="bg-letterboxd-green/20 mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full">
          <Code className="text-letterboxd-green h-8 w-8" />
        </div>
        <h1 className="font-display text-text-primary text-4xl font-bold">API Reference</h1>
        <p className="text-text-secondary mt-3">
          CinéConnect exposes a REST API used by the frontend. All endpoints require a valid JWT
          access token in the{' '}
          <code className="bg-bg-tertiary rounded px-1 text-sm">Authorization: Bearer</code> header
          unless noted otherwise.
        </p>
      </div>

      {/* Swagger link */}
      <div className="card mb-8 flex items-center justify-between gap-4">
        <div>
          <p className="text-text-primary font-semibold">Interactive documentation</p>
          <p className="text-text-secondary text-sm">
            The full Swagger / OpenAPI spec is available on the backend.
          </p>
        </div>
        <a
          href={swaggerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary inline-flex shrink-0 items-center gap-2"
        >
          Open Swagger
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>

      {/* Data sources */}
      <div className="card mb-8">
        <h2 className="text-text-primary mb-3 text-xl font-bold">External Data Sources</h2>
        <ul className="text-text-secondary space-y-2 text-sm">
          <li>
            <a
              href="https://www.omdbapi.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-letterboxd-green hover:underline"
            >
              OMDB API
            </a>{' '}
            — film metadata, ratings, and plot summaries.
          </li>
          <li>
            <a
              href="https://www.themoviedb.org/documentation/api"
              target="_blank"
              rel="noopener noreferrer"
              className="text-letterboxd-green hover:underline"
            >
              TMDb API
            </a>{' '}
            — posters, backdrops, cast, crew, and trending films.
          </li>
        </ul>
      </div>

      {/* Endpoint list */}
      <section className="card">
        <h2 className="text-text-primary mb-6 text-xl font-bold">Endpoints Overview</h2>
        <div className="space-y-2">
          {ENDPOINTS.map(({ method, path, desc }) => (
            <div
              key={method + path}
              className="bg-bg-tertiary flex flex-col gap-1 rounded-lg p-3 sm:flex-row sm:items-center sm:gap-4"
            >
              <span
                className={`w-16 shrink-0 rounded px-2 py-0.5 text-center text-xs font-bold ${METHOD_COLORS[method] ?? ''}`}
              >
                {method}
              </span>
              <code className="text-text-primary flex-1 text-sm">{path}</code>
              <span className="text-text-tertiary text-sm">{desc}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
