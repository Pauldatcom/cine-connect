-- Satisfy Supabase Security Advisor: RLS enabled on public tables.
-- The backend connects as the postgres role (Drizzle / DATABASE_URL), which bypasses RLS,
-- so application behavior is unchanged. anon/authenticated via PostgREST see no rows until
-- you add explicit policies (only needed if you query these tables from the Supabase client).

ALTER TABLE "public"."categories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."film_categories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."films" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."password_reset_tokens" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."friends" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."messages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."review_comments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."review_likes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."reviews" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."watchlists" ENABLE ROW LEVEL SECURITY;
