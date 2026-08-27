import { and, eq, gt, isNull } from "drizzle-orm";

import { db } from "@/src/db";
import { adminMfaEnrollments } from "@/src/db/schema";

export async function replaceAdminMfaEnrollment(accountId: string, tokenHash: string, expiresAt: Date) {
  await db.delete(adminMfaEnrollments).where(and(eq(adminMfaEnrollments.accountId, accountId), isNull(adminMfaEnrollments.usedAt)));
  await db.insert(adminMfaEnrollments).values({ accountId, tokenHash, expiresAt });
}

export async function getActiveAdminMfaEnrollment(accountId: string, tokenHash: string) {
  const [state] = await db
    .select()
    .from(adminMfaEnrollments)
    .where(and(
      eq(adminMfaEnrollments.accountId, accountId),
      eq(adminMfaEnrollments.tokenHash, tokenHash),
      isNull(adminMfaEnrollments.usedAt),
      gt(adminMfaEnrollments.expiresAt, new Date())
    ))
    .limit(1);
  return state ?? null;
}

export async function recordAdminMfaEnrollmentFailure(id: string, attempts: number) {
  await db.update(adminMfaEnrollments).set({ attempts: attempts + 1 }).where(eq(adminMfaEnrollments.id, id));
}

export async function completeAdminMfaEnrollment(id: string) {
  await db.update(adminMfaEnrollments).set({ usedAt: new Date() }).where(and(eq(adminMfaEnrollments.id, id), isNull(adminMfaEnrollments.usedAt)));
}
