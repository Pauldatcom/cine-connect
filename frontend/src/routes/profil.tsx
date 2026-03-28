import { useAuth } from '@/contexts/AuthContext';
import { apiV1AbsoluteUrl } from '@/lib/api/client';
import type { PendingRequest } from '@/hooks';
import {
  useFriends,
  usePendingFriendRequests,
  useRespondToFriendRequest,
  useRemoveFriend,
  useUserReviews,
  useWatchlist,
} from '@/hooks';
import type { FriendWithUser } from '@/lib/api/friends';
import { createFileRoute, Link, useSearch } from '@tanstack/react-router';
import {
  AlertCircle,
  Eye,
  Film,
  Loader2,
  LogOut,
  Mail,
  Settings,
  Star,
  UserMinus,
  UserPlus,
  Users,
} from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';

type SearchMode = 'login' | 'register';

/**
 * User profile / Authentication page
 */
export const Route = createFileRoute('/profil')({
  component: ProfilPage,
  validateSearch: (search: Record<string, unknown>): { mode?: SearchMode } => ({
    mode: search.mode === 'register' ? 'register' : search.mode === 'login' ? 'login' : undefined,
  }),
});

function Avatar({
  avatarUrl,
  username,
  size = 'lg',
}: {
  avatarUrl?: string | null;
  username: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const [hasError, setHasError] = useState(false);

  const sizeClasses = {
    sm: 'h-10 w-10 text-sm',
    md: 'h-12 w-12 text-base',
    lg: 'h-24 w-24 text-2xl',
  };

  if (!avatarUrl || hasError) {
    return (
      <div
        className={`bg-letterboxd-green/20 text-letterboxd-green flex items-center justify-center rounded-full font-bold ${sizeClasses[size]}`}
        aria-label={username}
      >
        {username.charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    <img
      src={avatarUrl}
      alt={username}
      className={`${sizeClasses[size]} rounded-full object-cover`}
      onError={() => setHasError(true)}
      referrerPolicy="no-referrer"
    />
  );
}

/** Profile page component – exported for tests */
export function ProfilPage() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="text-letterboxd-green h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthForm />;
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <div className="card text-center">
          <p className="text-text-secondary">Your profile could not be loaded.</p>
          <p className="text-text-tertiary mt-2 text-sm">Please sign in again.</p>
          <Link to="/" className="btn-primary mt-6 inline-block">
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  return <ProfileView />;
}

function AuthForm() {
  const search = useSearch({ from: '/profil' });
  const initialMode: SearchMode = search.mode ?? 'login';

  const [mode, setMode] = useState<SearchMode>(initialMode);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [validationError, setValidationError] = useState<string | null>(null);

  const { login, register, isLoading, error, clearError } = useAuth();

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    clearError();

    if (mode === 'register') {
      if (formData.password !== formData.confirmPassword) {
        setValidationError('Passwords do not match');
        return;
      }
      if (formData.password.length < 8) {
        setValidationError('Password must be at least 8 characters');
        return;
      }
      if (formData.username.length < 3) {
        setValidationError('Username must be at least 3 characters');
        return;
      }
    }

    try {
      if (mode === 'login') {
        await login({ email: formData.email, password: formData.password });
      } else {
        await register({
          email: formData.email,
          username: formData.username,
          password: formData.password,
        });
      }
    } catch {
      // handled by auth context
    }
  };

  const handleInputChange =
    (field: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }));
      setValidationError(null);
    };

  const toggleMode = () => {
    setMode((prev) => (prev === 'login' ? 'register' : 'login'));
    setValidationError(null);
    clearError();
  };

  const displayError = validationError || error;

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="card animate-scale-in">
        <div className="text-center">
          <div className="bg-letterboxd-green/20 mx-auto flex h-16 w-16 items-center justify-center rounded-full">
            <Film className="text-letterboxd-green h-8 w-8" />
          </div>
          <h1 className="font-display text-text-primary mt-4 text-2xl font-bold">
            {mode === 'login' ? 'Welcome Back' : 'Join CinéConnect'}
          </h1>
          <p className="text-text-secondary mt-2 text-sm">
            {mode === 'login'
              ? 'Sign in to track films and chat with friends'
              : 'Create an account to start your film journey'}
          </p>
        </div>

        {displayError && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-500/10 p-3 text-red-400">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm">{displayError}</p>
          </div>
        )}

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div>
              <label
                htmlFor="username"
                className="text-text-secondary mb-1 block text-sm font-medium"
              >
                Username
              </label>
              <input
                type="text"
                id="username"
                placeholder="filmfan42"
                className="input"
                value={formData.username}
                onChange={handleInputChange('username')}
                disabled={isLoading}
                required
              />
            </div>
          )}

          <div>
            <label htmlFor="email" className="text-text-secondary mb-1 block text-sm font-medium">
              Email
            </label>
            <input
              type="email"
              id="email"
              placeholder="you@example.com"
              className="input"
              value={formData.email}
              onChange={handleInputChange('email')}
              disabled={isLoading}
              required
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="text-text-secondary mb-1 block text-sm font-medium"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              placeholder="••••••••"
              className="input"
              value={formData.password}
              onChange={handleInputChange('password')}
              disabled={isLoading}
              required
            />
          </div>

          {mode === 'register' && (
            <div>
              <label
                htmlFor="confirmPassword"
                className="text-text-secondary mb-1 block text-sm font-medium"
              >
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                placeholder="••••••••"
                className="input"
                value={formData.confirmPassword}
                onChange={handleInputChange('confirmPassword')}
                disabled={isLoading}
                required
              />
            </div>
          )}

          <button type="submit" className="btn-primary w-full" disabled={isLoading}>
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {mode === 'login' ? 'Signing In...' : 'Creating Account...'}
              </span>
            ) : mode === 'login' ? (
              'Sign In'
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="mt-4">
          <div className="text-text-tertiary mb-4 text-center text-sm">or</div>

          <button
            type="button"
            onClick={() => {
              window.location.href = apiV1AbsoluteUrl('/auth/google');
            }}
            className="btn-secondary w-full"
            disabled={isLoading}
          >
            Continue with Google
          </button>
        </div>

        <div className="mt-6 text-center">
          <p className="text-text-secondary text-sm">
            {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
          </p>
          <button
            type="button"
            onClick={toggleMode}
            className="text-letterboxd-green hover:text-letterboxd-green-dark mt-2 text-sm font-medium transition-colors"
            disabled={isLoading}
          >
            {mode === 'login' ? 'Create Account' : 'Sign In'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ProfileView() {
  const { user, logout } = useAuth();

  const { data: userReviews, isLoading: reviewsLoading } = useUserReviews(user?.id);
  const { data: watchlistData, isLoading: watchlistLoading } = useWatchlist();
  const { data: friendsList, isLoading: friendsLoading, isError: friendsError } = useFriends();
  const { data: pendingRequests, isError: pendingError } = usePendingFriendRequests();
  const respondToRequest = useRespondToFriendRequest();
  const removeFriendMutation = useRemoveFriend();

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <div className="card text-center">
          <p className="text-text-secondary">Profile unavailable.</p>
          <Link to="/" className="btn-primary mt-4 inline-block">
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  const memberSince = new Date(user.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const reviewsCount = userReviews?.length ?? 0;
  const watchlistCount = watchlistData?.count ?? 0;
  const friendsCount = friendsList?.length ?? 0;
  const isStatsLoading = reviewsLoading || watchlistLoading;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="card">
        <div className="flex flex-col items-center gap-6 sm:flex-row">
          <Avatar avatarUrl={user.avatarUrl} username={user.username} size="lg" />

          <div className="text-center sm:text-left">
            <h1 className="font-display text-text-primary text-2xl font-bold">{user.username}</h1>
            <p className="text-text-secondary flex items-center justify-center gap-2 sm:justify-start">
              <Mail className="h-4 w-4" />
              {user.email}
            </p>
            <p className="text-text-tertiary mt-1 text-sm">Member since {memberSince}</p>
          </div>

          <div className="sm:ml-auto">
            <Link to="/settings" className="btn-secondary inline-flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        <StatCard
          icon={<Film className="h-5 w-5" />}
          label="Watchlist"
          value={isStatsLoading ? '...' : String(watchlistCount)}
          color="green"
        />
        <StatCard
          icon={<Users className="h-5 w-5" />}
          label="Friends"
          value={friendsLoading ? '...' : String(friendsCount)}
          color="blue"
        />
        <StatCard icon={<Eye className="h-5 w-5" />} label="This Year" value="0" color="blue" />
        <StatCard
          icon={<Star className="h-5 w-5" />}
          label="Reviews"
          value={isStatsLoading ? '...' : String(reviewsCount)}
          color="green"
        />
      </div>

      <div className="card mt-6" data-testid="profile-friends">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="section-header mb-0">Friends</h2>
          <Link
            to="/members"
            className="text-letterboxd-green hover:text-letterboxd-green-dark text-sm font-medium"
          >
            Find members
          </Link>
        </div>

        {friendsError || pendingError ? (
          <p className="text-text-tertiary py-4 text-center text-sm">
            Could not load friends. Check your connection and try again.
          </p>
        ) : friendsLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="text-letterboxd-green h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {pendingRequests && pendingRequests.length > 0 && (
              <div>
                <h3 className="text-text-secondary mb-2 text-sm font-medium">Pending requests</h3>
                <ul className="space-y-2">
                  {pendingRequests.map((req: PendingRequest) => (
                    <li
                      key={req.id}
                      className="bg-bg-tertiary flex items-center justify-between gap-3 rounded-lg p-3"
                    >
                      <Link
                        to="/user/$id"
                        params={{ id: req.user.id }}
                        className="flex min-w-0 flex-1 items-center gap-3"
                      >
                        <Avatar
                          avatarUrl={req.user.avatarUrl}
                          username={req.user.username}
                          size="sm"
                        />
                        <span className="text-text-primary truncate font-medium">
                          {req.user.username}
                        </span>
                      </Link>

                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            respondToRequest.mutate({ requestId: req.id, accept: true })
                          }
                          disabled={respondToRequest.isPending}
                          className="btn-primary flex items-center gap-1 px-3 py-1.5 text-sm"
                          aria-label="Accept request"
                        >
                          <UserPlus className="h-4 w-4" />
                          Accept
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            respondToRequest.mutate({ requestId: req.id, accept: false })
                          }
                          disabled={respondToRequest.isPending}
                          className="btn-ghost text-red-400 hover:bg-red-500/10"
                          aria-label="Decline request"
                        >
                          Decline
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <h3 className="text-text-secondary mb-2 text-sm font-medium">
                Your friends ({friendsList?.length ?? 0})
              </h3>

              {friendsList && friendsList.length > 0 ? (
                <ul className="space-y-2">
                  {friendsList.map((f: FriendWithUser) => (
                    <li
                      key={f.id}
                      className="bg-bg-tertiary flex items-center justify-between gap-3 rounded-lg p-3"
                    >
                      <Link
                        to="/user/$id"
                        params={{ id: f.user.id }}
                        className="flex min-w-0 flex-1 items-center gap-3"
                      >
                        <Avatar avatarUrl={f.user.avatarUrl} username={f.user.username} size="sm" />
                        <span className="text-text-primary truncate font-medium">
                          {f.user.username}
                        </span>
                      </Link>

                      <button
                        type="button"
                        onClick={() => removeFriendMutation.mutate(f.id)}
                        disabled={removeFriendMutation.isPending}
                        className="btn-ghost shrink-0 p-2 text-red-400 hover:bg-red-500/10"
                        aria-label={`Remove ${f.user.username} from friends`}
                        title="Remove friend"
                      >
                        <UserMinus className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-text-tertiary py-4 text-center text-sm">
                  No friends yet.{' '}
                  <Link to="/members" className="text-letterboxd-green hover:underline">
                    Find members
                  </Link>{' '}
                  to add.
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="card mt-6">
        <h2 className="section-header mb-4">Recent Reviews</h2>
        {reviewsLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="text-letterboxd-green h-6 w-6 animate-spin" />
          </div>
        ) : userReviews && userReviews.length > 0 ? (
          <div className="space-y-4">
            {userReviews.slice(0, 3).map((review) => {
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

              return (filmTmdbId ?? null) !== null ? (
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
          </div>
        ) : (
          <div className="text-text-tertiary py-8 text-center">
            You haven&apos;t written any reviews yet
          </div>
        )}
      </div>

      <div className="card mt-6" data-testid="profile-watchlist">
        <h2 className="section-header mb-4">Your Watchlist</h2>
        {watchlistLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="text-letterboxd-green h-6 w-6 animate-spin" />
          </div>
        ) : watchlistData && watchlistData.items.length > 0 ? (
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
            {watchlistData.items.slice(0, 6).map((item) => (
              <Link
                key={item.id}
                to="/film/$id"
                params={{ id: String(item.film.tmdbId) }}
                className="aspect-poster bg-bg-tertiary block overflow-hidden rounded transition-opacity hover:opacity-90"
                data-testid="profile-watchlist-item"
                title={item.film.title}
              >
                {item.film.poster ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w200${item.film.poster}`}
                    alt={item.film.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="text-text-tertiary flex h-full items-center justify-center text-xs">
                    {item.film.title}
                  </div>
                )}
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-text-tertiary py-8 text-center">
            Your watchlist is empty. Add some films!
          </div>
        )}
      </div>

      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={() => {
            void logout();
          }}
          className="btn-ghost text-red-400 hover:bg-red-500/10 hover:text-red-400"
          data-testid="sign-out-button"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: 'green' | 'blue' | 'orange';
}) {
  const colorClasses = {
    green: 'text-letterboxd-green bg-letterboxd-green/20',
    blue: 'text-letterboxd-blue bg-letterboxd-blue/20',
    orange: 'text-letterboxd-orange bg-letterboxd-orange/20',
  };

  return (
    <div className="card flex items-center gap-4">
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-lg ${colorClasses[color]}`}
      >
        {icon}
      </div>
      <div>
        <p className="text-text-primary text-2xl font-bold">{value}</p>
        <p className="text-text-tertiary text-sm">{label}</p>
      </div>
    </div>
  );
}
