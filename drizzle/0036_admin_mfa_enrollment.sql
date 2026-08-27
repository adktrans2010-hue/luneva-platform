CREATE TABLE IF NOT EXISTS "admin_mfa_enrollments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "account_id" text NOT NULL,
  "token_hash" text NOT NULL,
  "attempts" integer DEFAULT 0 NOT NULL,
  "expires_at" timestamp NOT NULL,
  "used_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "admin_mfa_enrollments_token_unique" ON "admin_mfa_enrollments" ("token_hash");
CREATE INDEX IF NOT EXISTS "admin_mfa_enrollments_account_index" ON "admin_mfa_enrollments" ("account_id");
