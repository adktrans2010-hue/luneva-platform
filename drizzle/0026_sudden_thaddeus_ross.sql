CREATE TABLE "review_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "rating" integer DEFAULT 5 NOT NULL;--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "category_id" uuid;--> statement-breakpoint
CREATE UNIQUE INDEX "review_categories_name_unique" ON "review_categories" USING btree ("name");--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_category_id_review_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."review_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
INSERT INTO "review_categories" ("name", "sort_order") VALUES
	('Подростки', 10),
	('Тревога', 20),
	('РПП', 30),
	('Отношения', 40),
	('Самооценка', 50),
	('Кризисы', 60),
	('Границы', 70)
ON CONFLICT ("name") DO NOTHING;
