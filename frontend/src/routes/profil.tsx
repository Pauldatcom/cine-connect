import { createFileRoute } from '@tanstack/react-router';
import { User, Mail, Film, Star, Settings, LogOut, Eye, Heart } from 'lucide-react';
import { useState } from 'react';

/**
 * User profile / Authentication page
 */
export const Route = createFileRoute('/profil')({
  component: ProfilPage,
});

function ProfilPage() {
  // TODO: Replace with actual auth state
  const isAuthenticated = false;

  if (!isAuthenticated) {
    return <AuthForm />;
  }

  return <ProfileView />;
}

function AuthForm() {
  const [mode, setMode] = useState<'login' | 'register'>('login');

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

        {/* Form */}
        <form className="mt-8 space-y-4">
          {mode === 'register' && (
            <div>
              <label
                htmlFor="username"
                className="text-text-secondary mb-1 block text-sm font-medium"
              >
                Username
              </label>
              <input type="text" id="username" placeholder="filmfan42" className="input" />
            </div>
          )}
          <div>
            <label htmlFor="email" className="text-text-secondary mb-1 block text-sm font-medium">
              Email
            </label>
            <input type="email" id="email" placeholder="you@example.com" className="input" />
          </div>
          <div>
            <label
              htmlFor="password"
              className="text-text-secondary mb-1 block text-sm font-medium"
            >
              Password
            </label>
            <input type="password" id="password" placeholder="••••••••" className="input" />
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
              />
            </div>
          )}
          <button type="submit" className="btn-primary w-full">
            {mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        {/* Toggle */}
        <div className="mt-6 text-center">
          <p className="text-text-secondary text-sm">
            {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
          </p>
          <button
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            className="text-letterboxd-green hover:text-letterboxd-green-dark mt-2 text-sm font-medium transition-colors"
          >
            {mode === 'login' ? 'Create Account' : 'Sign In'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ProfileView() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Profile Header */}
      <div className="card">
        <div className="flex flex-col items-center gap-6 sm:flex-row">
          <div className="bg-letterboxd-green/20 flex h-24 w-24 items-center justify-center rounded-full">
            <User className="text-letterboxd-green h-12 w-12" />
          </div>
          <div className="text-center sm:text-left">
            <h1 className="font-display text-text-primary text-2xl font-bold">FilmFan42</h1>
            <p className="text-text-secondary flex items-center justify-center gap-2 sm:justify-start">
              <Mail className="h-4 w-4" />
              filmfan@example.com
            </p>
            <p className="text-text-tertiary mt-1 text-sm">Member since January 2024</p>
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
        <StatCard icon={<Film className="h-5 w-5" />} label="Films" value="142" color="green" />
        <StatCard icon={<Eye className="h-5 w-5" />} label="This Year" value="48" color="blue" />
        <StatCard icon={<Heart className="h-5 w-5" />} label="Liked" value="89" color="orange" />
        <StatCard icon={<Star className="h-5 w-5" />} label="Reviews" value="34" color="green" />
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
        <button className="btn-ghost text-red-400 hover:bg-red-500/10 hover:text-red-400">
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
