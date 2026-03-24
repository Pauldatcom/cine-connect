/**
 * Settings page - Edit profile (username, photo), change email, change password.
 * Separate from profile (view-only); requires authentication.
 */

import { useAuth } from '@/contexts/AuthContext';
import {
  updateProfile,
  changePassword,
  changeEmail,
  type UpdateProfileInput,
  type ChangePasswordInput,
  type ChangeEmailInput,
} from '@/lib/api/auth';
import { createFileRoute, Link } from '@tanstack/react-router';
import { AlertCircle, Check, Loader2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { ApiError } from '@/lib/api/client';

export const Route = createFileRoute('/settings')({
  component: SettingsPage,
});

export function SettingsPage() {
  const { isAuthenticated, isLoading: authLoading, user, updateUser } = useAuth();

  if (authLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="text-letterboxd-green h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <div className="card text-center">
          <p className="text-text-secondary">Sign in to access settings.</p>
          <Link to="/profil" className="btn-primary mt-6 inline-block">
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-8 flex items-center gap-4">
        <Link
          to="/profil"
          className="text-text-secondary hover:text-text-primary text-sm font-medium transition-colors"
        >
          ← Back to profile
        </Link>
      </div>
      <h1 className="font-display text-text-primary mb-2 text-2xl font-bold">Account settings</h1>
      <p className="text-text-secondary mb-8 text-sm">
        Update your username, profile photo, email, or password.
      </p>
      <SettingsForms user={user} onUpdated={updateUser} />
    </div>
  );
}

function SettingsForms({
  user,
  onUpdated,
}: {
  user: { id: string; email: string; username: string; avatarUrl: string | null };
  onUpdated: (user: {
    id: string;
    email: string;
    username: string;
    avatarUrl: string | null;
    createdAt: string;
    updatedAt: string;
  }) => void;
}) {
  const [profileForm, setProfileForm] = useState<UpdateProfileInput>({
    username: user.username,
    avatarUrl: user.avatarUrl ?? undefined,
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState(false);

  const [emailForm, setEmailForm] = useState<ChangeEmailInput>({
    newEmail: '',
    currentPassword: '',
  });
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailSuccess, setEmailSuccess] = useState(false);

  const [passwordForm, setPasswordForm] = useState<
    ChangePasswordInput & { confirmPassword: string }
  >({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const handleUpdateProfile = async (e: FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(false);
    setProfileLoading(true);
    try {
      const updated = await updateProfile(profileForm);
      onUpdated(updated);
      setProfileSuccess(true);
    } catch (err) {
      setProfileError(
        err instanceof ApiError
          ? (err.data as { error?: string })?.error || 'Failed to update profile'
          : 'Something went wrong. Please try again.'
      );
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangeEmail = async (e: FormEvent) => {
    e.preventDefault();
    setEmailError(null);
    setEmailSuccess(false);
    if (!emailForm.newEmail.trim() || !emailForm.currentPassword) {
      setEmailError('Please enter your new email and current password.');
      return;
    }
    setEmailLoading(true);
    try {
      const response = await changeEmail(emailForm);
      onUpdated(response.user);
      setEmailSuccess(true);
      setEmailForm({ newEmail: '', currentPassword: '' });
    } catch (err) {
      setEmailError(
        err instanceof ApiError
          ? (err.data as { error?: string })?.error ||
              (err.status === 409 ? 'Email already in use.' : 'Invalid current password.')
          : 'Something went wrong. Please try again.'
      );
    } finally {
      setEmailLoading(false);
    }
  };

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);
    if (passwordForm.newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters.');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }
    setPasswordLoading(true);
    try {
      await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordSuccess(true);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPasswordError(
        err instanceof ApiError
          ? (err.data as { error?: string })?.error || 'Current password is incorrect.'
          : 'Something went wrong. Please try again.'
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-10">
      {/* Profile: username + photo */}
      <section className="card">
        <h2 className="section-header mb-4">Profile</h2>
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          {profileError && (
            <div className="flex items-center gap-2 rounded-lg bg-red-500/10 p-3 text-red-400">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm">{profileError}</p>
            </div>
          )}
          {profileSuccess && (
            <div className="flex items-center gap-2 rounded-lg bg-green-500/10 p-3 text-green-400">
              <Check className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm">Profile updated.</p>
            </div>
          )}
          <div>
            <label
              htmlFor="settings-username"
              className="text-text-secondary mb-1 block text-sm font-medium"
            >
              Username
            </label>
            <input
              id="settings-username"
              type="text"
              className="input"
              value={profileForm.username ?? ''}
              onChange={(e) => setProfileForm((p) => ({ ...p, username: e.target.value }))}
              disabled={profileLoading}
              minLength={3}
              maxLength={50}
            />
          </div>
          <div>
            <label
              htmlFor="settings-avatarUrl"
              className="text-text-secondary mb-1 block text-sm font-medium"
            >
              Profile photo (image URL)
            </label>
            <input
              id="settings-avatarUrl"
              type="url"
              className="input"
              placeholder="https://example.com/your-photo.jpg"
              value={profileForm.avatarUrl ?? ''}
              onChange={(e) =>
                setProfileForm((p) => ({ ...p, avatarUrl: e.target.value || undefined }))
              }
              disabled={profileLoading}
            />
            <p className="text-text-tertiary mt-1 text-xs">
              Enter a direct link to an image. Leave empty to remove your profile photo.
            </p>
          </div>
          <button type="submit" className="btn-primary" disabled={profileLoading}>
            {profileLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </span>
            ) : (
              'Save profile'
            )}
          </button>
        </form>
      </section>

      {/* Change email */}
      <section className="card">
        <h2 className="section-header mb-4">Change email</h2>
        <form onSubmit={handleChangeEmail} className="space-y-4">
          {emailError && (
            <div className="flex items-center gap-2 rounded-lg bg-red-500/10 p-3 text-red-400">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm">{emailError}</p>
            </div>
          )}
          {emailSuccess && (
            <div className="flex items-center gap-2 rounded-lg bg-green-500/10 p-3 text-green-400">
              <Check className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm">Email updated. You can now sign in with your new email.</p>
            </div>
          )}
          <div>
            <label
              htmlFor="settings-current-password-email"
              className="text-text-secondary mb-1 block text-sm font-medium"
            >
              Current password
            </label>
            <input
              id="settings-current-password-email"
              type="password"
              className="input"
              autoComplete="current-password"
              value={emailForm.currentPassword}
              onChange={(e) => setEmailForm((p) => ({ ...p, currentPassword: e.target.value }))}
              disabled={emailLoading}
              required
            />
          </div>
          <div>
            <label
              htmlFor="settings-new-email"
              className="text-text-secondary mb-1 block text-sm font-medium"
            >
              New email
            </label>
            <input
              id="settings-new-email"
              type="email"
              className="input"
              autoComplete="email"
              value={emailForm.newEmail}
              onChange={(e) => setEmailForm((p) => ({ ...p, newEmail: e.target.value }))}
              disabled={emailLoading}
              required
            />
          </div>
          <button type="submit" className="btn-primary" disabled={emailLoading}>
            {emailLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Updating...
              </span>
            ) : (
              'Change email'
            )}
          </button>
        </form>
      </section>

      {/* Change password */}
      <section className="card">
        <h2 className="section-header mb-4">Change password</h2>
        <form onSubmit={handleChangePassword} className="space-y-4">
          {passwordError && (
            <div className="flex items-center gap-2 rounded-lg bg-red-500/10 p-3 text-red-400">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm">{passwordError}</p>
            </div>
          )}
          {passwordSuccess && (
            <div className="flex items-center gap-2 rounded-lg bg-green-500/10 p-3 text-green-400">
              <Check className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm">Password updated.</p>
            </div>
          )}
          <div>
            <label
              htmlFor="settings-current-password"
              className="text-text-secondary mb-1 block text-sm font-medium"
            >
              Current password
            </label>
            <input
              id="settings-current-password"
              type="password"
              className="input"
              autoComplete="current-password"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm((p) => ({ ...p, currentPassword: e.target.value }))}
              disabled={passwordLoading}
              required
            />
          </div>
          <div>
            <label
              htmlFor="settings-new-password"
              className="text-text-secondary mb-1 block text-sm font-medium"
            >
              New password (min 8 characters)
            </label>
            <input
              id="settings-new-password"
              type="password"
              className="input"
              autoComplete="new-password"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))}
              disabled={passwordLoading}
              minLength={8}
              required
            />
          </div>
          <div>
            <label
              htmlFor="settings-confirm-password"
              className="text-text-secondary mb-1 block text-sm font-medium"
            >
              Confirm new password
            </label>
            <input
              id="settings-confirm-password"
              type="password"
              className="input"
              autoComplete="new-password"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm((p) => ({ ...p, confirmPassword: e.target.value }))}
              disabled={passwordLoading}
              required
            />
          </div>
          <button type="submit" className="btn-primary" disabled={passwordLoading}>
            {passwordLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Updating...
              </span>
            ) : (
              'Change password'
            )}
          </button>
        </form>
      </section>
    </div>
  );
}
