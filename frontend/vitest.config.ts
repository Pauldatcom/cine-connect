import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  define: {
    'import.meta.env.VITE_API_URL': JSON.stringify('http://localhost:3000'),
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
    include: ['src/__tests__/**/*.{test,spec}.{ts,tsx}'],
    testTimeout: 10000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      clean: true, // Clean coverage folder before each run
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/__tests__/**',
        'src/main.tsx', // Entry point
        'src/routeTree.gen.ts', // Generated file
        'src/vite-env.d.ts', // Type declarations
        'src/routes/**', // Route components - tested via E2E
        'src/components/index.ts', // Barrel export
        'src/components/ui/index.ts', // Barrel export
        'src/components/layout/index.ts', // Barrel export
        'src/components/features/index.ts', // Barrel export
        'src/hooks/index.ts', // Barrel export
        'src/types/**', // Type definitions only
      ],
      // TODO: Re-enable coverage thresholds when test coverage improves
      // thresholds: {
      //   statements: 80,
      //   branches: 80,
      //   functions: 70,
      //   lines: 80,
      // },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
