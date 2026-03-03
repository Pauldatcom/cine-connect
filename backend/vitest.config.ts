import { resolve } from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/__tests__/**/*.{test,spec}.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    setupFiles: ['./src/__tests__/setup.ts'],
    testTimeout: 10000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      clean: true, // Clean coverage folder before each run
      include: ['src/**/*.ts'],
      exclude: [
        'src/__tests__/**',
        'src/db/migrations/**',
        'src/index.ts', // Server entry point - tested via integration tests
        'src/app.ts', // Express app setup - tested via route tests
        'src/db/index.ts', // DB connection - tested via integration tests
        'src/db/schema/index.ts', // Schema definitions - no logic to test
        'src/config/swagger.ts', // Swagger config - no logic to test
        'src/config/env.ts', // Env validation - runs on import
        'src/socket/index.ts', // Socket handlers - complex integration
        'src/infrastructure/**', // Drizzle repositories - tested via route integration tests
        'src/domain/index.ts', // Re-export file - no logic
        'src/domain/entities/index.ts', // Re-export file - no logic
        'src/domain/repositories/index.ts', // Re-export file - no logic
        'src/application/index.ts', // Re-export file - no logic
        'src/application/use-cases/index.ts', // Re-export file - no logic
        'src/scripts/**', // CLI/seed scripts - run manually, not part of app runtime
        'src/routes/auth.ts', // Auth routes - cookie-heavy, tested via integration
        'src/cron/**', // Scheduler - runs outside request lifecycle
        'src/routes/recommendations.ts', // Recommendations route - optional feature
        'src/application/use-cases/recommendations/**', // Recommendations use-case
        // Not mounted yet; re-enable when respective branches are merged
        'src/domain/repositories/ITmdbClient.ts',
        'src/infrastructure/tmdb/**',
      ],
      thresholds: {
        // feat/backend-core: lower until friends/messages/recommendations branches merged
        statements: 85,
        branches: 84,
        functions: 79,
        lines: 85,
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
