/**
 * Test Setup
 * Configures the test environment before running tests
 */

// IMPORTANT: reflect-metadata must be imported before anything that uses tsyringe
import 'reflect-metadata';

import { afterAll, afterEach, beforeAll, beforeEach, vi } from 'vitest';

// Mock bcryptjs so Vite never loads the real module (avoids pnpm resolution issues).
// Use plain functions so vi.resetAllMocks() / clearAllMocks() don't wipe the implementation.
vi.mock('bcryptjs', () => ({
  default: {
    hash: (plain: string) => Promise.resolve('mock_hash_' + plain),
    compare: (plain: string, hash: string) => Promise.resolve(hash === 'mock_hash_' + plain),
  },
}));

// Set test environment variables BEFORE any imports that might use them
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-for-testing-purposes-only-minimum-32-chars';
process.env.JWT_EXPIRES_IN = '7d';
process.env.JWT_REFRESH_EXPIRES_IN = '30d';
process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/cineconnect_test';
process.env.FRONTEND_URL = 'http://localhost:5173';
process.env.PORT = '3001';

// Mock console methods to reduce noise in test output
beforeAll(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
  vi.restoreAllMocks();
});

// Clear mocks and reset DI container between tests for isolation
beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.resetAllMocks();
});
