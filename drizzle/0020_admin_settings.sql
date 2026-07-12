CREATE TABLE "admin_settings" (
  "id" text PRIMARY KEY DEFAULT 'main' NOT NULL,
  "email" text NOT NULL,
  "phone" text,
  "totp_secret" text,
  "totp_enabled" boolean DEFAULT false NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
