/**
 * Tests for AuthContext
 */

import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from './AuthContext';

// Mock the auth API and client
vi.mock('@/lib/api/auth', () => ({
  authApi: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    getCurrentUser: vi.fn(),
  },
}));

vi.mock('@/lib/api/client', () => ({
  tokenStorage: {
    hasTokens: vi.fn(),
    clearTokens: vi.fn(),
  },
  ApiError: class ApiError extends Error {
    constructor(
      public status: number,
      public statusText: string,
      public data?: unknown
    ) {
      super(`API Error: ${status} ${statusText}`);
      this.name = 'ApiError';
    }
  },
}));

import { authApi } from '@/lib/api/auth';
import { tokenStorage, ApiError } from '@/lib/api/client';

const mockAuthApi = authApi as unknown as {
  login: Mock;
  register: Mock;
  logout: Mock;
  getCurrentUser: Mock;
};

const mockTokenStorage = tokenStorage as unknown as {
  hasTokens: Mock;
  clearTokens: Mock;
};

// Test component that uses useAuth hook
function TestComponent() {
  const { user, isLoading, isAuthenticated, error, login, register, logout, clearError } =
    useAuth();

  return (
    <div>
      <div data-testid="loading">{isLoading ? 'loading' : 'ready'}</div>
      <div data-testid="authenticated">{isAuthenticated ? 'yes' : 'no'}</div>
      <div data-testid="user">{user ? user.username : 'none'}</div>
      <div data-testid="error">{error || 'no error'}</div>
      <button onClick={() => login({ email: 'test@test.com', password: 'pass' })}>Login</button>
      <button
        onClick={() => register({ email: 'test@test.com', username: 'test', password: 'pass' })}
      >
        Register
      </button>
      <button onClick={logout}>Logout</button>
      <button onClick={clearError}>Clear Error</button>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTokenStorage.hasTokens.mockReturnValue(false);
  });

  describe('initial state', () => {
    it('shows loading state initially', async () => {
      mockTokenStorage.hasTokens.mockReturnValue(false);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Should show ready when no tokens (quick path)
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('ready');
      });
    });

    it('loads user when tokens exist', async () => {
      mockTokenStorage.hasTokens.mockReturnValue(true);
      mockAuthApi.getCurrentUser.mockResolvedValueOnce({
        id: '1',
        email: 'test@test.com',
        username: 'testuser',
        avatarUrl: null,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('ready');
        expect(screen.getByTestId('authenticated')).toHaveTextContent('yes');
        expect(screen.getByTestId('user')).toHaveTextContent('testuser');
      });
    });

    it('clears tokens when getCurrentUser fails', async () => {
      mockTokenStorage.hasTokens.mockReturnValue(true);
      mockAuthApi.getCurrentUser.mockRejectedValueOnce(new Error('Token expired'));

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('ready');
        expect(screen.getByTestId('authenticated')).toHaveTextContent('no');
        expect(mockTokenStorage.clearTokens).toHaveBeenCalled();
      });
    });
  });

  describe('login', () => {
    it('logs in user successfully', async () => {
      const user = userEvent.setup();
      mockAuthApi.login.mockResolvedValueOnce({
        user: { id: '1', email: 'test@test.com', username: 'loggedin' },
        accessToken: 'token',
        refreshToken: 'refresh',
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('ready');
      });

      await user.click(screen.getByRole('button', { name: 'Login' }));

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('yes');
        expect(screen.getByTestId('user')).toHaveTextContent('loggedin');
      });
    });

    it('shows error on login failure', async () => {
      const user = userEvent.setup();
      mockAuthApi.login.mockRejectedValueOnce(
        new ApiError(401, 'Unauthorized', { error: 'Invalid credentials' })
      );

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('ready');
      });

      await user.click(screen.getByRole('button', { name: 'Login' }));

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Invalid credentials');
        expect(screen.getByTestId('authenticated')).toHaveTextContent('no');
      });
    });

    it('shows generic error on non-API error', async () => {
      const user = userEvent.setup();
      mockAuthApi.login.mockRejectedValueOnce(new Error('Network error'));

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('ready');
      });

      await user.click(screen.getByRole('button', { name: 'Login' }));

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Login failed. Please try again.');
      });
    });

    it('shows fallback error when ApiError has no error message', async () => {
      const user = userEvent.setup();
      mockAuthApi.login.mockRejectedValueOnce(new ApiError(401, 'Unauthorized', {}));

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('ready');
      });

      await user.click(screen.getByRole('button', { name: 'Login' }));

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Invalid credentials');
      });
    });
  });

  describe('register', () => {
    it('registers user successfully', async () => {
      const user = userEvent.setup();
      mockAuthApi.register.mockResolvedValueOnce({
        user: { id: '1', email: 'test@test.com', username: 'newuser' },
        accessToken: 'token',
        refreshToken: 'refresh',
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('ready');
      });

      await user.click(screen.getByRole('button', { name: 'Register' }));

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('yes');
        expect(screen.getByTestId('user')).toHaveTextContent('newuser');
      });
    });

    it('shows error on registration failure', async () => {
      const user = userEvent.setup();
      mockAuthApi.register.mockRejectedValueOnce(
        new ApiError(409, 'Conflict', { error: 'Email already registered' })
      );

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('ready');
      });

      await user.click(screen.getByRole('button', { name: 'Register' }));

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Email already registered');
      });
    });

    it('shows generic error on non-API error', async () => {
      const user = userEvent.setup();
      mockAuthApi.register.mockRejectedValueOnce(new Error('Network error'));

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('ready');
      });

      await user.click(screen.getByRole('button', { name: 'Register' }));

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent(
          'Registration failed. Please try again.'
        );
      });
    });

    it('shows fallback error when ApiError has no error message', async () => {
      const user = userEvent.setup();
      mockAuthApi.register.mockRejectedValueOnce(new ApiError(409, 'Conflict', {}));

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('ready');
      });

      await user.click(screen.getByRole('button', { name: 'Register' }));

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Registration failed');
      });
    });
  });

  describe('logout', () => {
    it('clears user state on logout', async () => {
      const user = userEvent.setup();
      mockTokenStorage.hasTokens.mockReturnValue(true);
      mockAuthApi.getCurrentUser.mockResolvedValueOnce({
        id: '1',
        email: 'test@test.com',
        username: 'testuser',
        avatarUrl: null,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('yes');
      });

      await user.click(screen.getByRole('button', { name: 'Logout' }));

      expect(screen.getByTestId('authenticated')).toHaveTextContent('no');
      expect(screen.getByTestId('user')).toHaveTextContent('none');
      expect(mockAuthApi.logout).toHaveBeenCalled();
    });
  });

  describe('clearError', () => {
    it('clears error state', async () => {
      const user = userEvent.setup();
      mockAuthApi.login.mockRejectedValueOnce(
        new ApiError(401, 'Unauthorized', { error: 'Bad credentials' })
      );

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('ready');
      });

      await user.click(screen.getByRole('button', { name: 'Login' }));

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Bad credentials');
      });

      await user.click(screen.getByRole('button', { name: 'Clear Error' }));

      expect(screen.getByTestId('error')).toHaveTextContent('no error');
    });
  });

  describe('useAuth hook', () => {
    it('throws error when used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useAuth must be used within an AuthProvider');

      consoleSpy.mockRestore();
    });
  });
});
