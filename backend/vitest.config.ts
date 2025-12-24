import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.ts'],
    setupFiles: ['./src/test/setup.ts'],
    testTimeout: 10000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      clean: true, // Clean coverage folder before each run
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.test.ts',
        'src/**/*.spec.ts',
        'src/test/**',
        'src/db/migrations/**',
        'src/index.ts', // Server entry point - tested via integration tests
        'src/app.ts', // Express app setup - tested via route tests
        'src/db/index.ts', // DB connection - tested via integration tests
        'src/db/schema/index.ts', // Schema definitions - no logic to test
        'src/config/swagger.ts', // Swagger config - no logic to test
        'src/config/env.ts', // Env validation - runs on import
        'src/socket/index.ts', // Socket handlers - complex integration
      ],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
