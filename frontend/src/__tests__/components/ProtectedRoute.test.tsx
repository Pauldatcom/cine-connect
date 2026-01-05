/**
 * Tests for ProtectedRoute component
 */

import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ProtectedRoute } from '@/components/ProtectedRoute';

// Mock useAuth hook
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
}));

import { useAuth } from '@/contexts/AuthContext';

const mockUseAuth = useAuth as Mock;

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loading state', () => {
    it('shows loading spinner while checking auth', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: true,
      });

      render(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      // Should show loading spinner (Loader2 icon has animate-spin class)
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('shows custom fallback during loading', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: true,
      });

      render(
        <ProtectedRoute fallback={<div>Custom Loading...</div>}>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      expect(screen.getByText('Custom Loading...')).toBeInTheDocument();
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });
  });

  describe('authenticated state', () => {
    it('renders children when authenticated', async () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
      });

      render(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('does not redirect when authenticated', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
      });

      render(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('unauthenticated state', () => {
    it('redirects to /profil when not authenticated', async () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
      });

      render(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith({ to: '/profil' });
      });
    });

    it('does not render children when not authenticated', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
      });

      render(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });
  });

  describe('transition from loading to authenticated', () => {
    it('shows content after loading completes with auth', async () => {
      // Start loading
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: true,
      });

      const { rerender } = render(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();

      // Finish loading, user is authenticated
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
      });

      rerender(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
  });

  describe('transition from loading to unauthenticated', () => {
    it('redirects after loading completes without auth', async () => {
      // Start loading
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: true,
      });

      const { rerender } = render(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      expect(mockNavigate).not.toHaveBeenCalled();

      // Finish loading, user is not authenticated
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
      });

      rerender(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith({ to: '/profil' });
      });
    });
  });
});
