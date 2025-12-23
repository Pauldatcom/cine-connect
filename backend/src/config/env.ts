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
      };
    }

    console.error('Invalid environment variables:');
    result.error.errors.forEach((err) => {
      console.error(`  - ${err.path.join('.')}: ${err.message}`);
    });
    process.exit(1);
  }

  return result.data;
}

export const env = validateEnv();
