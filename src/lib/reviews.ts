import { eq } from "drizzle-orm";

import { db } from "../db";
import { reviews } from "../db/schema";

export async function getPublishedReviews() {
  const data = await db
    .select()
    .from(reviews)
    .where(eq(reviews.published, true));

  return data;
}

export async function getRandomPublishedReviews(limit = 3) {
  const data = await getPublishedReviews();

  return data.sort(() => Math.random() - 0.5).slice(0, limit);
}