/**
 * Shared Test Utilities
 *
 * This file contains common test setup utilities to avoid duplication across test files.
 * Import from '@/test/test-utils' in your test files.
 */

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderOptions, type RenderResult } from '@testing-library/react';
import { vi } from 'vitest';
import type { TMDbMovie } from '@/lib/api/tmdb';

// ============================================
// Test Wrapper
// ============================================

/**
 * Creates a test wrapper with QueryClientProvider.
 * Use this when you need a fresh QueryClient for each test.
 */
export function createTestWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

/**
 * Custom render function that wraps component with providers.
 * Provides a fresh QueryClient for each render.
 */
export function renderWithProviders(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
): RenderResult {
  const Wrapper = createTestWrapper();
  return render(ui, { wrapper: Wrapper, ...options });
}

// ============================================
// Router Mock
// ============================================

/**
 * TanStack Router mock configuration.
 * Use vi.mock('@tanstack/react-router', () => routerMock) in your test file.
 */
export const routerMock = {
  Link: ({
    children,
    to,
    activeOptions: _activeOptions,
    activeProps: _activeProps,
    inactiveProps: _inactiveProps,
    params: _params,
    ...props
  }: {
    children: React.ReactNode;
    to: string;
    activeOptions?: unknown;
    activeProps?: unknown;
    inactiveProps?: unknown;
    params?: unknown;
    [key: string]: unknown;
  }) => (
    <a href={to} data-testid="router-link" {...props}>
      {children}
    </a>
  ),
  useNavigate: () => vi.fn(),
  useRouter: () => ({ navigate: vi.fn() }),
  useParams: () => ({}),
  useSearch: () => ({}),
};

// ============================================
// Mock Data
// ============================================

/**
 * Standard mock film object for testing.
 * Use this instead of creating new mock films in each test.
 */
export const mockFilm: TMDbMovie = {
  id: 123,
  title: 'Test Movie',
  original_title: 'Test Movie',
  overview: 'A test movie for testing purposes.',
  poster_path: '/test-poster.jpg',
  backdrop_path: '/test-backdrop.jpg',
  release_date: '2024-01-15',
  vote_average: 8.5,
  vote_count: 1000,
  popularity: 100,
  genre_ids: [28, 12],
  adult: false,
  original_language: 'en',
};

/**
 * Creates a mock film with custom overrides.
 */
export function createMockFilm(overrides: Partial<TMDbMovie> = {}): TMDbMovie {
  return {
    ...mockFilm,
    ...overrides,
    id: overrides.id ?? Math.floor(Math.random() * 10000),
  };
}

/**
 * Creates multiple mock films for list testing.
 */
export function createMockFilmList(count: number): TMDbMovie[] {
  return Array.from({ length: count }, (_, i) =>
    createMockFilm({
      id: 100 + i,
      title: `Test Movie ${i + 1}`,
    })
  );
}

/**
 * Mock user object for testing.
 */
export const mockUser = {
  id: 'user-123',
  name: 'Test User',
  username: 'testuser',
  email: 'test@example.com',
  avatar: null,
};

/**
 * Creates a mock user with custom overrides.
 */
export function createMockUser(overrides: Partial<typeof mockUser> = {}) {
  return {
    ...mockUser,
    ...overrides,
  };
}

// ============================================
// Utility Functions
// ============================================

/**
 * Wait for async operations to complete.
 * Useful when testing components with useQuery.
 */
export async function waitForLoadingToFinish() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}
