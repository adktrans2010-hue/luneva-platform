ALTER TABLE "appointment_requests" ADD COLUMN "payment_method" text DEFAULT 'online' NOT NULL;
--> statement-breakpoint
ALTER TABLE "appointment_requests" ADD COLUMN "payment_status" text DEFAULT 'waiting' NOT NULL;
--> statement-breakpoint
ALTER TABLE "appointment_requests" ADD COLUMN "yookassa_payment_id" text;
--> statement-breakpoint
ALTER TABLE "appointment_requests" ADD COLUMN "payment_amount" integer;
--> statement-breakpoint
ALTER TABLE "appointment_requests" ADD COLUMN "payment_link" text;
--> statement-breakpoint
ALTER TABLE "appointment_requests" ADD COLUMN "payment_note" text;
--> statement-breakpoint
ALTER TABLE "appointment_requests" ADD COLUMN "notification_status" text DEFAULT 'not_sent' NOT NULL;
