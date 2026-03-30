-- Session invalidation: refresh tokens issued before password_changed_at are rejected.
ALTER TABLE "users" ADD COLUMN "password_changed_at" timestamp;
UPDATE "users" SET "password_changed_at" = "updated_at" WHERE "password_changed_at" IS NULL;
ALTER TABLE "users" ALTER COLUMN "password_changed_at" SET DEFAULT now();
ALTER TABLE "users" ALTER COLUMN "password_changed_at" SET NOT NULL;
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" varchar(64) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "password_reset_tokens_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users" ("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "password_reset_tokens_user_id_idx" ON "password_reset_tokens" USING btree ("user_id");
--> statement-breakpoint
ALTER TABLE "films" ADD COLUMN "backdrop" text;
