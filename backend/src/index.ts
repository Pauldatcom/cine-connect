/**
 * Server Entry Point
 * Initializes and starts the HTTP server with Socket.IO support
 */

import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { config } from 'dotenv';

import { createApp } from './app.js';
import { setupSocketHandlers } from './socket/index.js';

// Load environment variables
config();

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
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📚 API Docs available at http://localhost:${PORT}/api-docs`);
});

export { app, io };
