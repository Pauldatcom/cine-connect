import { PASSWORD_MIN_LENGTH } from '@cine-connect/shared';
import { resetPassword } from '@/lib/api/auth';
import { apiErrorMessageFromResponse } from '@/lib/api/client';
import { createFileRoute, Link, useSearch } from '@tanstack/react-router';
import { AlertCircle, Film, Loader2 } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { z } from 'zod';

const searchSchema = z.object({
  token: z.string().optional(),
  reason: z.enum(['invalid']).optional(),
});

export const Route = createFileRoute('/reset-password')({
  component: ResetPasswordPage,
  validateSearch: searchSchema,
});

export function ResetPasswordPage() {
  const { token: tokenFromUrl, reason } = useSearch({ from: '/reset-password' });
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (reason === 'invalid') {
      setError('This reset link is invalid or has expired. Request a new one below.');
    }
  }, [reason]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (password.length < PASSWORD_MIN_LENGTH) {
      setError(`Password must be at least ${PASSWORD_MIN_LENGTH} characters`);
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }

    const token = tokenFromUrl?.trim();
    setIsLoading(true);
    try {
      const { message } = await resetPassword({
        newPassword: password,
        ...(token ? { token } : {}),
      });
      setSuccessMessage(message);
      setPassword('');
      setConfirm('');
    } catch (err) {
      setError(
        apiErrorMessageFromResponse(
          err,
          'Reset failed. The link may have expired — request a new one.'
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="card animate-scale-in">
        <div className="text-center">
          <div className="bg-letterboxd-green/20 mx-auto flex h-16 w-16 items-center justify-center rounded-full">
            <Film className="text-letterboxd-green h-8 w-8" />
          </div>
          <h1 className="font-display text-text-primary mt-4 text-2xl font-bold">New password</h1>
          <p className="text-text-secondary mt-2 text-sm">
            Choose a strong password for your account.
          </p>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-500/10 p-3 text-red-400">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {successMessage && (
          <div className="bg-letterboxd-green/10 text-text-primary mt-4 rounded-lg p-3 text-sm">
            {successMessage}{' '}
            <Link
              to="/profil"
              search={{ mode: 'login' }}
              className="text-letterboxd-green font-medium underline"
            >
              Sign in
            </Link>
          </div>
        )}

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="password"
              className="text-text-secondary mb-1 block text-sm font-medium"
            >
              New password
            </label>
            <input
              type="password"
              id="password"
              placeholder="••••••••"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading || !!successMessage}
              required
              minLength={PASSWORD_MIN_LENGTH}
            />
          </div>
          <div>
            <label
              htmlFor="confirmPassword"
              className="text-text-secondary mb-1 block text-sm font-medium"
            >
              Confirm password
            </label>
            <input
              type="password"
              id="confirmPassword"
              placeholder="••••••••"
              className="input"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              disabled={isLoading || !!successMessage}
              required
              minLength={PASSWORD_MIN_LENGTH}
            />
          </div>
          <button
            type="submit"
            className="btn-primary w-full"
            disabled={isLoading || !!successMessage}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Updating…
              </span>
            ) : (
              'Update password'
            )}
          </button>
        </form>

        <p className="text-text-secondary mt-6 text-center text-sm">
          <Link to="/forgot-password" className="text-letterboxd-green hover:underline">
            Request a new link
          </Link>
        </p>
      </div>
    </div>
  );
}
