/**
 * Express App Configuration
 * Separated from index.ts for testability
 */

import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';

import { setupSwagger } from './config/swagger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';
import { authRouter } from './routes/auth.js';
import { filmsRouter } from './routes/films.js';
import { friendsRouter } from './routes/friends.js';
import { reviewsRouter } from './routes/reviews.js';
import { usersRouter } from './routes/users.js';
import { watchlistRouter } from './routes/watchlist.js';

export function createApp() {
  const app = express();

  // Middleware
  app.use(helmet());
  app.use(
    cors({
      origin:
        process.env.NODE_ENV === 'production'
          ? process.env.FRONTEND_URL
          : [
              'http://localhost:5173',
              'http://localhost:5174',
              'http://localhost:5175',
              'http://localhost:3000',
            ],
      credentials: true,
    })
  );
  app.use(express.json());
  app.use(cookieParser());

  // Only log in non-test environment
  if (process.env.NODE_ENV !== 'test') {
    app.use(requestLogger);
  }

  // Swagger documentation
  setupSwagger(app);

  // Health check
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API Routes
  const apiRouter = express.Router();

  // Skip rate limits when not in production (dev + E2E need many auth calls)
  const skipRateLimit = () => process.env.NODE_ENV !== 'production';

  // Global API rate limit: reduce scraping and DoS (health is on app, not apiRouter, so excluded)
  const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // 200 requests per window per IP
    message: { success: false, error: 'Too many requests. Try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
    skip: skipRateLimit,
  });
  apiRouter.use(globalLimiter);

  // Rate limit auth routes (login, register, refresh) to mitigate brute-force
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // 20 requests per window per IP
    message: { success: false, error: 'Too many attempts. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
    skip: skipRateLimit,
  });
  apiRouter.use('/auth', authLimiter, authRouter);
  apiRouter.use('/users', usersRouter);
  apiRouter.use('/films', filmsRouter);
  apiRouter.use('/friends', friendsRouter);
  apiRouter.use('/reviews', reviewsRouter);
  apiRouter.use('/watchlist', watchlistRouter);

  app.use('/api/v1', apiRouter);

  // Redirect non-API GET requests to frontend (avoids 404 when opening e.g. http://localhost:3000/profil)
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  app.get('*', (req, res, next) => {
    if (
      req.method !== 'GET' ||
      req.path.startsWith('/api') ||
      req.path === '/health' ||
      req.path.startsWith('/socket.io') ||
      req.path.startsWith('/swagger')
    ) {
      return next();
    }
    res.redirect(302, `${frontendUrl}${req.originalUrl}`);
  });

  // Error handling - must be last
  app.use(errorHandler);

  return app;
}
