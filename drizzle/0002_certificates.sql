CREATE TABLE "certificates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"image" text NOT NULL,
	"published" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
INSERT INTO "certificates" ("title", "image", "published", "sort_order") VALUES
	('Диплом 1', '/certificates/cert-1.jpg', true, 1),
	('Диплом 2', '/certificates/cert-2.jpg', true, 2),
	('Диплом 3', '/certificates/cert-3.jpg', true, 3),
	('Диплом 4', '/certificates/cert-4.jpg', true, 4),
	('Диплом 5', '/certificates/cert-5.jpg', true, 5),
	('Диплом 6', '/certificates/cert-6.jpg', true, 6);
