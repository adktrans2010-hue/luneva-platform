CREATE TABLE "seo_pages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"path" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"canonical" text,
	"structured_data" text,
	"include_in_sitemap" boolean DEFAULT true NOT NULL,
	"noindex" boolean DEFAULT false NOT NULL,
	"priority" text DEFAULT '0.7' NOT NULL,
	"change_frequency" text DEFAULT 'monthly' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "seo_pages_path_unique" ON "seo_pages" USING btree ("path");
--> statement-breakpoint
INSERT INTO "seo_pages" ("path", "title", "description", "canonical", "structured_data", "include_in_sitemap", "noindex", "priority", "change_frequency") VALUES
	('/', 'Психолог Александра Лунева | Luneva Psy', 'Бережная психологическая помощь взрослым и подросткам. Онлайн и очные консультации.', '/', '{"@context":"https://schema.org","@type":"Psychologist","name":"Лунева Александра Александровна","url":"https://luneva-psy.ru","email":"lunevapsy@yandex.ru","telephone":"+7-926-036-06-93","address":[{"@type":"PostalAddress","addressLocality":"Москва","streetAddress":"Кожевнический проезд, дом 4/5, строение 5"},{"@type":"PostalAddress","addressLocality":"Видное","streetAddress":"Калиновая 1, Соседский центр"}]}', true, false, '1.0', 'weekly'),
	('/about', 'О психологе | Александра Лунева', 'Информация об образовании, подходе и профессиональном опыте психолога Александры Луневой.', '/about', NULL, true, false, '0.8', 'monthly'),
	('/help', 'Психологическая помощь | С чем можно обратиться', 'Тревога, панические состояния, травма, отношения, РПП и кризисные состояния.', '/help', NULL, true, false, '0.8', 'monthly'),
	('/reviews', 'Отзывы клиентов | Luneva Psy', 'Отзывы людей, которые обратились за психологической поддержкой.', '/reviews', NULL, true, false, '0.7', 'monthly'),
	('/blog', 'Полезные статьи по психологии | Luneva Psy', 'Материалы о чувствах, отношениях, терапии и внутренней устойчивости.', '/blog', NULL, true, false, '0.7', 'weekly'),
	('/videos', 'Полезные видео по психологии | Luneva Psy', 'Короткие и длинные видео по темам психологии, отношений и тревоги.', '/videos', NULL, true, false, '0.7', 'weekly'),
	('/certificates', 'Дипломы и сертификаты | Александра Лунева', 'Документы о профессиональном образовании и повышении квалификации.', '/certificates', NULL, true, false, '0.6', 'monthly'),
	('/contacts', 'Контакты и запись | Психолог Александра Лунева', 'Способы связи, WhatsApp, email, адреса очного приема и онлайн-запись.', '/contacts', NULL, true, false, '0.9', 'weekly');
