-- Google OAuth columns: in Drizzle schema but were missing from the journal-backed chain.
-- Idempotent: safe if columns already exist (e.g. manual fix on Supabase).
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "google_id" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "auth_provider" text DEFAULT 'local';--> statement-breakpoint
DO $migration$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE t.relname = 'users'
      AND c.conname = 'users_google_id_unique'
  ) THEN
    ALTER TABLE "users" ADD CONSTRAINT "users_google_id_unique" UNIQUE ("google_id");
  END IF;
END
$migration$;
