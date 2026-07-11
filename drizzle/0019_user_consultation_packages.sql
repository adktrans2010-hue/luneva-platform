CREATE TABLE "user_consultation_packages" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "title" text NOT NULL,
  "consultation_format" text DEFAULT 'online' NOT NULL,
  "total_sessions" integer NOT NULL,
  "remaining_sessions" integer NOT NULL,
  "status" text DEFAULT 'active' NOT NULL,
  "paid_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_consultation_packages" ADD CONSTRAINT "user_consultation_packages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "appointment_requests" ADD COLUMN "package_id" uuid;
--> statement-breakpoint
ALTER TABLE "appointment_requests" ADD CONSTRAINT "appointment_requests_package_id_user_consultation_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."user_consultation_packages"("id") ON DELETE set null ON UPDATE no action;
