import { z } from 'zod';
import { config } from 'dotenv';

// Only load .env file if not in test environment
if (process.env.NODE_ENV !== 'test') {
  config();
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000'),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('7d'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),
  FRONTEND_URL: z.string().default('http://localhost:5173'),
  TMDB_API_KEY: z.string().optional(),
  TMDB_BASE_URL: z.string().url().default('https://api.themoviedb.org/3'),
  TMDB_RATE_LIMIT_MS: z.coerce.number().int().min(0).default(300),
});

export type Env = z.infer<typeof envSchema>;

// Parse and validate environment variables
function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    // In test environment, use defaults instead of crashing
    if (process.env.NODE_ENV === 'test') {
      return {
        NODE_ENV: 'test',
        PORT: '3001',
        DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/cineconnect_test',
        JWT_SECRET: 'test-secret-key-for-testing-purposes-only-minimum-32-chars',
        JWT_EXPIRES_IN: '7d',
        JWT_REFRESH_EXPIRES_IN: '30d',
        FRONTEND_URL: 'http://localhost:5173',
        TMDB_API_KEY: undefined,
        TMDB_BASE_URL: 'https://api.themoviedb.org/3',
        TMDB_RATE_LIMIT_MS: 300,
      };
    }

    console.error('Invalid environment variables:');
    result.error.errors.forEach((err) => {
      console.error(`  - ${err.path.join('.')}: ${err.message}`);
    });
    process.exit(1);
  }

  const data = result.data;

  // In production, forbid permissive or dev origins (CORS and cookie security)
  if (data.NODE_ENV === 'production') {
    const url = data.FRONTEND_URL.trim();
    if (url === '*' || url.startsWith('http://localhost') || url.startsWith('http://127.0.0.1')) {
      console.error(
        'Invalid FRONTEND_URL for production: must be the real frontend origin (e.g. https://your-app.vercel.app), not * or localhost.'
      );
      process.exit(1);
    }
  }

  return data;
}

export const env = validateEnv();
