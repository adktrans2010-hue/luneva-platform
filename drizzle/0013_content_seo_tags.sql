ALTER TABLE "certificates" ADD COLUMN "seo_title" text;
--> statement-breakpoint
ALTER TABLE "certificates" ADD COLUMN "seo_description" text;
--> statement-breakpoint
ALTER TABLE "certificates" ADD COLUMN "seo_keywords" text;
--> statement-breakpoint
ALTER TABLE "videos" ADD COLUMN "seo_title" text;
--> statement-breakpoint
ALTER TABLE "videos" ADD COLUMN "seo_description" text;
--> statement-breakpoint
ALTER TABLE "videos" ADD COLUMN "seo_keywords" text;
--> statement-breakpoint
UPDATE "certificates"
SET
  "seo_title" = COALESCE("seo_title", "title"),
  "seo_description" = COALESCE("seo_description", "description", "title"),
  "seo_keywords" = COALESCE("seo_keywords", 'диплом, сертификат, психолог, образование, Лунева Александра');
--> statement-breakpoint
UPDATE "videos"
SET
  "seo_title" = COALESCE("seo_title", "title"),
  "seo_description" = COALESCE("seo_description", "description", "topic", "title"),
  "seo_keywords" = COALESCE("seo_keywords", "topic");
