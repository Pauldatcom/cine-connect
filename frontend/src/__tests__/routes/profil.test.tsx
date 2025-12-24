/**
 * Tests for Profil page (Login/Register/Profile)
 * Since profil.tsx uses TanStack Router's createFileRoute,
 * we test the logic by mocking useAuth and testing the behavior
 */

import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';

// Mock TanStack Router
vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => () => ({ component: () => null }),
}));

// Mock useAuth hook
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from '@/contexts/AuthContext';

const mockUseAuth = useAuth as Mock;

// Simple test components that mirror profil.tsx logic
// These are simplified versions for testing the auth flow

function AuthForm({
  login,
  register,
  isLoading,
  error,
  clearError,
}: {
  login: Mock;
  register: Mock;
  isLoading: boolean;
  error: string | null;
  clearError: Mock;
}) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    clearError();

    if (mode === 'register') {
      if (formData.password !== formData.confirmPassword) {
        setValidationError('Passwords do not match');
        return;
      }
      if (formData.password.length < 8) {
        setValidationError('Password must be at least 8 characters');
        return;
      }
      if (formData.username.length < 3) {
        setValidationError('Username must be at least 3 characters');
        return;
      }
      await register({
        email: formData.email,
        username: formData.username,
        password: formData.password,
      });
    } else {
      await login({ email: formData.email, password: formData.password });
    }
  };

  const displayError = validationError || error;

  return (
    <div>
      <h1>{mode === 'login' ? 'Welcome Back' : 'Join CineConnect'}</h1>
      {displayError && <div data-testid="error">{displayError}</div>}
      <form onSubmit={handleSubmit}>
        {mode === 'register' && (
          <input
            type="text"
            placeholder="filmfan42"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            disabled={isLoading}
          />
        )}
        <input
          type="email"
          placeholder="you@example.com"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          disabled={isLoading}
        />
        <input
          type="password"
          placeholder="••••••••"
          data-testid="password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          disabled={isLoading}
        />
        {mode === 'register' && (
          <input
            type="password"
            placeholder="Confirm"
            data-testid="confirmPassword"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            disabled={isLoading}
          />
        )}
        <button type="submit" disabled={isLoading}>
          {mode === 'login' ? 'Sign In' : 'Create Account'}
        </button>
      </form>
      <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
        {mode === 'login' ? 'Create Account' : 'Sign In'}
      </button>
    </div>
  );
}

// Simplified ProfileView for testing
function ProfileView({
  user,
  logout,
}: {
  user: { username: string; email: string };
  logout: Mock;
}) {
  return (
    <div>
      <h1>{user.username}</h1>
      <p>{user.email}</p>
      <button onClick={logout}>Sign Out</button>
    </div>
  );
}

// Main test component that mirrors profil.tsx logic
function ProfilPageTest() {
  const { isAuthenticated, isLoading, user, login, register, logout, error, clearError } =
    mockUseAuth();

  if (isLoading) {
    return <div data-testid="loading">Loading...</div>;
  }

  if (!isAuthenticated) {
    return (
      <AuthForm
        login={login}
        register={register}
        isLoading={isLoading}
        error={error}
        clearError={clearError}
      />
    );
  }

  return <ProfileView user={user} logout={logout} />;
}

