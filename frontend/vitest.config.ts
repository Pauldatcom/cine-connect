import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    testTimeout: 10000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/**/*.spec.{ts,tsx}',
        'src/test/**',
        'src/main.tsx', // Entry point
        'src/routeTree.gen.ts', // Generated file
        'src/vite-env.d.ts', // Type declarations
        'src/routes/**', // Route components - tested via E2E
        'src/components/index.ts', // Barrel export
        'src/components/ui/index.ts', // Barrel export
        'src/components/layout/index.ts', // Barrel export
      ],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 70, // Lower for now - increase as we add more tests
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
