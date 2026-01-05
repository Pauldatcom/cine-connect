/**
 * Tests for API Client
 */

import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from 'vitest';
import { api, tokenStorage, ApiError } from '@/lib/api/client';

// Get the mocked localStorage from setup.ts
const mockLocalStorage = window.localStorage as unknown as {
  getItem: Mock;
  setItem: Mock;
  removeItem: Mock;
  clear: Mock;
};

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('tokenStorage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAccessToken', () => {
    it('returns null when no token is stored', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      expect(tokenStorage.getAccessToken()).toBeNull();
    });

    it('returns the stored access token', () => {
      mockLocalStorage.getItem.mockReturnValue('test-token');
      expect(tokenStorage.getAccessToken()).toBe('test-token');
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('cineconnect_access_token');
    });
  });

  describe('getRefreshToken', () => {
    it('returns null when no token is stored', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      expect(tokenStorage.getRefreshToken()).toBeNull();
    });

    it('returns the stored refresh token', () => {
      mockLocalStorage.getItem.mockReturnValue('refresh-token');
      expect(tokenStorage.getRefreshToken()).toBe('refresh-token');
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('cineconnect_refresh_token');
    });
  });

  describe('setTokens', () => {
    it('stores both access and refresh tokens', () => {
      tokenStorage.setTokens('access-123', 'refresh-456');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'cineconnect_access_token',
        'access-123'
      );
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'cineconnect_refresh_token',
        'refresh-456'
      );
    });
  });

  describe('clearTokens', () => {
    it('removes both tokens from storage', () => {
      tokenStorage.clearTokens();
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('cineconnect_access_token');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('cineconnect_refresh_token');
    });
  });

  describe('hasTokens', () => {
    it('returns false when no tokens are stored', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      expect(tokenStorage.hasTokens()).toBe(false);
    });

    it('returns true when access token is stored', () => {
      mockLocalStorage.getItem.mockReturnValue('test-token');
      expect(tokenStorage.hasTokens()).toBe(true);
    });
  });
});

describe('ApiError', () => {
  it('creates error with status and statusText', () => {
    const error = new ApiError(404, 'Not Found');
    expect(error.status).toBe(404);
    expect(error.statusText).toBe('Not Found');
    expect(error.message).toBe('API Error: 404 Not Found');
    expect(error.name).toBe('ApiError');
  });

  it('stores additional data if provided', () => {
    const error = new ApiError(400, 'Bad Request', { error: 'Invalid email' });
    expect(error.data).toEqual({ error: 'Invalid email' });
  });
});

describe('api', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('request with authentication', () => {
    it('adds Authorization header when token exists', async () => {
      mockLocalStorage.getItem.mockReturnValue('my-access-token');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ success: true, data: { id: 1 } }),
      });

      await api.get('/test');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/test',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer my-access-token',
          }),
        })
      );
    });

    it('skips auth header when skipAuth is true', async () => {
      mockLocalStorage.getItem.mockReturnValue('my-access-token');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ success: true, data: {} }),
      });

      await api.post('/auth/login', { email: 'test@test.com' }, { skipAuth: true });

      const callArgs = mockFetch.mock.calls[0] as [string, RequestInit];
      const headers = callArgs[1].headers as Record<string, string>;
      expect(headers['Authorization']).toBeUndefined();
    });

    it('does not add auth header when no token exists', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ success: true, data: {} }),
      });

      await api.get('/public');

      const callArgs = mockFetch.mock.calls[0] as [string, RequestInit];
      const headers = callArgs[1].headers as Record<string, string>;
      expect(headers['Authorization']).toBeUndefined();
    });
  });

  describe('HTTP methods', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ success: true, data: { result: 'ok' } }),
      });
    });

    it('api.get makes GET request', async () => {
      await api.get('/users');
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/users',
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('api.post makes POST request with body', async () => {
      await api.post('/users', { name: 'Test' });
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/users',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ name: 'Test' }),
        })
      );
    });

    it('api.put makes PUT request with body', async () => {
      await api.put('/users/1', { name: 'Updated' });
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/users/1',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ name: 'Updated' }),
        })
      );
    });

    it('api.patch makes PATCH request with body', async () => {
      await api.patch('/users/1', { name: 'Patched' });
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/users/1',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ name: 'Patched' }),
        })
      );
    });

    it('api.delete makes DELETE request', async () => {
      await api.delete('/users/1');
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/users/1',
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  describe('response handling', () => {
    it('returns data from successful JSON response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ success: true, data: { id: 1, name: 'Test' } }),
      });

      const result = await api.get<{ id: number; name: string }>('/test');
      expect(result).toEqual({ id: 1, name: 'Test' });
    });

    it('handles non-JSON responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'text/plain' }),
      });

      const result = await api.get('/health');
      expect(result).toEqual({});
    });

    it('throws ApiError for non-JSON error responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        headers: new Headers({ 'content-type': 'text/plain' }),
      });

      await expect(api.get('/error')).rejects.toThrow(ApiError);
    });

    it('throws ApiError with correct status for non-JSON error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        headers: new Headers({ 'content-type': 'text/plain' }),
      });

      try {
        await api.get('/error');
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(500);
        expect((error as ApiError).statusText).toBe('Internal Server Error');
      }
    });

    it('throws ApiError with data for JSON error responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ success: false, error: 'Invalid input' }),
      });

      try {
        await api.post('/users', {});
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        const apiError = error as ApiError;
        expect(apiError.status).toBe(400);
        expect(apiError.data).toEqual({ success: false, error: 'Invalid input' });
      }
    });
  });
});
