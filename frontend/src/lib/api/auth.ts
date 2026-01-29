/**
 * Auth API - Authentication endpoints
 *
 * Security: Access token stored in memory, refresh token in httpOnly cookie
 */

import { api, tokenStorage } from './client';

// Types
export interface User {
  id: string;
  email: string;
  username: string;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  username: string;
  password: string;
}

/**
 * Register a new user
 */
export async function register(credentials: RegisterCredentials): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>('/api/v1/auth/register', credentials, {
    skipAuth: true,
  });

  // Store access token in memory (refresh token is in httpOnly cookie)
  tokenStorage.setAccessToken(response.accessToken);

  return response;
}

/**
 * Login with email and password
 */
export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>('/api/v1/auth/login', credentials, {
    skipAuth: true,
  });

  // Store access token in memory (refresh token is in httpOnly cookie)
  tokenStorage.setAccessToken(response.accessToken);

  return response;
}

/**
 * Logout - clear tokens and call backend to clear cookie
 */
export async function logout(): Promise<void> {
  try {
    // Call backend to clear the httpOnly cookie
    await api.post('/api/v1/auth/logout', undefined, { skipAuth: true });
  } catch {
    // Ignore errors during logout
  }
  tokenStorage.clearTokens();
}

/**
 * Get current user profile
 */
export async function getCurrentUser(): Promise<User> {
  return api.get<User>('/api/v1/users/me');
}

/**
 * Check if user is authenticated (has valid tokens)
 */
export function isAuthenticated(): boolean {
  return tokenStorage.hasTokens();
}

/**
 * Refresh access token using httpOnly cookie
 * Called on page load to restore session
 */
export async function refreshToken(): Promise<AuthResponse> {
  // No need to send refresh token - it's in the httpOnly cookie
  const response = await api.post<AuthResponse>('/api/v1/auth/refresh', undefined, {
    skipAuth: true,
  });

  // Store new access token in memory
  tokenStorage.setAccessToken(response.accessToken);

  return response;
}

export const authApi = {
  register,
  login,
  logout,
  getCurrentUser,
  isAuthenticated,
  refreshToken,
};

export default authApi;
