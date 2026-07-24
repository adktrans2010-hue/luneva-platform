CREATE TABLE IF NOT EXISTS "consultation_products" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "code" text NOT NULL,
  "name" text NOT NULL,
  "short_description" text,
  "full_description" text,
  "sessions_count" integer NOT NULL,
  "price_kopeks" integer NOT NULL,
  "currency" text DEFAULT 'RUB' NOT NULL,
  "duration_minutes" integer NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "is_public" boolean DEFAULT true NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "badge" text,
  "old_price_kopeks" integer,
  "receipt_description" text,
  "payment_subject" text,
  "payment_mode" text,
  "vat_code" integer,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "archived_at" timestamp
);

CREATE UNIQUE INDEX IF NOT EXISTS "consultation_products_code_unique"
  ON "consultation_products" ("code");

CREATE INDEX IF NOT EXISTS "consultation_products_public_idx"
  ON "consultation_products" ("is_active", "is_public", "sort_order");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'consultation_products_sessions_positive'
  ) THEN
    ALTER TABLE "consultation_products"
      ADD CONSTRAINT "consultation_products_sessions_positive"
      CHECK ("sessions_count" > 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'consultation_products_price_positive'
  ) THEN
    ALTER TABLE "consultation_products"
      ADD CONSTRAINT "consultation_products_price_positive"
      CHECK ("price_kopeks" > 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'consultation_products_currency_rub'
  ) THEN
    ALTER TABLE "consultation_products"
      ADD CONSTRAINT "consultation_products_currency_rub"
      CHECK ("currency" = 'RUB');
  END IF;
END $$;

ALTER TABLE "appointment_requests"
  ADD COLUMN IF NOT EXISTS "product_id" uuid REFERENCES "consultation_products"("id") ON DELETE set null;

ALTER TABLE "user_consultation_packages"
  ADD COLUMN IF NOT EXISTS "product_id" uuid REFERENCES "consultation_products"("id") ON DELETE set null,
  ADD COLUMN IF NOT EXISTS "payment_id" uuid REFERENCES "yookassa_payments"("id") ON DELETE set null,
  ADD COLUMN IF NOT EXISTS "product_code_snapshot" text,
  ADD COLUMN IF NOT EXISTS "product_name_snapshot" text,
  ADD COLUMN IF NOT EXISTS "sessions_count_snapshot" integer,
  ADD COLUMN IF NOT EXISTS "price_kopeks_snapshot" integer,
  ADD COLUMN IF NOT EXISTS "currency_snapshot" text,
  ADD COLUMN IF NOT EXISTS "duration_minutes_snapshot" integer,
  ADD COLUMN IF NOT EXISTS "receipt_description_snapshot" text,
  ADD COLUMN IF NOT EXISTS "used_sessions" integer DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS "activated_at" timestamp,
  ADD COLUMN IF NOT EXISTS "expires_at" timestamp;

CREATE UNIQUE INDEX IF NOT EXISTS "user_consultation_packages_payment_unique"
  ON "user_consultation_packages" ("payment_id");

ALTER TABLE "yookassa_payments"
  ADD COLUMN IF NOT EXISTS "product_id" uuid REFERENCES "consultation_products"("id") ON DELETE set null,
  ADD COLUMN IF NOT EXISTS "product_code_snapshot" text,
  ADD COLUMN IF NOT EXISTS "product_name_snapshot" text,
  ADD COLUMN IF NOT EXISTS "sessions_count_snapshot" integer,
  ADD COLUMN IF NOT EXISTS "price_kopeks_snapshot" integer,
  ADD COLUMN IF NOT EXISTS "currency_snapshot" text,
  ADD COLUMN IF NOT EXISTS "duration_minutes_snapshot" integer,
  ADD COLUMN IF NOT EXISTS "receipt_description_snapshot" text;

INSERT INTO "consultation_products" (
  "code",
  "name",
  "short_description",
  "full_description",
  "sessions_count",
  "price_kopeks",
  "currency",
  "duration_minutes",
  "is_active",
  "is_public",
  "sort_order",
  "receipt_description",
  "payment_subject",
  "payment_mode",
  "vat_code"
) VALUES
  (
    'single-session',
    'Очно или онлайн',
    '1 посещение, продолжительность сессии 50 минут',
    'Одна индивидуальная консультация. Формат встречи выбирается отдельно при записи.',
    1,
    700000,
    'RUB',
    50,
    true,
    true,
    10,
    'Индивидуальная консультация психолога, 50 минут',
    'service',
    'full_prepayment',
    1
  ),
  (
    'package-7',
    'Пакет 7 сессий',
    '7 посещений, продолжительность сессии 50 минут',
    'Пакет из семи индивидуальных консультаций. Формат каждой встречи можно выбирать отдельно.',
    7,
    4200000,
    'RUB',
    50,
    true,
    true,
    20,
    'Пакет индивидуальных консультаций психолога, 7 сессий',
    'service',
    'full_prepayment',
    1
  )
ON CONFLICT ("code") DO UPDATE SET
  "name" = EXCLUDED."name",
  "short_description" = EXCLUDED."short_description",
  "full_description" = EXCLUDED."full_description",
  "sessions_count" = EXCLUDED."sessions_count",
  "price_kopeks" = EXCLUDED."price_kopeks",
  "currency" = EXCLUDED."currency",
  "duration_minutes" = EXCLUDED."duration_minutes",
  "is_active" = EXCLUDED."is_active",
  "is_public" = EXCLUDED."is_public",
  "sort_order" = EXCLUDED."sort_order",
  "receipt_description" = EXCLUDED."receipt_description",
  "payment_subject" = EXCLUDED."payment_subject",
  "payment_mode" = EXCLUDED."payment_mode",
  "vat_code" = EXCLUDED."vat_code",
  "updated_at" = now();
