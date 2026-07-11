import {
  pgTable,
  text,
  timestamp,
  uuid,
  boolean,
  integer,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const reviews = pgTable("reviews", {
  id: uuid("id").defaultRandom().primaryKey(),

  name: text("name").notNull(),

  age: text("age"),

  text: text("text").notNull(),

  image: text("image"),

  published: boolean("published")
    .default(true)
    .notNull(),

  createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),
});

export const articles = pgTable(
  "articles",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    title: text("title").notNull(),

    slug: text("slug").notNull(),

    category: text("category").notNull(),

    excerpt: text("excerpt").notNull(),

    content: text("content").notNull(),

    published: boolean("published")
      .default(false)
      .notNull(),

    createdAt: timestamp("created_at")
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull(),
  },
  (table) => [uniqueIndex("articles_slug_unique").on(table.slug)]
);

export const certificates = pgTable("certificates", {
  id: uuid("id").defaultRandom().primaryKey(),

  title: text("title").notNull(),

  description: text("description"),

  image: text("image").notNull(),

  seoTitle: text("seo_title"),

  seoDescription: text("seo_description"),

  seoKeywords: text("seo_keywords"),

  published: boolean("published")
    .default(true)
    .notNull(),

  sortOrder: integer("sort_order")
    .default(0)
    .notNull(),

  createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),

  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull(),
});

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    name: text("name").notNull(),

    email: text("email").notNull(),

    phone: text("phone"),

    telegram: text("telegram"),

    timeZone: text("time_zone")
      .default("Europe/Moscow")
      .notNull(),

    preferredContact: text("preferred_contact")
      .default("telegram")
      .notNull(),

    passwordHash: text("password_hash").notNull(),

    createdAt: timestamp("created_at")
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull(),
  },
  (table) => [uniqueIndex("users_email_unique").on(table.email)]
);

export const appointmentRequests = pgTable("appointment_requests", {
  id: uuid("id").defaultRandom().primaryKey(),

  userId: uuid("user_id").references(() => users.id, {
    onDelete: "set null",
  }),

  name: text("name").notNull(),

  contact: text("contact").notNull(),

  contactMethod: text("contact_method").notNull(),

  consultationFormat: text("consultation_format")
    .default("online")
    .notNull(),

  preferredTime: text("preferred_time"),

  message: text("message").notNull(),

  scheduledAt: timestamp("scheduled_at"),

  notes: text("notes"),

  status: text("status")
    .default("new")
    .notNull(),

  paymentMethod: text("payment_method")
    .default("online")
    .notNull(),

  paymentStatus: text("payment_status")
    .default("waiting")
    .notNull(),

  yookassaPaymentId: text("yookassa_payment_id"),

  paymentAmount: integer("payment_amount"),

  paymentLink: text("payment_link"),

  paymentNote: text("payment_note"),

  notificationStatus: text("notification_status")
    .default("not_sent")
    .notNull(),

  createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),

  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull(),
});

export const appointmentHistory = pgTable("appointment_history", {
  id: uuid("id").defaultRandom().primaryKey(),

  appointmentId: uuid("appointment_id")
    .notNull()
    .references(() => appointmentRequests.id, { onDelete: "cascade" }),

  action: text("action").notNull(),

  details: text("details"),

  createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),
});

export const appointmentAvailability = pgTable(
  "appointment_availability",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    date: text("date").notNull(),

    time: text("time").notNull(),

    consultationFormat: text("consultation_format")
      .default("online")
      .notNull(),

    enabled: boolean("enabled")
      .default(true)
      .notNull(),

    createdAt: timestamp("created_at")
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("appointment_availability_date_time_format_unique").on(
      table.date,
      table.time,
      table.consultationFormat
    ),
  ]
);

export const videos = pgTable("videos", {
  id: uuid("id").defaultRandom().primaryKey(),

  title: text("title").notNull(),

  description: text("description"),

  topic: text("topic").notNull(),

  type: text("type").notNull(),

  url: text("url").notNull(),

  platform: text("platform"),

  seoTitle: text("seo_title"),

  seoDescription: text("seo_description"),

  seoKeywords: text("seo_keywords"),

  published: boolean("published")
    .default(false)
    .notNull(),

  createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),

  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull(),
});

export const pricingItems = pgTable("pricing_items", {
  id: uuid("id").defaultRandom().primaryKey(),

  title: text("title").notNull(),

  consultationType: text("consultation_type").notNull(),

  format: text("format").notNull(),

  duration: text("duration").notNull(),

  price: integer("price").notNull(),

  oldPrice: integer("old_price"),

  description: text("description").notNull(),

  buttonText: text("button_text")
    .default("Записаться")
    .notNull(),

  published: boolean("published")
    .default(true)
    .notNull(),

  sortOrder: integer("sort_order")
    .default(0)
    .notNull(),

  createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),

  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull(),
});

export const seoPages = pgTable(
  "seo_pages",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    path: text("path").notNull(),

    title: text("title").notNull(),

    description: text("description").notNull(),

    canonical: text("canonical"),

    structuredData: text("structured_data"),

    includeInSitemap: boolean("include_in_sitemap")
      .default(true)
      .notNull(),

    noindex: boolean("noindex")
      .default(false)
      .notNull(),

    priority: text("priority")
      .default("0.7")
      .notNull(),

    changeFrequency: text("change_frequency")
      .default("monthly")
      .notNull(),

    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull(),

    createdAt: timestamp("created_at")
      .defaultNow()
      .notNull(),
  },
  (table) => [uniqueIndex("seo_pages_path_unique").on(table.path)]
);

export const analyticsEvents = pgTable("analytics_events", {
  id: uuid("id").defaultRandom().primaryKey(),

  visitorId: text("visitor_id").notNull(),

  sessionId: text("session_id").notNull(),

  eventType: text("event_type")
    .default("page_view")
    .notNull(),

  path: text("path").notNull(),

  title: text("title"),

  target: text("target"),

  referrer: text("referrer"),

  source: text("source")
    .default("direct")
    .notNull(),

  userAgent: text("user_agent"),

  createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),
});
