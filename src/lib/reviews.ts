import { asc, desc, eq } from "drizzle-orm";

import { db } from "../db";
import { reviewCategories, reviews } from "../db/schema";

export async function getPublishedReviews() {
  const data = await db
    .select()
    .from(reviews)
    .where(eq(reviews.published, true))
    .orderBy(desc(reviews.createdAt));

  return data;
}

export async function getRandomPublishedReviews(limit = 3) {
  const data = await getPublishedReviews();

  return data.sort(() => Math.random() - 0.5).slice(0, limit);
}

export async function getActiveReviewCategories() {
  return db
    .select()
    .from(reviewCategories)
    .where(eq(reviewCategories.active, true))
    .orderBy(asc(reviewCategories.sortOrder), asc(reviewCategories.name));
}
