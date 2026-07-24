ALTER TABLE "appointment_requests"
  ADD COLUMN IF NOT EXISTS "attribution" jsonb;
