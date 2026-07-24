ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "is_blocked" boolean DEFAULT false NOT NULL;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "blocked_at" timestamp;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "deleted_at" timestamp;
