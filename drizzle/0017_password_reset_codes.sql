CREATE TABLE "password_reset_codes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "email" text NOT NULL,
  "code_hash" text NOT NULL,
  "attempts" integer DEFAULT 0 NOT NULL,
  "expires_at" timestamp NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "password_reset_codes_email_unique" ON "password_reset_codes" USING btree ("email");
