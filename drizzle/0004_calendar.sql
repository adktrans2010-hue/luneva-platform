ALTER TABLE "appointment_requests" ADD COLUMN "scheduled_at" timestamp;
--> statement-breakpoint
ALTER TABLE "appointment_requests" ADD COLUMN "notes" text;
--> statement-breakpoint
CREATE TABLE "appointment_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"appointment_id" uuid NOT NULL,
	"action" text NOT NULL,
	"details" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "appointment_history" ADD CONSTRAINT "appointment_history_appointment_id_appointment_requests_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "appointment_requests"("id") ON DELETE cascade ON UPDATE no action;
