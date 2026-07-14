import { asc, eq } from "drizzle-orm";

import { db } from "@/src/db";
import { faqItems } from "@/src/db/schema";

export type FaqItem = typeof faqItems.$inferSelect;

export function getPublishedFaqItems() {
  return db
    .select()
    .from(faqItems)
    .where(eq(faqItems.published, true))
    .orderBy(asc(faqItems.sortOrder), asc(faqItems.createdAt));
}
