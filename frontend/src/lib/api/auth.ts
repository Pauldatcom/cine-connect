/**
 * Auth API - Authentication endpoints
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
  refreshToken: string;
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

  // Store tokens
  tokenStorage.setTokens(response.accessToken, response.refreshToken);

  return response;
}

/**
 * Login with email and password
 */
export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>('/api/v1/auth/login', credentials, {
    skipAuth: true,
  });

  // Store tokens
  tokenStorage.setTokens(response.accessToken, response.refreshToken);

  return response;
}

/**
 * Logout - clear stored tokens
 */
export function logout(): void {
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
 * Refresh access token
 */
export async function refreshToken(): Promise<AuthResponse> {
  const refreshToken = tokenStorage.getRefreshToken();

  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  const response = await api.post<AuthResponse>(
    '/api/v1/auth/refresh',
    { refreshToken },
    { skipAuth: true }
  );

  // Store new tokens
  tokenStorage.setTokens(response.accessToken, response.refreshToken);

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
