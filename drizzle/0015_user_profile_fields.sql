ALTER TABLE "users" ADD COLUMN "telegram" text;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "time_zone" text DEFAULT 'Europe/Moscow' NOT NULL;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "preferred_contact" text DEFAULT 'telegram' NOT NULL;
