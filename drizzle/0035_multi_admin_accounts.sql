ALTER TABLE "admin_settings" ADD COLUMN IF NOT EXISTS "role" text DEFAULT 'admin' NOT NULL;
ALTER TABLE "admin_settings" ADD COLUMN IF NOT EXISTS "is_active" boolean DEFAULT true NOT NULL;
ALTER TABLE "admin_settings" ADD COLUMN IF NOT EXISTS "must_change_password" boolean DEFAULT false NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "admin_settings_email_unique" ON "admin_settings" (lower("email"));
