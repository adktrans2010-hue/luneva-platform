import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  uuid,
  boolean,
  integer,
  index,
  uniqueIndex,
  jsonb,
  check,
} from "drizzle-orm/pg-core";

export const reviewCategories = pgTable(
  "review_categories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    active: boolean("active").default(true).notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("review_categories_name_unique").on(table.name)]
);

export const reviews = pgTable("reviews", {
  id: uuid("id").defaultRandom().primaryKey(),

  name: text("name").notNull(),

  age: text("age"),

  text: text("text").notNull(),

  image: text("image"),

  rating: integer("rating")
    .default(5)
    .notNull(),

  categoryId: uuid("category_id").references(() => reviewCategories.id, {
    onDelete: "set null",
  }),

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

      seoTitle: text("seo_title"),

      seoDescription: text("seo_description"),

      h1: text("h1"),

      image: text("image"),

      faq: text("faq"),

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

export const faqItems = pgTable("faq_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  category: text("category"),
  published: boolean("published").default(true).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const sitePages = pgTable(
  "site_pages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    path: text("path").notNull(),
    eyebrow: text("eyebrow"),
    title: text("title").notNull(),
    intro: text("intro").notNull(),
    content: text("content").notNull(),
    published: boolean("published").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("site_pages_path_unique").on(table.path)]
);

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

    isBlocked: boolean("is_blocked")
      .default(false)
      .notNull(),

    blockedAt: timestamp("blocked_at"),

    deletedAt: timestamp("deleted_at"),

    createdAt: timestamp("created_at")
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull(),
  },
  (table) => [uniqueIndex("users_email_unique").on(table.email)]
);

export const userRegistrationCodes = pgTable(
  "user_registration_codes",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    name: text("name").notNull(),

    email: text("email").notNull(),

    phone: text("phone"),

    passwordHash: text("password_hash").notNull(),

    codeHash: text("code_hash").notNull(),

    attempts: integer("attempts")
      .default(0)
      .notNull(),

    expiresAt: timestamp("expires_at").notNull(),

    createdAt: timestamp("created_at")
      .defaultNow()
      .notNull(),
  },
  (table) => [uniqueIndex("user_registration_codes_email_unique").on(table.email)]
);

export const passwordResetCodes = pgTable(
  "password_reset_codes",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    email: text("email").notNull(),

    codeHash: text("code_hash").notNull(),

    attempts: integer("attempts")
      .default(0)
      .notNull(),

    expiresAt: timestamp("expires_at").notNull(),

    createdAt: timestamp("created_at")
      .defaultNow()
      .notNull(),
  },
  (table) => [uniqueIndex("password_reset_codes_email_unique").on(table.email)]
);

export const accountInvitations = pgTable(
  "account_invitations",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    email: text("email").notNull(),

    tokenHash: text("token_hash").notNull(),

    appointmentId: uuid("appointment_id").references(
      () => appointmentRequests.id,
      { onDelete: "set null" }
    ),

    paymentId: uuid("payment_id"),

    userId: uuid("user_id").references(() => users.id, {
      onDelete: "set null",
    }),

    expiresAt: timestamp("expires_at").notNull(),

    usedAt: timestamp("used_at"),

    createdAt: timestamp("created_at")
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("account_invitations_token_hash_unique").on(table.tokenHash),
    index("account_invitations_email_idx").on(table.email),
  ]
);

export const consultationProducts = pgTable(
  "consultation_products",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    code: text("code").notNull(),

    name: text("name").notNull(),

    shortDescription: text("short_description"),

    fullDescription: text("full_description"),

    sessionsCount: integer("sessions_count").notNull(),

    priceKopeks: integer("price_kopeks").notNull(),

    currency: text("currency")
      .default("RUB")
      .notNull(),

    durationMinutes: integer("duration_minutes").notNull(),

    isActive: boolean("is_active")
      .default(true)
      .notNull(),

    isPublic: boolean("is_public")
      .default(true)
      .notNull(),

    sortOrder: integer("sort_order")
      .default(0)
      .notNull(),

    badge: text("badge"),

    oldPriceKopeks: integer("old_price_kopeks"),

    receiptDescription: text("receipt_description"),

    paymentSubject: text("payment_subject"),

    paymentMode: text("payment_mode"),

    vatCode: integer("vat_code"),

    createdAt: timestamp("created_at")
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull(),

    archivedAt: timestamp("archived_at"),
  },
  (table) => [
    uniqueIndex("consultation_products_code_unique").on(table.code),
    index("consultation_products_public_idx").on(
      table.isActive,
      table.isPublic,
      table.sortOrder
    ),
  ]
);

