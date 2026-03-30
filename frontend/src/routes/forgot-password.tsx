import { requestPasswordReset } from '@/lib/api/auth';
import { apiErrorMessageFromResponse } from '@/lib/api/client';
import { createFileRoute, Link } from '@tanstack/react-router';
import { AlertCircle, Film, Loader2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';

export const Route = createFileRoute('/forgot-password')({
  component: ForgotPasswordPage,
});

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [doneMessage, setDoneMessage] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setDoneMessage(null);
    setIsLoading(true);
    try {
      const clean = email.trim().toLowerCase();
      const { message } = await requestPasswordReset(clean);
      setDoneMessage(message);
    } catch (err) {
      setError(apiErrorMessageFromResponse(err, 'Something went wrong. Please try again.'));
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
          <h1 className="font-display text-text-primary mt-4 text-2xl font-bold">
            Forgot password
          </h1>
          <p className="text-text-secondary mt-2 text-sm">
            Enter your email and we will send you a reset link if an account exists.
          </p>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-500/10 p-3 text-red-400">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {doneMessage && (
          <div className="bg-letterboxd-green/10 text-text-primary mt-4 rounded-lg p-3 text-sm">
            {doneMessage}
          </div>
        )}

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="text-text-secondary mb-1 block text-sm font-medium">
              Email
            </label>
            <input
              type="email"
              id="email"
              placeholder="you@example.com"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>
          <button type="submit" className="btn-primary w-full" disabled={isLoading}>
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending…
              </span>
            ) : (
              'Send reset link'
            )}
          </button>
        </form>

        <p className="text-text-secondary mt-6 text-center text-sm">
          <Link
            to="/profil"
            search={{ mode: 'login' }}
            className="text-letterboxd-green hover:underline"
          >
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
