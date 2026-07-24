CREATE TABLE "client_notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"appointment_id" uuid,
	"kind" text DEFAULT 'message' NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP INDEX "appointment_availability_date_time_format_unique";--> statement-breakpoint
ALTER TABLE "appointment_availability" ADD COLUMN "consultation_location" text DEFAULT 'online' NOT NULL;--> statement-breakpoint
ALTER TABLE "appointment_requests" ADD COLUMN "consultation_location" text DEFAULT 'online' NOT NULL;--> statement-breakpoint
UPDATE "appointment_availability"
SET "consultation_location" = 'moscow'
WHERE "consultation_format" = 'office';--> statement-breakpoint
UPDATE "appointment_requests"
SET "consultation_location" = 'moscow'
WHERE "consultation_format" = 'office';--> statement-breakpoint
ALTER TABLE "client_notifications" ADD CONSTRAINT "client_notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_notifications" ADD CONSTRAINT "client_notifications_appointment_id_appointment_requests_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointment_requests"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "client_notifications_user_created_idx" ON "client_notifications" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "appointment_availability_date_time_format_location_unique" ON "appointment_availability" USING btree ("date","time","consultation_format","consultation_location");
