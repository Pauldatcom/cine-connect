/**
 * Server Entry Point
 * Initializes and starts the HTTP server with Socket.IO support
 */

// IMPORTANT: reflect-metadata must be imported before anything that uses decorators
import 'reflect-metadata';

import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { config } from 'dotenv';

import { createApp } from './app.js';
import { setupSocketHandlers } from './socket/index.js';
import { registerDependencies } from './infrastructure/container.js';
import { startScheduler } from './cron/scheduler.js';
import { logger } from './lib/logger.js';

// Load environment variables
config();

// Register DI container dependencies
registerDependencies();

// Optional in-process cron (ENABLE_CRON=true). See docs/CRON.md.
startScheduler();

const app = createApp();
const httpServer = createServer(app);

// Socket.IO setup
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Socket.IO handlers
setupSocketHandlers(io);

// Start server
const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
  logger.info(`Server running on http://localhost:${PORT}`);
  logger.info(`API docs at http://localhost:${PORT}/api-docs`);
});

export { app, io };
