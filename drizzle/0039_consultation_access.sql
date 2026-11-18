ALTER TABLE appointment_requests ADD COLUMN IF NOT EXISTS meeting_url text;
--> statement-breakpoint
ALTER TABLE appointment_requests ADD COLUMN IF NOT EXISTS meeting_available_from timestamp;
--> statement-breakpoint
ALTER TABLE appointment_requests ADD COLUMN IF NOT EXISTS office_address text;
--> statement-breakpoint
ALTER TABLE appointment_requests ADD COLUMN IF NOT EXISTS office_map_url text;
