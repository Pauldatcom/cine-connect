import { z } from 'zod';
import { config } from 'dotenv';

// Only load .env file if not in test environment
if (process.env.NODE_ENV !== 'test') {
  config();
}

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.string().default('3000'),
    DATABASE_URL: z.string().min(1),
    JWT_SECRET: z.string().min(32),
    JWT_EXPIRES_IN: z.string().default('7d'),
    JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),
    FRONTEND_URL: z.string().default('http://localhost:5173'),
    /**
     * Public base URL of this API (no trailing slash). Used in password-reset emails so the link
     * hits the backend first (sets httpOnly cookie) then redirects to FRONTEND_URL.
     */
    API_PUBLIC_URL: z.string().url().default('http://localhost:3000'),
    TMDB_API_KEY: z.string().optional(),
    TMDB_BASE_URL: z.string().url().default('https://api.themoviedb.org/3'),
    TMDB_RATE_LIMIT_MS: z.coerce.number().int().min(0).default(300),
    /** Mailgun private API key (Secret Manager in prod). Optional in dev — forgot-password logs the link instead of sending. */
    MAILGUN_API_KEY: z.string().optional(),
    /** Sending domain (e.g. sandbox….mailgun.org or mg.example.com). */
    MAILGUN_DOMAIN: z.string().optional(),
    /** From header, e.g. CinéConnect <noreply@sandbox….mailgun.org> */
    MAILGUN_FROM: z.string().min(1).optional(),
    /** EU accounts use https://api.eu.mailgun.net */
    MAILGUN_API_BASE: z.string().url().default('https://api.eu.mailgun.net'),
  })
  .superRefine((data, ctx) => {
    if (data.NODE_ENV !== 'production') return;
    const missing = (v: string | undefined) => !v?.trim();
    if (missing(data.MAILGUN_API_KEY)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'MAILGUN_API_KEY is required in production for password reset emails',
        path: ['MAILGUN_API_KEY'],
      });
    }
    if (missing(data.MAILGUN_DOMAIN)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'MAILGUN_DOMAIN is required in production',
        path: ['MAILGUN_DOMAIN'],
      });
    }
    if (missing(data.MAILGUN_FROM)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'MAILGUN_FROM is required in production',
        path: ['MAILGUN_FROM'],
      });
    }
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
        PORT: '3000',
        DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/cineconnect_test',
        JWT_SECRET: 'test-secret-key-for-testing-purposes-only-minimum-32-chars',
        JWT_EXPIRES_IN: '7d',
        JWT_REFRESH_EXPIRES_IN: '30d',
        FRONTEND_URL: 'http://localhost:5173',
        API_PUBLIC_URL: 'http://localhost:3000',
        TMDB_API_KEY: undefined,
        TMDB_BASE_URL: 'https://api.themoviedb.org/3',
        TMDB_RATE_LIMIT_MS: 300,
        MAILGUN_API_KEY: undefined,
        MAILGUN_DOMAIN: undefined,
        MAILGUN_FROM: undefined,
        MAILGUN_API_BASE: 'https://api.eu.mailgun.net',
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
    const apiUrl = data.API_PUBLIC_URL.trim();
    if (
      !apiUrl.startsWith('https://') ||
      apiUrl.startsWith('http://localhost') ||
      apiUrl.startsWith('http://127.0.0.1')
    ) {
      console.error(
        'Invalid API_PUBLIC_URL for production: must be your public HTTPS API origin (e.g. https://api.example.run.app), not localhost or http.'
      );
      process.exit(1);
    }
  }

  return data;
}

export const env = validateEnv();
