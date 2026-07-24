ALTER TABLE "yookassa_payments" ADD COLUMN "paid_amount_kopeks" integer;
--> statement-breakpoint
ALTER TABLE "yookassa_payments" ADD COLUMN "refunded_amount_kopeks" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE "yookassa_payments" ADD COLUMN "captured_at" timestamp;
--> statement-breakpoint
ALTER TABLE "yookassa_payments" ADD COLUMN "canceled_at" timestamp;
--> statement-breakpoint
ALTER TABLE "yookassa_payments" ADD COLUMN "fully_refunded_at" timestamp;
--> statement-breakpoint
CREATE TABLE "yookassa_refunds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payment_id" uuid NOT NULL,
	"appointment_id" uuid NOT NULL,
	"provider_refund_id" text,
	"idempotence_key" text NOT NULL,
	"amount_kopeks" integer NOT NULL,
	"currency" text DEFAULT 'RUB' NOT NULL,
	"type" text NOT NULL,
	"status" text DEFAULT 'created' NOT NULL,
	"provider_status" text,
	"reason" text,
	"requested_by" text DEFAULT 'admin' NOT NULL,
	"requested_by_admin_id" text,
	"description" text,
	"cancellation_party" text,
	"cancellation_reason" text,
	"receipt_status" text,
	"error_code" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"processed_at" timestamp,
	"notified_at" timestamp,
	CONSTRAINT "yookassa_refunds_amount_positive" CHECK ("amount_kopeks" > 0),
	CONSTRAINT "yookassa_refunds_currency_rub" CHECK ("currency" = 'RUB')
);
--> statement-breakpoint
ALTER TABLE "yookassa_refunds" ADD CONSTRAINT "yookassa_refunds_payment_id_yookassa_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."yookassa_payments"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "yookassa_refunds" ADD CONSTRAINT "yookassa_refunds_appointment_id_appointment_requests_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointment_requests"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "yookassa_refunds_payment_idx" ON "yookassa_refunds" USING btree ("payment_id");
--> statement-breakpoint
CREATE INDEX "yookassa_refunds_appointment_idx" ON "yookassa_refunds" USING btree ("appointment_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "yookassa_refunds_provider_refund_unique" ON "yookassa_refunds" USING btree ("provider_refund_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "yookassa_refunds_idempotence_key_unique" ON "yookassa_refunds" USING btree ("idempotence_key");
--> statement-breakpoint
CREATE UNIQUE INDEX "yookassa_refunds_active_full_unique" ON "yookassa_refunds" USING btree ("payment_id") WHERE "type" = 'full' AND "status" IN ('created', 'pending', 'succeeded');
--> statement-breakpoint
CREATE TABLE "payment_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"appointment_id" uuid,
	"payment_id" uuid,
	"refund_id" uuid,
	"event_type" text NOT NULL,
	"old_status" text,
	"new_status" text,
	"amount_kopeks" integer,
	"source" text DEFAULT 'site' NOT NULL,
	"actor_id" text,
	"request_id" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "payment_events" ADD CONSTRAINT "payment_events_appointment_id_appointment_requests_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointment_requests"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "payment_events" ADD CONSTRAINT "payment_events_payment_id_yookassa_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."yookassa_payments"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "payment_events" ADD CONSTRAINT "payment_events_refund_id_yookassa_refunds_id_fk" FOREIGN KEY ("refund_id") REFERENCES "public"."yookassa_refunds"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "payment_events_appointment_idx" ON "payment_events" USING btree ("appointment_id");
--> statement-breakpoint
CREATE INDEX "payment_events_payment_idx" ON "payment_events" USING btree ("payment_id");
--> statement-breakpoint
CREATE INDEX "payment_events_refund_idx" ON "payment_events" USING btree ("refund_id");
--> statement-breakpoint
CREATE INDEX "payment_events_created_idx" ON "payment_events" USING btree ("created_at");
