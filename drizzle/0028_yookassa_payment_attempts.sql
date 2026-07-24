CREATE TABLE "yookassa_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"appointment_id" uuid NOT NULL,
	"provider" text DEFAULT 'yookassa' NOT NULL,
	"provider_payment_id" text,
	"idempotence_key" text NOT NULL,
	"amount_kopeks" integer NOT NULL,
	"currency" text DEFAULT 'RUB' NOT NULL,
	"status" text DEFAULT 'creating' NOT NULL,
	"provider_status" text,
	"confirmation_url" text,
	"error_code" text,
	"processed_at" timestamp,
	"notified_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "yookassa_payments" ADD CONSTRAINT "yookassa_payments_appointment_id_appointment_requests_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointment_requests"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "yookassa_payments_appointment_idx" ON "yookassa_payments" USING btree ("appointment_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "yookassa_payments_provider_payment_unique" ON "yookassa_payments" USING btree ("provider","provider_payment_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "yookassa_payments_idempotence_key_unique" ON "yookassa_payments" USING btree ("idempotence_key");
