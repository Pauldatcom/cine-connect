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

export interface UpdateProfileInput {
  username?: string;
  avatarUrl?: string | null;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export interface ChangeEmailInput {
  newEmail: string;
  currentPassword: string;
}

/**
 * Register a new user
 */
export async function register(credentials: RegisterCredentials): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>('/api/v1/auth/register', credentials, {
    skipAuth: true,
  });

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

  tokenStorage.setAccessToken(response.accessToken);
  return response;
}

/**
 * Logout - clear tokens and call backend to clear cookie
 */
export async function logout(): Promise<void> {
  try {
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
 * Update current user profile (username, avatar URL)
 */
export async function updateProfile(input: UpdateProfileInput): Promise<User> {
  return api.patch<User>('/api/v1/users/me', input);
}

/**
 * Change password. Requires current password.
 */
export async function changePassword(input: ChangePasswordInput): Promise<void> {
  await api.post<{ message: string }>('/api/v1/auth/change-password', input);
}

/**
 * Change email. Requires current password. Returns new user and access token; caller should update auth state.
 */
export async function changeEmail(input: ChangeEmailInput): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>('/api/v1/auth/change-email', input);
  tokenStorage.setAccessToken(response.accessToken);
  return response;
}

/**
 * Check if user is authenticated (has valid tokens)
 */
export function isAuthenticated(): boolean {
  return tokenStorage.hasTokens();
}

/** In-flight refresh promise so we don't send duplicate refresh requests */
let refreshPromise: Promise<AuthResponse> | null = null;

/**
 * Refresh access token using httpOnly cookie
 * Called on page load to restore session. Dedupes concurrent calls.
 */
export async function refreshToken(): Promise<AuthResponse> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const response = await api.post<AuthResponse>('/api/v1/auth/refresh', undefined, {
        skipAuth: true,
      });
      tokenStorage.setAccessToken(response.accessToken);
      return response;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export const authApi = {
  register,
  login,
  logout,
  getCurrentUser,
  updateProfile,
  changePassword,
  changeEmail,
  isAuthenticated,
  refreshToken,
};

export default authApi;
