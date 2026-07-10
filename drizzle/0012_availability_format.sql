ALTER TABLE "appointment_availability" ADD COLUMN "consultation_format" text DEFAULT 'online' NOT NULL;
--> statement-breakpoint
DROP INDEX IF EXISTS "appointment_availability_date_time_unique";
--> statement-breakpoint
CREATE UNIQUE INDEX "appointment_availability_date_time_format_unique" ON "appointment_availability" USING btree ("date", "time", "consultation_format");
