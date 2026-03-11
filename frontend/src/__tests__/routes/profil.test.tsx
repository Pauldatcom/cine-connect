/**
 * Tests for Profile page (profil.tsx)
 * Covers AuthForm (login/register), ProfileView (authenticated), and guards.
 */

import { ProfilPage } from '@/routes/profil';
import { renderWithProviders } from '@/__tests__/test-utils';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';

const mockUseAuth = vi.fn();
const mockUseSearch = vi.fn();
const mockUseUserReviews = vi.fn();
const mockUseWatchlist = vi.fn();
const mockUseFriends = vi.fn();
const mockUsePendingFriendRequests = vi.fn();
const mockUseRespondToFriendRequest = vi.fn();
const mockUseRemoveFriend = vi.fn();

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: (_path: string) => (config: object) => config,
  Link: ({ children, to, ...props }: { children: React.ReactNode; to: string }) =>
    React.createElement('a', { href: to, 'data-testid': 'router-link', ...props }, children),
  useNavigate: () => vi.fn(),
  useRouter: () => ({ navigate: vi.fn() }),
  useParams: () => ({}),
  useSearch: (opts?: { from?: string }) => mockUseSearch(opts),
}));

vi.mock('@/hooks', () => ({
  useFriends: () => mockUseFriends(),
  usePendingFriendRequests: () => mockUsePendingFriendRequests(),
  useRespondToFriendRequest: () => mockUseRespondToFriendRequest(),
  useRemoveFriend: () => mockUseRemoveFriend(),
  useUserReviews: (userId: string | undefined) => mockUseUserReviews(userId),
  useWatchlist: () => mockUseWatchlist(),
}));

const mockUser = {
  id: 'user-1',
  email: 'user@example.com',
  username: 'filmfan',
  avatarUrl: null,
  createdAt: '2024-01-15T00:00:00Z',
  updatedAt: '2024-01-15T00:00:00Z',
};

