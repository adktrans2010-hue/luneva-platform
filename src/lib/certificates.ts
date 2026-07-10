import { asc, desc, eq } from "drizzle-orm";

import { db } from "@/src/db";
import { certificates } from "@/src/db/schema";

export type Certificate = typeof certificates.$inferSelect;

export async function getPublishedCertificates() {
  return db
    .select()
    .from(certificates)
    .where(eq(certificates.published, true))
    .orderBy(asc(certificates.sortOrder), desc(certificates.createdAt));
}