export const consultationPromotions = pgTable(
  "consultation_promotions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    code: text("code").notNull(),
    campaign: text("campaign"),
    targetProductCode: text("target_product_code").notNull(),
    finalPriceKopeks: integer("final_price_kopeks").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    validFrom: timestamp("valid_from"),
    validUntil: timestamp("valid_until"),
    maxUses: integer("max_uses"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("consultation_promotions_code_unique").on(table.code),
    index("consultation_promotions_active_idx").on(table.isActive),
    check(
      "consultation_promotions_positive_price_check",
      sql`${table.finalPriceKopeks} > 0`
    ),
    check(
      "consultation_promotions_positive_max_uses_check",
      sql`${table.maxUses} IS NULL OR ${table.maxUses} > 0`
    ),
    check(
      "consultation_promotions_valid_dates_check",
      sql`${table.validFrom} IS NULL OR ${table.validUntil} IS NULL OR ${table.validUntil} >= ${table.validFrom}`
    ),
  ]
);

export const appointmentRequests = pgTable("appointment_requests", {
  id: uuid("id").defaultRandom().primaryKey(),

  userId: uuid("user_id").references(() => users.id, {
    onDelete: "set null",
  }),

  packageId: uuid("package_id").references(() => userConsultationPackages.id, {
    onDelete: "set null",
  }),

  productId: uuid("product_id").references(() => consultationProducts.id, {
    onDelete: "set null",
  }),

  name: text("name").notNull(),

  contact: text("contact").notNull(),

  normalizedEmail: text("normalized_email"),

  contactMethod: text("contact_method").notNull(),

  consultationFormat: text("consultation_format")
    .default("online")
    .notNull(),

  consultationLocation: text("consultation_location")
    .default("online")
    .notNull(),

  preferredTime: text("preferred_time"),

  message: text("message").notNull(),

  scheduledAt: timestamp("scheduled_at"),

  notes: text("notes"),

  status: text("status")
    .default("new")
    .notNull(),

  holdExpiresAt: timestamp("hold_expires_at"),

  confirmedAt: timestamp("confirmed_at"),

  paymentMethod: text("payment_method")
    .default("online")
    .notNull(),

  paymentStatus: text("payment_status")
    .default("waiting")
    .notNull(),

  yookassaPaymentId: text("yookassa_payment_id"),

  paymentAmount: integer("payment_amount"),

  promoCodeSnapshot: text("promo_code_snapshot"),

  campaignSnapshot: text("campaign_snapshot"),

  basePriceKopeksSnapshot: integer("base_price_kopeks_snapshot"),

  discountKopeksSnapshot: integer("discount_kopeks_snapshot").default(0).notNull(),

  finalPriceKopeksSnapshot: integer("final_price_kopeks_snapshot"),

  paymentLink: text("payment_link"),

  paymentNote: text("payment_note"),

  attribution: jsonb("attribution"),

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

export const userConsultationPackages = pgTable(
  "user_consultation_packages",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    title: text("title").notNull(),

    productId: uuid("product_id").references(() => consultationProducts.id, {
      onDelete: "set null",
    }),

    paymentId: uuid("payment_id"),

    productCodeSnapshot: text("product_code_snapshot"),

    productNameSnapshot: text("product_name_snapshot"),

    sessionsCountSnapshot: integer("sessions_count_snapshot"),

    priceKopeksSnapshot: integer("price_kopeks_snapshot"),

    currencySnapshot: text("currency_snapshot"),

    durationMinutesSnapshot: integer("duration_minutes_snapshot"),

    receiptDescriptionSnapshot: text("receipt_description_snapshot"),

    consultationFormat: text("consultation_format")
      .default("online")
      .notNull(),

    totalSessions: integer("total_sessions").notNull(),

    usedSessions: integer("used_sessions")
      .default(0)
      .notNull(),

    remainingSessions: integer("remaining_sessions").notNull(),

    status: text("status")
      .default("active")
      .notNull(),

    paidAt: timestamp("paid_at"),

    activatedAt: timestamp("activated_at"),

    expiresAt: timestamp("expires_at"),

    createdAt: timestamp("created_at")
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("user_consultation_packages_payment_unique").on(table.paymentId),
  ]
);

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

export const yookassaPayments = pgTable(
  "yookassa_payments",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    appointmentId: uuid("appointment_id")
      .notNull()
      .references(() => appointmentRequests.id, { onDelete: "cascade" }),

    provider: text("provider")
      .default("yookassa")
      .notNull(),

    providerPaymentId: text("provider_payment_id"),

    idempotenceKey: text("idempotence_key").notNull(),

    amountKopeks: integer("amount_kopeks").notNull(),

    currency: text("currency")
      .default("RUB")
      .notNull(),

    productId: uuid("product_id").references(() => consultationProducts.id, {
      onDelete: "set null",
    }),

    productCodeSnapshot: text("product_code_snapshot"),

    productNameSnapshot: text("product_name_snapshot"),

    sessionsCountSnapshot: integer("sessions_count_snapshot"),

    priceKopeksSnapshot: integer("price_kopeks_snapshot"),

    currencySnapshot: text("currency_snapshot"),

    durationMinutesSnapshot: integer("duration_minutes_snapshot"),

    receiptDescriptionSnapshot: text("receipt_description_snapshot"),

    promoCodeSnapshot: text("promo_code_snapshot"),

    campaignSnapshot: text("campaign_snapshot"),

    basePriceKopeksSnapshot: integer("base_price_kopeks_snapshot"),

    discountKopeksSnapshot: integer("discount_kopeks_snapshot").default(0).notNull(),

    finalPriceKopeksSnapshot: integer("final_price_kopeks_snapshot"),

    status: text("status")
      .default("creating")
      .notNull(),

    providerStatus: text("provider_status"),

    confirmationUrl: text("confirmation_url"),

    errorCode: text("error_code"),

    paidAmountKopeks: integer("paid_amount_kopeks"),

    refundedAmountKopeks: integer("refunded_amount_kopeks")
      .default(0)
      .notNull(),

    capturedAt: timestamp("captured_at"),

    canceledAt: timestamp("canceled_at"),

    fullyRefundedAt: timestamp("fully_refunded_at"),

    processedAt: timestamp("processed_at"),

    notifiedAt: timestamp("notified_at"),

    createdAt: timestamp("created_at")
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("yookassa_payments_appointment_idx").on(table.appointmentId),
    uniqueIndex("yookassa_payments_provider_payment_unique").on(
      table.provider,
      table.providerPaymentId
    ),
    uniqueIndex("yookassa_payments_idempotence_key_unique").on(
      table.idempotenceKey
    ),
  ]
);

