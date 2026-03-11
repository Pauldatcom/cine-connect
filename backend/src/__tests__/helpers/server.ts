/**
 * Shared test server helper for integration tests.
 * Supertest requires an http.Server (not raw Express app) to avoid "Cannot read properties of null (reading 'port')".
 */

import http from 'http';
import { createApp } from '@/app';
import { registerDependencies } from '@/infrastructure/container.js';

let server: http.Server | null = null;

/**
 * Create app, register DI, wrap in http.Server. Call closeTestServer() in afterEach.
 */
export function createTestServer(): http.Server {
  registerDependencies();
  const app = createApp();
  server = http.createServer(app);
  return server;
}

/**
 * Close the server if it was created. Use in afterEach. Returns a Promise for vitest.
 */
export function closeTestServer(): Promise<void> {
  return new Promise((resolve) => {
    if (server && server.listening) {
      server.close(() => {
        server = null;
        resolve();
      });
    } else {
      server = null;
      resolve();
    }
  });
}
