/**
 * HTTP server (after index.ts has loaded .env and optional GCP secrets).
 */

import './infrastructure/auth/passport.js';

import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

import { createApp } from './app.js';
import { setupSocketHandlers } from './socket/index.js';
import { registerDependencies } from './infrastructure/container.js';
import { logger } from './lib/logger.js';
import { startScheduler } from './cron/scheduler.js';

registerDependencies();

const app = createApp();
const httpServer = createServer(app);

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

setupSocketHandlers(io);

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  logger.info(`Server running on http://localhost:${PORT}`);
  logger.info(`API docs at http://localhost:${PORT}/api-docs`);
  startScheduler();
});

export { app, io };