export const yookassaRefunds = pgTable(
  "yookassa_refunds",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    paymentId: uuid("payment_id")
      .notNull()
      .references(() => yookassaPayments.id, { onDelete: "cascade" }),

    appointmentId: uuid("appointment_id")
      .notNull()
      .references(() => appointmentRequests.id, { onDelete: "cascade" }),

    providerRefundId: text("provider_refund_id"),

    idempotenceKey: text("idempotence_key").notNull(),

    amountKopeks: integer("amount_kopeks").notNull(),

    currency: text("currency")
      .default("RUB")
      .notNull(),

    type: text("type").notNull(),

    status: text("status")
      .default("created")
      .notNull(),

    providerStatus: text("provider_status"),

    reason: text("reason"),

    requestedBy: text("requested_by")
      .default("admin")
      .notNull(),

    requestedByAdminId: text("requested_by_admin_id"),

    description: text("description"),

    cancellationParty: text("cancellation_party"),

    cancellationReason: text("cancellation_reason"),

    receiptStatus: text("receipt_status"),

    errorCode: text("error_code"),

    createdAt: timestamp("created_at")
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull(),

    processedAt: timestamp("processed_at"),

    notifiedAt: timestamp("notified_at"),
  },
  (table) => [
    index("yookassa_refunds_payment_idx").on(table.paymentId),
    index("yookassa_refunds_appointment_idx").on(table.appointmentId),
    uniqueIndex("yookassa_refunds_provider_refund_unique").on(
      table.providerRefundId
    ),
    uniqueIndex("yookassa_refunds_idempotence_key_unique").on(
      table.idempotenceKey
    ),
  ]
);

