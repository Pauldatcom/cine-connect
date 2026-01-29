/**
 * API Client - Base HTTP client for backend communication
 * Handles auth tokens, refresh, and error handling
 *
 * Security: Access token is stored in memory only (not localStorage)
 * Refresh token is stored as httpOnly cookie by the backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// In-memory token storage (more secure than localStorage)
let accessToken: string | null = null;

// Token management
export const tokenStorage = {
  getAccessToken: (): string | null => {
    return accessToken;
  },

  setAccessToken: (token: string): void => {
    accessToken = token;
  },

  clearTokens: (): void => {
    accessToken = null;
  },

  hasTokens: (): boolean => {
    return !!accessToken;
  },

  // Legacy methods for backward compatibility during migration
  setTokens: (token: string, _refreshToken?: string): void => {
    accessToken = token;
    // Refresh token is now handled by httpOnly cookie, ignore it here
  },

  getRefreshToken: (): string | null => {
    // Refresh token is now in httpOnly cookie, not accessible from JS
    return null;
  },
};

// API Error class
export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public data?: unknown
  ) {
    super(`API Error: ${status} ${statusText}`);
    this.name = 'ApiError';
  }
}

// Request options type
interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  skipAuth?: boolean;
}

// API Response type
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Make an authenticated API request
 */
async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { body, skipAuth = false, ...fetchOptions } = options;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...fetchOptions.headers,
  };

  // Add auth header if we have a token and auth isn't skipped
  const token = !skipAuth ? tokenStorage.getAccessToken() : null;
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...fetchOptions,
    headers,
    credentials: 'include', // Send cookies with requests for refresh token
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    // Handle non-JSON responses
    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      if (!response.ok) {
        console.error('[API] Non-JSON error:', response.status, response.statusText);
        throw new ApiError(response.status, response.statusText);
      }
      return {} as T;
    }

    const data: ApiResponse<T> = await response.json();

    if (!response.ok) {
      console.error('[API] Error response:', response.status, data);
      throw new ApiError(response.status, response.statusText, data);
    }

    return data.data as T;
  } catch (error) {
    console.error('[API] Request failed:', endpoint, error);
    throw error;
  }
}

// HTTP method shortcuts
export const api = {
  get: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'POST', body }),

  put: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'PUT', body }),

  patch: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'PATCH', body }),

  delete: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'DELETE' }),
};

export default api;
