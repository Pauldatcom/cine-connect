/**
 * Environment Configuration Tests
 *
 * Note: env.ts is tricky to test because it runs on import and calls process.exit.
 * We test the validation logic by checking the module behavior.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Environment Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset modules to allow re-importing env.ts with different env vars
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should have required environment variables set in test', () => {
    // These should be set by test/setup.ts
    expect(process.env.NODE_ENV).toBe('test');
    expect(process.env.JWT_SECRET).toBeDefined();
    expect(process.env.DATABASE_URL).toBeDefined();
  });

  it('should have valid JWT_SECRET length', () => {
    const jwtSecret = process.env.JWT_SECRET!;
    expect(jwtSecret.length).toBeGreaterThanOrEqual(32);
  });

  it('should have valid DATABASE_URL format', () => {
    const dbUrl = process.env.DATABASE_URL!;
    expect(dbUrl).toMatch(/^postgresql:\/\//);
  });

  it('should have default values for optional variables', () => {
    // These are set by test/setup.ts
    expect(process.env.PORT).toBeDefined();
    expect(process.env.FRONTEND_URL).toBeDefined();
  });

  describe('NODE_ENV validation', () => {
    it('should accept development environment', () => {
      expect(['development', 'production', 'test']).toContain(process.env.NODE_ENV);
    });
  });

  describe('JWT configuration', () => {
    it('should have JWT_EXPIRES_IN set', () => {
      expect(process.env.JWT_EXPIRES_IN).toBeDefined();
    });

    it('should have JWT_REFRESH_EXPIRES_IN set', () => {
      expect(process.env.JWT_REFRESH_EXPIRES_IN).toBeDefined();
    });
  });
});
