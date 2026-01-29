/**
 * Auth Context - Global authentication state management
 */

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import {
  authApi,
  type User,
  type LoginCredentials,
  type RegisterCredentials,
} from '@/lib/api/auth';
import { ApiError, tokenStorage } from '@/lib/api/client';

// Context state type
interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

// Context actions type
interface AuthActions {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

// Full context type
type AuthContextType = AuthState & AuthActions;

// Create context
const AuthContext = createContext<AuthContextType | null>(null);

// Provider props
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Auth Provider - Wraps app to provide auth state
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    error: null,
  });

  // Initialize auth state on mount by attempting to refresh the session
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Try to refresh token using httpOnly cookie
        // This will fail if there's no valid refresh token cookie
        const response = await authApi.refreshToken();
        setState({
          user: response.user,
          isLoading: false,
          isAuthenticated: true,
          error: null,
        });
      } catch {
        // No valid session - user needs to login
        tokenStorage.clearTokens();
        setState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
          error: null,
        });
      }
    };

    initAuth();
  }, []);

  // Login action
  const login = useCallback(async (credentials: LoginCredentials) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await authApi.login(credentials);
      setState({
        user: response.user,
        isLoading: false,
        isAuthenticated: true,
        error: null,
      });
    } catch (error) {
      const message =
        error instanceof ApiError
          ? (error.data as { error?: string })?.error || 'Invalid credentials'
          : 'Login failed. Please try again.';

      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: message,
      }));
      // Error is stored in state - no need to re-throw
    }
  }, []);

  // Register action
  const register = useCallback(async (credentials: RegisterCredentials) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await authApi.register(credentials);
      setState({
        user: response.user,
        isLoading: false,
        isAuthenticated: true,
        error: null,
      });
    } catch (error) {
      const message =
        error instanceof ApiError
          ? (error.data as { error?: string })?.error || 'Registration failed'
          : 'Registration failed. Please try again.';

      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: message,
      }));
      // Error is stored in state - no need to re-throw
    }
  }, []);

  // Logout action
  const logout = useCallback(async () => {
    await authApi.logout();
    setState({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      error: null,
    });
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to access auth context
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}

export default AuthContext;