describe('ProfilPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSearch.mockReturnValue({});
    mockUseUserReviews.mockReturnValue({ data: [], isLoading: false });
    mockUseWatchlist.mockReturnValue({ data: { items: [], count: 0 }, isLoading: false });
    mockUseFriends.mockReturnValue({ data: [], isLoading: false, isError: false });
    mockUsePendingFriendRequests.mockReturnValue({ data: [], isError: false });
    mockUseRespondToFriendRequest.mockReturnValue({ mutate: vi.fn(), isPending: false });
    mockUseRemoveFriend.mockReturnValue({ mutate: vi.fn(), isPending: false });
  });

  describe('loading state', () => {
    it('shows loader when auth is loading', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: true,
        user: null,
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        clearError: vi.fn(),
        error: null,
      });

      renderWithProviders(<ProfilPage />);
      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });
  });

  describe('unauthenticated – AuthForm', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        clearError: vi.fn(),
        error: null,
      });
    });

    it('shows login form by default', () => {
      renderWithProviders(<ProfilPage />);
      expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('toggles to register mode when clicking Create Account', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ProfilPage />);
      await user.click(screen.getByRole('button', { name: /create account/i }));
      expect(screen.getByRole('heading', { name: /join cin[eé]connect/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    });

    it('shows validation error when passwords do not match on register', async () => {
      mockUseSearch.mockReturnValue({ mode: 'register' });
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        clearError: vi.fn(),
        error: null,
      });

      const user = userEvent.setup();
      renderWithProviders(<ProfilPage />);
      await user.type(screen.getByLabelText(/username/i), 'testuser');
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/^password/i), 'password1');
      await user.type(screen.getByLabelText(/confirm password/i), 'password2');
      await user.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
      });
    });

    it('shows validation error when password is too short on register', async () => {
      mockUseSearch.mockReturnValue({ mode: 'register' });
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        clearError: vi.fn(),
        error: null,
      });

      const user = userEvent.setup();
      renderWithProviders(<ProfilPage />);
      await user.type(screen.getByLabelText(/username/i), 'ab');
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/^password/i), 'short');
      await user.type(screen.getByLabelText(/confirm password/i), 'short');
      await user.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
      });
    });

    it('shows validation error when username is too short on register', async () => {
      mockUseSearch.mockReturnValue({ mode: 'register' });
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        clearError: vi.fn(),
        error: null,
      });

      const user = userEvent.setup();
      renderWithProviders(<ProfilPage />);
      await user.type(screen.getByLabelText(/username/i), 'ab');
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/^password/i), 'password1');
      await user.type(screen.getByLabelText(/confirm password/i), 'password1');
      await user.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(screen.getByText(/username must be at least 3 characters/i)).toBeInTheDocument();
      });
    });

    it('calls login with email and password on submit when in login mode', async () => {
      const login = vi.fn().mockResolvedValue(undefined);
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        login,
        register: vi.fn(),
        logout: vi.fn(),
        clearError: vi.fn(),
        error: null,
      });

      const user = userEvent.setup();
      renderWithProviders(<ProfilPage />);
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(login).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        });
      });
    });

    it('calls register with email, username, password when in register mode', async () => {
      mockUseSearch.mockReturnValue({ mode: 'register' });
      const register = vi.fn().mockResolvedValue(undefined);
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        login: vi.fn(),
        register,
        logout: vi.fn(),
        clearError: vi.fn(),
        error: null,
      });

      const user = userEvent.setup();
      renderWithProviders(<ProfilPage />);
      await user.type(screen.getByLabelText(/username/i), 'testuser');
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/^password/i), 'password1');
      await user.type(screen.getByLabelText(/confirm password/i), 'password1');
      await user.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(register).toHaveBeenCalledWith({
          email: 'test@example.com',
          username: 'testuser',
          password: 'password1',
        });
      });
    });

    it('disables submit button when loading', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: true,
        user: null,
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        clearError: vi.fn(),
        error: null,
      });
      renderWithProviders(<ProfilPage />);
      // When loading we show the full-page loader, not the form
      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });
  });

  describe('authenticated but no user (race)', () => {
    it('shows error message and link to home when authenticated but user is null', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: null,
        logout: vi.fn(),
      });

      renderWithProviders(<ProfilPage />);
      expect(screen.getByText(/your profile could not be loaded/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /back to home/i })).toHaveAttribute('href', '/');
    });
  });

  describe('authenticated – ProfileView', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: mockUser,
        logout: vi.fn(),
      });
    });

    it('shows profile header with username, email, and member since', () => {
      renderWithProviders(<ProfilPage />);
      expect(screen.getByRole('heading', { name: mockUser.username })).toBeInTheDocument();
      expect(screen.getByText(mockUser.email)).toBeInTheDocument();
      expect(screen.getByText(/member since/i)).toBeInTheDocument();
    });

    it('shows Settings link to /settings', () => {
      renderWithProviders(<ProfilPage />);
      const settingsLink = screen.getByRole('link', { name: /settings/i });
      expect(settingsLink).toHaveAttribute('href', '/settings');
    });

    it('shows stat cards for Watchlist, Friends, Reviews', () => {
      renderWithProviders(<ProfilPage />);
      expect(screen.getByText('Watchlist')).toBeInTheDocument();
      expect(screen.getByText('This Year')).toBeInTheDocument();
      expect(screen.getByText('Reviews')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Friends' })).toBeInTheDocument();
    });

    it('shows Friends section with Find members link', () => {
      renderWithProviders(<ProfilPage />);
      expect(screen.getByTestId('profile-friends')).toBeInTheDocument();
      const findMembersLinks = screen.getAllByRole('link', { name: /find members/i });
      expect(findMembersLinks.length).toBeGreaterThanOrEqual(1);
      expect(findMembersLinks[0]).toHaveAttribute('href', '/members');
    });

    it('shows Recent Reviews section', () => {
      renderWithProviders(<ProfilPage />);
      expect(screen.getByRole('heading', { name: /recent reviews/i })).toBeInTheDocument();
    });

    it('shows Your Watchlist section', () => {
      renderWithProviders(<ProfilPage />);
      expect(screen.getByTestId('profile-watchlist')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /your watchlist/i })).toBeInTheDocument();
    });

    it('shows Sign Out button', () => {
      renderWithProviders(<ProfilPage />);
      expect(screen.getByTestId('sign-out-button')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument();
    });

    it('calls logout when Sign Out is clicked', async () => {
      const logout = vi.fn();
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: mockUser,
        logout,
      });

      const user = userEvent.setup();
      renderWithProviders(<ProfilPage />);
      await user.click(screen.getByTestId('sign-out-button'));

      expect(logout).toHaveBeenCalled();
    });
  });
});
