CREATE TABLE "pricing_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"consultation_type" text NOT NULL,
	"format" text NOT NULL,
	"duration" text NOT NULL,
	"price" integer NOT NULL,
	"old_price" integer,
	"description" text NOT NULL,
	"button_text" text DEFAULT 'Записаться' NOT NULL,
	"published" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
INSERT INTO "pricing_items" ("title", "consultation_type", "format", "duration", "price", "old_price", "description", "button_text", "published", "sort_order") VALUES
	('Очно', '1 посещение', 'Очно в кабинете', '50 минут', 7000, NULL, '1 посещение, продолжительность сессии 50 минут', 'Записаться', true, 1),
	('Очно (пакет 7 сессий)', 'Пакет 7 сессий', 'Очно в кабинете', '50 минут', 42000, 49000, '7 посещений, продолжительность сессии 50 минут', 'Записаться', true, 2),
	('Онлайн', '1 посещение', 'Онлайн', '50 минут', 7000, NULL, '1 посещение, продолжительность сессии 50 минут', 'Записаться', true, 3),
	('Онлайн (пакет 7 сессий)', 'Пакет 7 сессий', 'Онлайн', '50 минут', 42000, 49000, '7 посещений, продолжительность сессии 50 минут', 'Записаться', true, 4);
