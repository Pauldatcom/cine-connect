import { Footer } from '@/components/layout/Footer';
import { Navbar } from '@/components/layout/Navbar';
import { createRootRoute, Link, Outlet, useLocation } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';
import { useEffect } from 'react';

/**
 * 404 Not Found - Shown when no route matches
 */
function NotFoundComponent() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-16">
      <h1 className="font-display text-text-primary text-4xl font-bold">404</h1>
      <p className="text-text-secondary mt-2 text-lg">This page could not be found.</p>
      <Link
        to="/"
        className="text-letterboxd-green hover:text-letterboxd-green-dark mt-6 text-sm font-medium transition-colors"
      >
        Back to home
      </Link>
    </div>
  );
}

/**
 * Root layout - Letterboxd-inspired dark theme
 * Contains the main navigation and footer
 */
export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFoundComponent,
});

function RootLayout() {
  const location = useLocation();

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="bg-bg-primary flex min-h-screen flex-col">
      {/* Navigation */}
      <Navbar />

      {/* Main: min-h-0 so flex children (e.g. chat) can shrink — avoids full-page growth + footer jump */}
      <main className="min-h-0 flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <Footer />

      {/* Dev Tools (only in development) */}
      {import.meta.env.DEV && <TanStackRouterDevtools position="bottom-right" />}
    </div>
  );
}
