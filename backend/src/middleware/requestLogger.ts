import type { RequestHandler } from 'express';
import { logger } from '../lib/logger.js';

/**
 * Request logger: one line per request with [backend] prefix.
 * 4xx/5xx are tagged so problems are easy to spot when scanning logs.
 */
export const requestLogger: RequestHandler = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const { method, url } = req;
    const { statusCode } = res;

    const tag = statusCode >= 500 ? ' (server error)' : statusCode >= 400 ? ' (client)' : '';
    const message = `${method} ${url} ${statusCode}${tag} - ${duration}ms`;
    // 401 on refresh with no cookie is expected (first load, bots, E2E) — don't spam WARN
    const expectedRefreshUnauth = statusCode === 401 && String(url).includes('auth/refresh');

    if (statusCode >= 500) {
      logger.error(message);
    } else if (statusCode >= 400 && !expectedRefreshUnauth) {
      logger.warn(message);
    } else {
      logger.info(message);
    }
  });

  next();
};
