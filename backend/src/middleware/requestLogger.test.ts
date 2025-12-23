import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { requestLogger } from './requestLogger.js';

describe('requestLogger', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

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
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  it('should call next', () => {
    requestLogger(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });

  it('should log request on response finish', () => {
    requestLogger(mockReq as Request, mockRes as Response, mockNext);

    expect(consoleLogSpy).toHaveBeenCalled();
    const logMessage = consoleLogSpy.mock.calls[0]?.[0] as string;
    expect(logMessage).toContain('GET');
    expect(logMessage).toContain('/api/v1/users');
    expect(logMessage).toContain('200');
  });

  it('should log different HTTP methods', () => {
    mockReq.method = 'POST';
    mockReq.url = '/api/v1/auth/login';

    requestLogger(mockReq as Request, mockRes as Response, mockNext);

    const logMessage = consoleLogSpy.mock.calls[0]?.[0] as string;
    expect(logMessage).toContain('POST');
    expect(logMessage).toContain('/api/v1/auth/login');
  });

  it('should log different status codes', () => {
    mockRes.statusCode = 404;

    requestLogger(mockReq as Request, mockRes as Response, mockNext);

    const logMessage = consoleLogSpy.mock.calls[0]?.[0] as string;
    expect(logMessage).toContain('404');
  });
});
