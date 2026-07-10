import { asc, eq } from "drizzle-orm";

import { db } from "@/src/db";
import { pricingItems } from "@/src/db/schema";

export type PricingItem = typeof pricingItems.$inferSelect;

export async function getPublishedPricingItems() {
  return db
    .select()
    .from(pricingItems)
    .where(eq(pricingItems.published, true))
    .orderBy(asc(pricingItems.sortOrder), asc(pricingItems.createdAt));
}
