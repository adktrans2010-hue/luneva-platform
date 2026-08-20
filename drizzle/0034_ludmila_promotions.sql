CREATE TABLE IF NOT EXISTS "consultation_promotions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "code" text NOT NULL,
  "campaign" text,
  "target_product_code" text NOT NULL,
  "final_price_kopeks" integer NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "valid_from" timestamp,
  "valid_until" timestamp,
  "max_uses" integer,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "consultation_promotions_positive_price_check"
    CHECK ("final_price_kopeks" > 0),
  CONSTRAINT "consultation_promotions_positive_max_uses_check"
    CHECK ("max_uses" IS NULL OR "max_uses" > 0),
  CONSTRAINT "consultation_promotions_valid_dates_check"
    CHECK ("valid_from" IS NULL OR "valid_until" IS NULL OR "valid_until" >= "valid_from")
);

CREATE UNIQUE INDEX IF NOT EXISTS "consultation_promotions_code_unique"
  ON "consultation_promotions" ("code");
CREATE INDEX IF NOT EXISTS "consultation_promotions_active_idx"
  ON "consultation_promotions" ("is_active");

ALTER TABLE "appointment_requests"
  ADD COLUMN IF NOT EXISTS "promo_code_snapshot" text,
  ADD COLUMN IF NOT EXISTS "campaign_snapshot" text,
  ADD COLUMN IF NOT EXISTS "base_price_kopeks_snapshot" integer,
  ADD COLUMN IF NOT EXISTS "discount_kopeks_snapshot" integer DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS "final_price_kopeks_snapshot" integer;

ALTER TABLE "yookassa_payments"
  ADD COLUMN IF NOT EXISTS "promo_code_snapshot" text,
  ADD COLUMN IF NOT EXISTS "campaign_snapshot" text,
  ADD COLUMN IF NOT EXISTS "base_price_kopeks_snapshot" integer,
  ADD COLUMN IF NOT EXISTS "discount_kopeks_snapshot" integer DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS "final_price_kopeks_snapshot" integer;

INSERT INTO "consultation_promotions" (
  "code", "campaign", "target_product_code", "final_price_kopeks", "is_active", "max_uses"
) VALUES (
  'LUDMILA', 'ludmila', 'single-session', 500000, true, NULL
)
ON CONFLICT ("code") DO NOTHING;
