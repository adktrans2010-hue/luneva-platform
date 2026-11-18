ALTER TABLE "appointment_requests" ADD COLUMN IF NOT EXISTS "telemost_conference_id" text;
--> statement-breakpoint
ALTER TABLE "appointment_requests" ADD COLUMN IF NOT EXISTS "telemost_created_at" timestamp;
--> statement-breakpoint
ALTER TABLE "appointment_requests" ADD COLUMN IF NOT EXISTS "telemost_sync_status" text;
--> statement-breakpoint
ALTER TABLE "appointment_requests" ADD COLUMN IF NOT EXISTS "telemost_last_error" text;
