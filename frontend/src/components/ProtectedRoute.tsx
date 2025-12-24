/**
 * Protected Route - Redirects to login if not authenticated
 */

import { useNavigate } from '@tanstack/react-router';
import { useEffect, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Wrapper component that protects routes from unauthenticated access
 * Redirects to /profil (login page) if user is not authenticated
 */
export function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate({ to: '/profil' });
    }
  }, [isLoading, isAuthenticated, navigate]);

  // Show loading state while checking auth
  if (isLoading) {
    return (
      fallback || (
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="text-letterboxd-green h-8 w-8 animate-spin" />
        </div>
      )
    );
  }

  // Don't render children if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}

export default ProtectedRoute;
