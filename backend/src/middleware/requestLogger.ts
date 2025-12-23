import type { RequestHandler } from 'express';

/**
 * Simple request logger middleware
 */
export const requestLogger: RequestHandler = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const { method, url } = req;
    const { statusCode } = res;

    const color =
      statusCode >= 500
        ? '\x1b[31m' // red
        : statusCode >= 400
          ? '\x1b[33m' // yellow
          : statusCode >= 300
            ? '\x1b[36m' // cyan
            : '\x1b[32m'; // green

    console.log(`${color}${method}\x1b[0m ${url} ${color}${statusCode}\x1b[0m - ${duration}ms`);
  });

  next();
};
