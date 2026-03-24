/**
 * Tests for Settings page (settings.tsx)
 * Covers unauthenticated guard, profile form, change email, change password.
 */

import { SettingsPage } from '@/routes/settings';
import { renderWithProviders } from '@/__tests__/test-utils';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import * as authApi from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';

const mockUseAuth = vi.fn();

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
  useSearch: () => ({}),
}));

const mockUser = {
  id: 'user-1',
  email: 'user@example.com',
  username: 'filmfan',
  avatarUrl: null,
  createdAt: '2024-01-15T00:00:00Z',
  updatedAt: '2024-01-15T00:00:00Z',
};

describe('SettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(authApi, 'updateProfile').mockResolvedValue(mockUser);
    vi.spyOn(authApi, 'changeEmail').mockResolvedValue({
      user: { ...mockUser, email: 'new@example.com' },
      accessToken: 'token',
    });
    vi.spyOn(authApi, 'changePassword').mockResolvedValue(undefined);
  });

  describe('unauthenticated guard', () => {
    it('shows sign in message and link to profil when not authenticated', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
        user: null,
      });

      renderWithProviders(<SettingsPage />);
      expect(screen.getByText(/sign in to access settings/i)).toBeInTheDocument();
      const signInLink = screen.getByRole('link', { name: /sign in/i });
      expect(signInLink).toHaveAttribute('href', '/profil');
    });

    it('shows sign in message when authenticated but user is null', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: null,
      });

      renderWithProviders(<SettingsPage />);
      expect(screen.getByText(/sign in to access settings/i)).toBeInTheDocument();
    });
  });

  describe('authenticated – Profile form', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: mockUser,
        updateUser: vi.fn(),
      });
    });

    it('shows Account settings heading and profile section', () => {
      renderWithProviders(<SettingsPage />);
      expect(screen.getByRole('heading', { name: /account settings/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /^profile$/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/profile photo \(image url\)/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /save profile/i })).toBeInTheDocument();
    });

    it('shows Back to profile link', () => {
      renderWithProviders(<SettingsPage />);
      expect(screen.getByRole('link', { name: /back to profile/i })).toHaveAttribute(
        'href',
        '/profil'
      );
    });

    it('displays success message after saving profile', async () => {
      const updateUser = vi.fn();
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: mockUser,
        updateUser,
      });

      const user = userEvent.setup();
      renderWithProviders(<SettingsPage />);
      await user.clear(screen.getByLabelText(/username/i));
      await user.type(screen.getByLabelText(/username/i), 'newname');
      await user.click(screen.getByRole('button', { name: /save profile/i }));

      await waitFor(() => {
        expect(screen.getByText(/profile updated/i)).toBeInTheDocument();
      });
      expect(authApi.updateProfile).toHaveBeenCalledWith(
        expect.objectContaining({ username: 'newname' })
      );
      expect(updateUser).toHaveBeenCalledWith(mockUser);
    });

    it('displays error when updateProfile fails', async () => {
      (authApi.updateProfile as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new ApiError(500, 'Error', { error: 'Server error' })
      );

      const user = userEvent.setup();
      renderWithProviders(<SettingsPage />);
      await user.click(screen.getByRole('button', { name: /save profile/i }));

      await waitFor(() => {
        expect(screen.getByText(/failed to update profile|server error/i)).toBeInTheDocument();
      });
    });
  });

  describe('Change email form', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: mockUser,
        updateUser: vi.fn(),
      });
    });

    it('shows current password and new email fields', () => {
      renderWithProviders(<SettingsPage />);
      const currentPasswordLabels = screen.getAllByLabelText(/current password/i);
      expect(currentPasswordLabels.length).toBeGreaterThanOrEqual(1);
      expect(screen.getByLabelText(/new email/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /change email/i })).toBeInTheDocument();
    });

    it('shows validation error when fields are empty', async () => {
      renderWithProviders(<SettingsPage />);
      const changeEmailButton = screen.getByRole('button', { name: /change email/i });
      const form = changeEmailButton.closest('form');
      if (form) fireEvent.submit(form);

      await waitFor(() => {
        expect(
          screen.getByText(/please enter your new email and current password/i)
        ).toBeInTheDocument();
      });
    });

    it('shows success message after changing email', async () => {
      const updateUser = vi.fn();
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: mockUser,
        updateUser,
      });

      const user = userEvent.setup();
      renderWithProviders(<SettingsPage />);
      const currentPasswordInputs = screen.getAllByLabelText(/current password/i);
      await user.type(currentPasswordInputs[0]!, 'currentpass');
      await user.type(screen.getByLabelText(/new email/i), 'new@example.com');
      await user.click(screen.getByRole('button', { name: /change email/i }));

      await waitFor(() => {
        expect(
          screen.getByText(/email updated. you can now sign in with your new email/i)
        ).toBeInTheDocument();
      });
      expect(updateUser).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'new@example.com' })
      );
    });

    it('shows error when email already in use (409)', async () => {
      (authApi.changeEmail as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new ApiError(409, 'Conflict', {})
      );

      const user = userEvent.setup();
      renderWithProviders(<SettingsPage />);
      const currentPasswordInputs = screen.getAllByLabelText(/current password/i);
      await user.type(currentPasswordInputs[0]!, 'pass');
      await user.type(screen.getByLabelText(/new email/i), 'taken@example.com');
      await user.click(screen.getByRole('button', { name: /change email/i }));

      await waitFor(() => {
        expect(screen.getByText(/email already in use/i)).toBeInTheDocument();
      });
    });
  });

  describe('Change password form', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: mockUser,
        updateUser: vi.fn(),
      });
    });

    it('shows current password, new password, confirm password', () => {
      renderWithProviders(<SettingsPage />);
      const passwordLabels = screen.getAllByLabelText(/password/i);
      expect(passwordLabels.length).toBeGreaterThanOrEqual(2);
      expect(screen.getByRole('button', { name: /change password/i })).toBeInTheDocument();
    });

    it('shows validation error when new password is too short', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SettingsPage />);
      const currentPasswordInputs = screen.getAllByLabelText(/current password/i);
      await user.type(currentPasswordInputs[1]!, 'currentpass');
      await user.type(screen.getByLabelText(/new password \(min 8 characters\)/i), 'short');
      await user.type(screen.getByLabelText(/confirm new password/i), 'short');
      await user.click(screen.getByRole('button', { name: /change password/i }));

      await waitFor(() => {
        expect(screen.getByText(/new password must be at least 8 characters/i)).toBeInTheDocument();
      });
    });

    it('shows validation error when new password and confirm do not match', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SettingsPage />);
      const currentPasswordInputs = screen.getAllByLabelText(/current password/i);
      await user.type(currentPasswordInputs[1]!, 'currentpass');
      await user.type(screen.getByLabelText(/new password \(min 8 characters\)/i), 'newpassword1');
      await user.type(screen.getByLabelText(/confirm new password/i), 'newpassword2');
      await user.click(screen.getByRole('button', { name: /change password/i }));

      await waitFor(() => {
        expect(screen.getByText(/new password and confirmation do not match/i)).toBeInTheDocument();
      });
    });

    it('shows success message after changing password', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SettingsPage />);
      const currentPasswordInputs = screen.getAllByLabelText(/current password/i);
      await user.type(currentPasswordInputs[1]!, 'currentpass');
      await user.type(screen.getByLabelText(/new password \(min 8 characters\)/i), 'newpassword1');
      await user.type(screen.getByLabelText(/confirm new password/i), 'newpassword1');
      await user.click(screen.getByRole('button', { name: /change password/i }));

      await waitFor(() => {
        expect(screen.getByText(/password updated/i)).toBeInTheDocument();
      });
      expect(authApi.changePassword).toHaveBeenCalledWith({
        currentPassword: 'currentpass',
        newPassword: 'newpassword1',
      });
    });

    it('shows error when current password is incorrect', async () => {
      (authApi.changePassword as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new ApiError(400, 'Bad Request', { error: 'Invalid password' })
      );

      const user = userEvent.setup();
      renderWithProviders(<SettingsPage />);
      const currentPasswordInputs = screen.getAllByLabelText(/current password/i);
      await user.type(currentPasswordInputs[1]!, 'wrongpass');
      await user.type(screen.getByLabelText(/new password \(min 8 characters\)/i), 'newpassword1');
      await user.type(screen.getByLabelText(/confirm new password/i), 'newpassword1');
      await user.click(screen.getByRole('button', { name: /change password/i }));

      await waitFor(() => {
        expect(
          screen.getByText(/current password is incorrect|invalid password/i)
        ).toBeInTheDocument();
      });
    });
  });
});
