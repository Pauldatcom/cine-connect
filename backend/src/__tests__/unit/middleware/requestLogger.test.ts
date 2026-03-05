/**
 * Request logger middleware tests.
 *
 * HTTP status code ranges (what the logger uses):
 * - 2xx (200–299): Success. Logged as info (console.log). e.g. 200 OK, 201 Created.
 * - 3xx (300–399): Redirect. Logged as info. e.g. 301 Moved Permanently, 304 Not Modified.
 * - 4xx (400–499): Client error — bad request, unauth, not found, etc. Logged as warn
 *   (console.warn), except 401 on auth/refresh (no cookie) which is info (expected).
 * - 5xx (500–599): Server error. Logged as error (console.error).
 *
 * The middleware does NOT use ANSI colors; it uses logger.info/warn/error only.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { requestLogger } from '@/middleware/requestLogger';

describe('requestLogger', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let logSpy: ReturnType<typeof vi.spyOn>;
  let warnSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    mockReq = {
      method: 'GET',
      url: '/api/v1/users',
    };
    mockRes = {
      statusCode: 200,
      on: vi.fn((event: string, callback: () => void) => {
        if (event === 'finish') {
          callback();
        }
        return mockRes as Response;
      }),
    };
    mockNext = vi.fn();
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it('should call next', () => {
    requestLogger(mockReq as Request, mockRes as Response, mockNext);
    expect(mockNext).toHaveBeenCalled();
  });

  it('should log 2xx (success) via logger.info', () => {
    requestLogger(mockReq as Request, mockRes as Response, mockNext);

    expect(logSpy).toHaveBeenCalled();
    const message = logSpy.mock.calls[0]?.[0] as string;
    expect(message).toContain('GET');
    expect(message).toContain('/api/v1/users');
    expect(message).toContain('200');
    expect(warnSpy).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('should log different HTTP methods', () => {
    mockReq.method = 'POST';
    mockReq.url = '/api/v1/auth/login';

    requestLogger(mockReq as Request, mockRes as Response, mockNext);

    const message = logSpy.mock.calls[0]?.[0] as string;
    expect(message).toContain('POST');
    expect(message).toContain('/api/v1/auth/login');
  });

  it('should log 4xx (client error) via logger.warn', () => {
    mockRes.statusCode = 404;

    requestLogger(mockReq as Request, mockRes as Response, mockNext);

    expect(warnSpy).toHaveBeenCalled();
    const message = warnSpy.mock.calls[0]?.[0] as string;
    expect(message).toContain('404');
    expect(message).toContain('(client)');
    expect(logSpy).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('should log 401 on auth/refresh as info (expected when no cookie), not warn', () => {
    mockReq.method = 'POST';
    mockReq.url = '/api/v1/auth/refresh';
    mockRes.statusCode = 401;

    requestLogger(mockReq as Request, mockRes as Response, mockNext);

    expect(logSpy).toHaveBeenCalled();
    const message = logSpy.mock.calls[0]?.[0] as string;
    expect(message).toContain('401');
    expect(message).toContain('auth/refresh');
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('should log 5xx (server error) via logger.error', () => {
    mockRes.statusCode = 500;

    requestLogger(mockReq as Request, mockRes as Response, mockNext);

    expect(errorSpy).toHaveBeenCalled();
    const message = errorSpy.mock.calls[0]?.[0] as string;
    expect(message).toContain('500');
    expect(message).toContain('(server error)');
    expect(logSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('should log 3xx (redirect) via logger.info', () => {
    mockRes.statusCode = 301;

    requestLogger(mockReq as Request, mockRes as Response, mockNext);

    expect(logSpy).toHaveBeenCalled();
    const message = logSpy.mock.calls[0]?.[0] as string;
    expect(message).toContain('301');
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('should log 4xx (e.g. 400 Bad Request) via logger.warn', () => {
    mockRes.statusCode = 400;

    requestLogger(mockReq as Request, mockRes as Response, mockNext);

    expect(warnSpy).toHaveBeenCalled();
    const message = warnSpy.mock.calls[0]?.[0] as string;
    expect(message).toContain('400');
    expect(message).toContain('(client)');
  });

  it('should log 2xx (e.g. 201 Created) via logger.info', () => {
    mockRes.statusCode = 201;

    requestLogger(mockReq as Request, mockRes as Response, mockNext);

    expect(logSpy).toHaveBeenCalled();
    const message = logSpy.mock.calls[0]?.[0] as string;
    expect(message).toContain('201');
  });
});
