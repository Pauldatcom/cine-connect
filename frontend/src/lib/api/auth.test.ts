/**
 * Tests for Auth API
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  login,
  register,
  logout,
  getCurrentUser,
  isAuthenticated,
  refreshToken,
  authApi,
} from './auth';
import { tokenStorage } from './client';

// Mock the client module
vi.mock('./client', async () => {
  const actual = await vi.importActual('./client');
  return {
    ...actual,
    api: {
      get: vi.fn(),
      post: vi.fn(),
    },
    tokenStorage: {
      getAccessToken: vi.fn(),
      getRefreshToken: vi.fn(),
      setTokens: vi.fn(),
      clearTokens: vi.fn(),
      hasTokens: vi.fn(),
    },
  };
});

import { api } from './client';

const mockApi = api as unknown as {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
};

const mockTokenStorage = tokenStorage as unknown as {
  getAccessToken: ReturnType<typeof vi.fn>;
  getRefreshToken: ReturnType<typeof vi.fn>;
  setTokens: ReturnType<typeof vi.fn>;
  clearTokens: ReturnType<typeof vi.fn>;
  hasTokens: ReturnType<typeof vi.fn>;
};

describe('Auth API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('register', () => {
    it('calls register endpoint and stores tokens', async () => {
      const mockResponse = {
        user: { id: '1', email: 'test@test.com', username: 'testuser' },
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-456',
      };
      mockApi.post.mockResolvedValueOnce(mockResponse);

      const result = await register({
        email: 'test@test.com',
        username: 'testuser',
        password: 'password123',
      });

      expect(mockApi.post).toHaveBeenCalledWith(
        '/api/v1/auth/register',
        { email: 'test@test.com', username: 'testuser', password: 'password123' },
        { skipAuth: true }
      );
      expect(mockTokenStorage.setTokens).toHaveBeenCalledWith(
        'access-token-123',
        'refresh-token-456'
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('login', () => {
    it('calls login endpoint and stores tokens', async () => {
      const mockResponse = {
        user: { id: '1', email: 'test@test.com', username: 'testuser' },
        accessToken: 'access-token-789',
        refreshToken: 'refresh-token-012',
      };
      mockApi.post.mockResolvedValueOnce(mockResponse);

      const result = await login({
        email: 'test@test.com',
        password: 'password123',
      });

      expect(mockApi.post).toHaveBeenCalledWith(
        '/api/v1/auth/login',
        { email: 'test@test.com', password: 'password123' },
        { skipAuth: true }
      );
      expect(mockTokenStorage.setTokens).toHaveBeenCalledWith(
        'access-token-789',
        'refresh-token-012'
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('logout', () => {
    it('clears stored tokens', () => {
      logout();
      expect(mockTokenStorage.clearTokens).toHaveBeenCalled();
    });
  });

  describe('getCurrentUser', () => {
    it('fetches current user from API', async () => {
      const mockUser = {
        id: '1',
        email: 'test@test.com',
        username: 'testuser',
        avatarUrl: null,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };
      mockApi.get.mockResolvedValueOnce(mockUser);

      const result = await getCurrentUser();

      expect(mockApi.get).toHaveBeenCalledWith('/api/v1/users/me');
      expect(result).toEqual(mockUser);
    });
  });

  describe('isAuthenticated', () => {
    it('returns true when tokens exist', () => {
      mockTokenStorage.hasTokens.mockReturnValueOnce(true);
      expect(isAuthenticated()).toBe(true);
    });

    it('returns false when no tokens exist', () => {
      mockTokenStorage.hasTokens.mockReturnValueOnce(false);
      expect(isAuthenticated()).toBe(false);
    });
  });

  describe('refreshToken', () => {
    it('throws error when no refresh token available', async () => {
      mockTokenStorage.getRefreshToken.mockReturnValueOnce(null);

      await expect(refreshToken()).rejects.toThrow('No refresh token available');
    });

    it('calls refresh endpoint and stores new tokens', async () => {
      mockTokenStorage.getRefreshToken.mockReturnValueOnce('old-refresh-token');
      const mockResponse = {
        user: { id: '1', email: 'test@test.com', username: 'testuser' },
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      };
      mockApi.post.mockResolvedValueOnce(mockResponse);

      const result = await refreshToken();

      expect(mockApi.post).toHaveBeenCalledWith(
        '/api/v1/auth/refresh',
        { refreshToken: 'old-refresh-token' },
        { skipAuth: true }
      );
      expect(mockTokenStorage.setTokens).toHaveBeenCalledWith(
        'new-access-token',
        'new-refresh-token'
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('authApi object', () => {
    it('exports all auth functions', () => {
      expect(authApi.register).toBe(register);
      expect(authApi.login).toBe(login);
      expect(authApi.logout).toBe(logout);
      expect(authApi.getCurrentUser).toBe(getCurrentUser);
      expect(authApi.isAuthenticated).toBe(isAuthenticated);
      expect(authApi.refreshToken).toBe(refreshToken);
    });
  });
});
