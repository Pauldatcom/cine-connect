/**
 * Express App Configuration
 * Separated from index.ts for testability
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import { setupSwagger } from './config/swagger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';
import { authRouter } from './routes/auth.js';
import { usersRouter } from './routes/users.js';
import { filmsRouter } from './routes/films.js';
import { reviewsRouter } from './routes/reviews.js';
import { messagesRouter } from './routes/messages.js';
import { friendsRouter } from './routes/friends.js';

export function createApp() {
  const app = express();

  // Middleware
  app.use(helmet());
  app.use(
    cors({
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true,
    })
  );
  app.use(express.json());

  // Only log in non-test environment
  if (process.env.NODE_ENV !== 'test') {
    app.use(requestLogger);
  }

  // Swagger documentation
  setupSwagger(app);

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API Routes
  const apiRouter = express.Router();
  apiRouter.use('/auth', authRouter);
  apiRouter.use('/users', usersRouter);
  apiRouter.use('/films', filmsRouter);
  apiRouter.use('/reviews', reviewsRouter);
  apiRouter.use('/messages', messagesRouter);
  apiRouter.use('/friends', friendsRouter);

  app.use('/api/v1', apiRouter);

  // Error handling - must be last
  app.use(errorHandler);

  return app;
}
