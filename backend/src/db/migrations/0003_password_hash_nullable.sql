-- OAuth-only users (e.g. Google) have no local password; aligns with Drizzle schema.
ALTER TABLE "users" ALTER COLUMN "password_hash" DROP NOT NULL;
