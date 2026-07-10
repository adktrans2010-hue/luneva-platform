import { desc, eq } from "drizzle-orm";

import { db } from "@/src/db";
import { videos } from "@/src/db/schema";

export type Video = typeof videos.$inferSelect;

export async function getPublishedVideos() {
  return db
    .select()
    .from(videos)
    .where(eq(videos.published, true))
    .orderBy(desc(videos.createdAt));
}
