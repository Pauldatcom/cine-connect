import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router';
import { useEffect } from 'react';
import { tokenStorage } from '@/lib/api/client';
import { getCurrentUser } from '@/lib/api/auth';
import { Loader2 } from 'lucide-react';

export const Route = createFileRoute('/auth/callback')({
  component: RouteComponent,
  validateSearch: (search: Record<string, unknown>): { token?: string } => ({
    token: typeof search.token === 'string' ? search.token : undefined,
  }),
});

function RouteComponent() {
  const { token } = useSearch({ from: '/auth/callback' });
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      void navigate({ to: '/profil', search: { mode: 'login' } });
      return;
    }

    tokenStorage.setAccessToken(token);

    getCurrentUser()
      .then(() => navigate({ to: '/' }))
      .catch(() => {
        tokenStorage.clearTokens();
        navigate({ to: '/profil', search: { mode: 'login' } });
      });
  }, [token, navigate]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Loader2 className="text-letterboxd-green h-8 w-8 animate-spin" />
    </div>
  );
}
