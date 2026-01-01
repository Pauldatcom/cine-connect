import { createFileRoute, useSearch } from '@tanstack/react-router';
import {
  User,
  Mail,
  Film,
  Star,
  Settings,
  LogOut,
  Eye,
  Heart,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useState, useEffect, type FormEvent } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { z } from 'zod';

// Search params schema
const searchSchema = z.object({
  mode: z.enum(['login', 'register']).optional().catch('login'),
});

/**
 * User profile / Authentication page
 */
export const Route = createFileRoute('/profil')({
  component: ProfilPage,
  validateSearch: searchSchema,
});

function ProfilPage() {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading spinner while checking auth
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

  return <ProfileView />;
}

function AuthForm() {
  const { mode: initialMode } = useSearch({ from: '/profil' });
  const [mode, setMode] = useState<'login' | 'register'>(initialMode || 'login');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [validationError, setValidationError] = useState<string | null>(null);

  const { login, register, isLoading, error, clearError } = useAuth();

  // Sync with URL when it changes
  useEffect(() => {
    if (initialMode) {
      setMode(initialMode);
    }
  }, [initialMode]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    clearError();

    // Validation
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
      // Error is handled by auth context
    }
  };

  const handleInputChange =
    (field: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }));
      setValidationError(null);
    };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
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
            {mode === 'login' ? 'Welcome Back' : 'Join CineConnect'}
          </h1>
          <p className="text-text-secondary mt-2 text-sm">
            {mode === 'login'
              ? 'Sign in to track films and chat with friends'
              : 'Create an account to start your film journey'}
          </p>
        </div>

        {/* Error Message */}
        {displayError && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-500/10 p-3 text-red-400">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm">{displayError}</p>
          </div>
        )}

        {/* Form */}
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

        {/* Toggle */}
        <div className="mt-6 text-center">
          <p className="text-text-secondary text-sm">
            {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
          </p>
          <button
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

  if (!user) return null;

  const memberSince = new Date(user.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Profile Header */}
      <div className="card">
        <div className="flex flex-col items-center gap-6 sm:flex-row">
          <div className="bg-letterboxd-green/20 flex h-24 w-24 items-center justify-center rounded-full">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.username}
                className="h-24 w-24 rounded-full object-cover"
              />
            ) : (
              <User className="text-letterboxd-green h-12 w-12" />
            )}
          </div>
          <div className="text-center sm:text-left">
            <h1 className="font-display text-text-primary text-2xl font-bold">{user.username}</h1>
            <p className="text-text-secondary flex items-center justify-center gap-2 sm:justify-start">
              <Mail className="h-4 w-4" />
              {user.email}
            </p>
            <p className="text-text-tertiary mt-1 text-sm">Member since {memberSince}</p>
          </div>
          <div className="sm:ml-auto">
            <button className="btn-secondary">
              <Settings className="h-4 w-4" />
              Edit Profile
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        <StatCard icon={<Film className="h-5 w-5" />} label="Films" value="0" color="green" />
        <StatCard icon={<Eye className="h-5 w-5" />} label="This Year" value="0" color="blue" />
        <StatCard icon={<Heart className="h-5 w-5" />} label="Liked" value="0" color="orange" />
        <StatCard icon={<Star className="h-5 w-5" />} label="Reviews" value="0" color="green" />
      </div>

      {/* Recent Activity */}
      <div className="card mt-6">
        <h2 className="section-header mb-4">Recent Activity</h2>
        <div className="text-text-tertiary py-8 text-center">
          Your recent film activity will appear here
        </div>
      </div>

      {/* Favorite Films */}
      <div className="card mt-6">
        <h2 className="section-header mb-4">Favorite Films</h2>
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="aspect-poster bg-bg-tertiary rounded" />
          ))}
        </div>
        <p className="text-text-tertiary mt-4 text-center text-sm">Add your four favorite films</p>
      </div>

      {/* Logout */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={logout}
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