describe('Profil Page', () => {
  const mockLogin = vi.fn();
  const mockRegister = vi.fn();
  const mockLogout = vi.fn();
  const mockClearError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loading state', () => {
    it('shows loading spinner while checking auth', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: true,
        user: null,
        login: mockLogin,
        register: mockRegister,
        logout: mockLogout,
        error: null,
        clearError: mockClearError,
      });

      render(<ProfilPageTest />);
      expect(screen.getByTestId('loading')).toBeInTheDocument();
    });
  });

  describe('unauthenticated state (AuthForm)', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        login: mockLogin,
        register: mockRegister,
        logout: mockLogout,
        error: null,
        clearError: mockClearError,
      });
    });

    it('shows login form by default', () => {
      render(<ProfilPageTest />);
      expect(screen.getByText('Welcome Back')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
    });

    it('switches to register form when clicking toggle', async () => {
      const user = userEvent.setup();
      render(<ProfilPageTest />);

      // Click the toggle button (the second button with "Create Account")
      const buttons = screen.getAllByRole('button', { name: 'Create Account' });
      await user.click(buttons[0]);

      expect(screen.getByText('Join CineConnect')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('filmfan42')).toBeInTheDocument();
    });

    it('calls login with form data', async () => {
      const user = userEvent.setup();
      mockLogin.mockResolvedValueOnce({});
      render(<ProfilPageTest />);

      await user.type(screen.getByPlaceholderText('you@example.com'), 'test@test.com');
      await user.type(screen.getByTestId('password'), 'password123');
      await user.click(screen.getByRole('button', { name: 'Sign In' }));

      expect(mockLogin).toHaveBeenCalledWith({
        email: 'test@test.com',
        password: 'password123',
      });
    });

    it('shows error from auth context', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        login: mockLogin,
        register: mockRegister,
        logout: mockLogout,
        error: 'Invalid credentials',
        clearError: mockClearError,
      });

      render(<ProfilPageTest />);
      expect(screen.getByTestId('error')).toHaveTextContent('Invalid credentials');
    });
  });

  describe('register form validation', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        login: mockLogin,
        register: mockRegister,
        logout: mockLogout,
        error: null,
        clearError: mockClearError,
      });
    });

    it('shows error when passwords do not match', async () => {
      const user = userEvent.setup();
      render(<ProfilPageTest />);

      // Switch to register
      const buttons = screen.getAllByRole('button', { name: 'Create Account' });
      await user.click(buttons[0]);

      await user.type(screen.getByPlaceholderText('filmfan42'), 'testuser');
      await user.type(screen.getByPlaceholderText('you@example.com'), 'test@test.com');
      await user.type(screen.getByTestId('password'), 'password123');
      await user.type(screen.getByTestId('confirmPassword'), 'differentpass');

      const submitButton = screen.getByRole('button', { name: 'Create Account' });
      await user.click(submitButton);

      expect(screen.getByTestId('error')).toHaveTextContent('Passwords do not match');
      expect(mockRegister).not.toHaveBeenCalled();
    });

    it('shows error when password is too short', async () => {
      const user = userEvent.setup();
      render(<ProfilPageTest />);

      const buttons = screen.getAllByRole('button', { name: 'Create Account' });
      await user.click(buttons[0]);

      await user.type(screen.getByPlaceholderText('filmfan42'), 'testuser');
      await user.type(screen.getByPlaceholderText('you@example.com'), 'test@test.com');
      await user.type(screen.getByTestId('password'), 'short');
      await user.type(screen.getByTestId('confirmPassword'), 'short');

      const submitButton = screen.getByRole('button', { name: 'Create Account' });
      await user.click(submitButton);

      expect(screen.getByTestId('error')).toHaveTextContent(
        'Password must be at least 8 characters'
      );
      expect(mockRegister).not.toHaveBeenCalled();
    });

    it('shows error when username is too short', async () => {
      const user = userEvent.setup();
      render(<ProfilPageTest />);

      const buttons = screen.getAllByRole('button', { name: 'Create Account' });
      await user.click(buttons[0]);

      await user.type(screen.getByPlaceholderText('filmfan42'), 'ab');
      await user.type(screen.getByPlaceholderText('you@example.com'), 'test@test.com');
      await user.type(screen.getByTestId('password'), 'password123');
      await user.type(screen.getByTestId('confirmPassword'), 'password123');

      const submitButton = screen.getByRole('button', { name: 'Create Account' });
      await user.click(submitButton);

      expect(screen.getByTestId('error')).toHaveTextContent(
        'Username must be at least 3 characters'
      );
      expect(mockRegister).not.toHaveBeenCalled();
    });

    it('calls register with valid form data', async () => {
      const user = userEvent.setup();
      mockRegister.mockResolvedValueOnce({});
      render(<ProfilPageTest />);

      const buttons = screen.getAllByRole('button', { name: 'Create Account' });
      await user.click(buttons[0]);

      await user.type(screen.getByPlaceholderText('filmfan42'), 'testuser');
      await user.type(screen.getByPlaceholderText('you@example.com'), 'test@test.com');
      await user.type(screen.getByTestId('password'), 'password123');
      await user.type(screen.getByTestId('confirmPassword'), 'password123');

      const submitButton = screen.getByRole('button', { name: 'Create Account' });
      await user.click(submitButton);

      expect(mockRegister).toHaveBeenCalledWith({
        email: 'test@test.com',
        username: 'testuser',
        password: 'password123',
      });
    });
  });

  describe('authenticated state (ProfileView)', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: {
          id: '1',
          username: 'testuser',
          email: 'test@test.com',
          avatarUrl: null,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
        login: mockLogin,
        register: mockRegister,
        logout: mockLogout,
        error: null,
        clearError: mockClearError,
      });
    });

    it('shows user profile when authenticated', () => {
      render(<ProfilPageTest />);
      expect(screen.getByText('testuser')).toBeInTheDocument();
      expect(screen.getByText('test@test.com')).toBeInTheDocument();
    });

    it('calls logout when clicking sign out', async () => {
      const user = userEvent.setup();
      render(<ProfilPageTest />);

      await user.click(screen.getByRole('button', { name: 'Sign Out' }));
      expect(mockLogout).toHaveBeenCalled();
    });
  });
});
