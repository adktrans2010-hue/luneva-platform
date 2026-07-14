import { desc, lt } from "drizzle-orm";

import { db } from "@/src/db";
import { loginAuditLogs } from "@/src/db/schema";
import { getRequestClientIp } from "@/src/lib/rate-limit";

const retentionMs = 90 * 24 * 60 * 60 * 1000;

export async function recordLoginAudit(options: {
  actorType: "admin" | "user";
  email: string;
  success: boolean;
  reason: string;
  headers: Headers;
}) {
  try {
    await db.insert(loginAuditLogs).values({
      actorType: options.actorType,
      email: options.email.trim().toLowerCase().slice(0, 320) || "unknown",
      ipAddress: getRequestClientIp(options.headers).slice(0, 100),
      success: options.success,
      reason: options.reason.slice(0, 200),
      userAgent: options.headers.get("user-agent")?.slice(0, 500) || null,
    });

    await db
      .delete(loginAuditLogs)
      .where(lt(loginAuditLogs.createdAt, new Date(Date.now() - retentionMs)));
  } catch (error) {
    console.error("Login audit write failed", error);
  }
}

export function getRecentLoginAudit(limit = 100) {
  return db
    .select()
    .from(loginAuditLogs)
    .orderBy(desc(loginAuditLogs.createdAt))
    .limit(Math.min(Math.max(limit, 1), 500));
}
