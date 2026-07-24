ALTER TABLE "appointment_requests" ADD COLUMN IF NOT EXISTS "normalized_email" text;
ALTER TABLE "appointment_requests" ADD COLUMN IF NOT EXISTS "hold_expires_at" timestamp;
ALTER TABLE "appointment_requests" ADD COLUMN IF NOT EXISTS "confirmed_at" timestamp;

CREATE TABLE IF NOT EXISTS "account_invitations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "email" text NOT NULL,
  "token_hash" text NOT NULL,
  "appointment_id" uuid,
  "payment_id" uuid,
  "user_id" uuid,
  "expires_at" timestamp NOT NULL,
  "used_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'account_invitations_appointment_id_appointment_requests_id_fk'
  ) THEN
    ALTER TABLE "account_invitations"
      ADD CONSTRAINT "account_invitations_appointment_id_appointment_requests_id_fk"
      FOREIGN KEY ("appointment_id") REFERENCES "appointment_requests"("id") ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'account_invitations_user_id_users_id_fk'
  ) THEN
    ALTER TABLE "account_invitations"
      ADD CONSTRAINT "account_invitations_user_id_users_id_fk"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "account_invitations_token_hash_unique"
  ON "account_invitations" ("token_hash");

CREATE INDEX IF NOT EXISTS "account_invitations_email_idx"
  ON "account_invitations" ("email");
