CREATE TABLE "analytics_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"visitor_id" text NOT NULL,
	"session_id" text NOT NULL,
	"event_type" text DEFAULT 'page_view' NOT NULL,
	"path" text NOT NULL,
	"title" text,
	"target" text,
	"referrer" text,
	"source" text DEFAULT 'direct' NOT NULL,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "analytics_events_created_at_idx" ON "analytics_events" ("created_at");
--> statement-breakpoint
CREATE INDEX "analytics_events_path_idx" ON "analytics_events" ("path");
--> statement-breakpoint
CREATE INDEX "analytics_events_event_type_idx" ON "analytics_events" ("event_type");
