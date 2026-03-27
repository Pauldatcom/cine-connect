/**
 * Tests for Auth API
 */

import {
  authApi,
  getCurrentUser,
  isAuthenticated,
  login,
  logout,
  refreshToken,
  register,
} from '@/lib/api/auth';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the client module - tokenStorage uses setAccessToken (in-memory), not setTokens/localStorage
vi.mock('@/lib/api/client', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
  tokenStorage: {
    getAccessToken: vi.fn(),
    setAccessToken: vi.fn(),
    clearTokens: vi.fn(),
    hasTokens: vi.fn(),
    setTokens: vi.fn(),
    getRefreshToken: vi.fn(),
  },
}));

import { api, tokenStorage } from '@/lib/api/client';

const mockApi = api as unknown as {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
};

const mockTokenStorage = tokenStorage as unknown as {
  getAccessToken: ReturnType<typeof vi.fn>;
  setAccessToken: ReturnType<typeof vi.fn>;
  clearTokens: ReturnType<typeof vi.fn>;
  hasTokens: ReturnType<typeof vi.fn>;
  setTokens: ReturnType<typeof vi.fn>;
  getRefreshToken: ReturnType<typeof vi.fn>;
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
      expect(mockTokenStorage.setAccessToken).toHaveBeenCalledWith('access-token-123');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('login', () => {
    it('calls login endpoint and stores tokens', async () => {
      const mockResponse = {
        user: { id: '1', email: 'test@test.com', username: 'testuser' },
        accessToken: 'access-token-789',
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
      expect(mockTokenStorage.setAccessToken).toHaveBeenCalledWith('access-token-789');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('logout', () => {
    it('clears stored tokens', async () => {
      mockApi.post.mockResolvedValueOnce(undefined);

      await logout();

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
    it('rejects when refresh API fails (e.g. no cookie)', async () => {
      mockApi.post.mockRejectedValueOnce(new Error('Unauthorized'));

      await expect(refreshToken()).rejects.toThrow();
    });

    it('calls refresh endpoint and stores new access token', async () => {
      const mockResponse = {
        user: { id: '1', email: 'test@test.com', username: 'testuser' },
        accessToken: 'new-access-token',
      };
      mockApi.post.mockResolvedValueOnce(mockResponse);

      const result = await refreshToken();

      expect(mockApi.post).toHaveBeenCalledWith('/api/v1/auth/refresh', undefined, {
        skipAuth: true,
      });
      expect(mockTokenStorage.setAccessToken).toHaveBeenCalledWith('new-access-token');
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
