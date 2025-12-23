import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema/index.js';

const { Pool } = pg;

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/cineconnect',
});
export const db = drizzle(pool, { schema });
export { schema };
