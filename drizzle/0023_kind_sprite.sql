CREATE TABLE "admin_login_attempts" (
	"id" text PRIMARY KEY NOT NULL,
	"failed_attempts" integer DEFAULT 0 NOT NULL,
	"window_started_at" timestamp DEFAULT now() NOT NULL,
	"blocked_until" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
