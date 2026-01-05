import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { requestLogger } from '@/middleware/requestLogger';

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

  // What is consoelLogSpy to research, use logger.info or logger or logger.error or even logger.warning
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
  // Why did you dit that, doest need to have different colors for status code
  it('should use red color for 500+ status codes', () => {
    mockRes.statusCode = 500;

    requestLogger(mockReq as Request, mockRes as Response, mockNext);

    const logMessage = consoleLogSpy.mock.calls[0]?.[0] as string;
    // Red color escape code
    expect(logMessage).toContain('\x1b[31m');
    expect(logMessage).toContain('500');
  });

  it('should use cyan color for 300+ status codes', () => {
    mockRes.statusCode = 301;

    requestLogger(mockReq as Request, mockRes as Response, mockNext);

    const logMessage = consoleLogSpy.mock.calls[0]?.[0] as string;
    // Cyan color escape code
    expect(logMessage).toContain('\x1b[36m');
    expect(logMessage).toContain('301');
  });

  it('should use yellow color for 400+ status codes', () => {
    mockRes.statusCode = 400;

    requestLogger(mockReq as Request, mockRes as Response, mockNext);

    const logMessage = consoleLogSpy.mock.calls[0]?.[0] as string;
    // Yellow color escape code
    expect(logMessage).toContain('\x1b[33m');
    expect(logMessage).toContain('400');
  });

  it('should use green color for 200+ status codes', () => {
    mockRes.statusCode = 201;

    requestLogger(mockReq as Request, mockRes as Response, mockNext);

    const logMessage = consoleLogSpy.mock.calls[0]?.[0] as string;
    // Green color escape code
    expect(logMessage).toContain('\x1b[32m');
    expect(logMessage).toContain('201');
  });
});