export const paymentEvents = pgTable(
  "payment_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    appointmentId: uuid("appointment_id").references(
      () => appointmentRequests.id,
      { onDelete: "set null" }
    ),

    paymentId: uuid("payment_id").references(() => yookassaPayments.id, {
      onDelete: "set null",
    }),

    refundId: uuid("refund_id").references(() => yookassaRefunds.id, {
      onDelete: "set null",
    }),

    eventType: text("event_type").notNull(),

    oldStatus: text("old_status"),

    newStatus: text("new_status"),

    amountKopeks: integer("amount_kopeks"),

    source: text("source")
      .default("site")
      .notNull(),

    actorId: text("actor_id"),

    requestId: text("request_id"),

    metadata: jsonb("metadata"),

    createdAt: timestamp("created_at")
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("payment_events_appointment_idx").on(table.appointmentId),
    index("payment_events_payment_idx").on(table.paymentId),
    index("payment_events_refund_idx").on(table.refundId),
    index("payment_events_created_idx").on(table.createdAt),
  ]
);

export const clientNotifications = pgTable(
  "client_notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    appointmentId: uuid("appointment_id").references(
      () => appointmentRequests.id,
      { onDelete: "set null" }
    ),

    kind: text("kind")
      .default("message")
      .notNull(),

    title: text("title").notNull(),

    message: text("message").notNull(),

    readAt: timestamp("read_at"),

    createdAt: timestamp("created_at")
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("client_notifications_user_created_idx").on(
      table.userId,
      table.createdAt
    ),
  ]
);

export const appointmentAvailability = pgTable(
  "appointment_availability",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    date: text("date").notNull(),

    time: text("time").notNull(),

    consultationFormat: text("consultation_format")
      .default("online")
      .notNull(),

    consultationLocation: text("consultation_location")
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
    uniqueIndex("appointment_availability_date_time_format_location_unique").on(
      table.date,
      table.time,
      table.consultationFormat,
      table.consultationLocation
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

export const adminSettings = pgTable("admin_settings", {
  id: text("id")
    .default("main")
    .primaryKey(),

  email: text("email").notNull(),

  phone: text("phone"),

  passwordHash: text("password_hash"),

  totpSecret: text("totp_secret"),

  totpEnabled: boolean("totp_enabled")
    .default(false)
    .notNull(),

  role: text("role").default("admin").notNull(),

  isActive: boolean("is_active").default(true).notNull(),

  mustChangePassword: boolean("must_change_password")
    .default(false)
    .notNull(),

  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull(),

  createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),
});

export const adminMfaEnrollments = pgTable(
  "admin_mfa_enrollments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    accountId: text("account_id").notNull(),
    tokenHash: text("token_hash").notNull(),
    attempts: integer("attempts").default(0).notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    usedAt: timestamp("used_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("admin_mfa_enrollments_token_unique").on(table.tokenHash),
    index("admin_mfa_enrollments_account_index").on(table.accountId),
  ]
);

export const adminLoginAttempts = pgTable("admin_login_attempts", {
  id: text("id").primaryKey(),
  failedAttempts: integer("failed_attempts").default(0).notNull(),
  windowStartedAt: timestamp("window_started_at").defaultNow().notNull(),
  blockedUntil: timestamp("blocked_until"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const securityRateLimits = pgTable("security_rate_limits", {
  id: text("id").primaryKey(),
  requestCount: integer("request_count").default(0).notNull(),
  windowStartedAt: timestamp("window_started_at").defaultNow().notNull(),
  blockedUntil: timestamp("blocked_until"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const loginAuditLogs = pgTable(
  "login_audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    actorType: text("actor_type").notNull(),
    email: text("email").notNull(),
    ipAddress: text("ip_address").notNull(),
    success: boolean("success").notNull(),
    reason: text("reason").notNull(),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("login_audit_logs_created_at_index").on(table.createdAt)]
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
