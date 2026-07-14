import { createHash } from "node:crypto";
import { eq, sql } from "drizzle-orm";

import { db } from "@/src/db";
import { adminLoginAttempts } from "@/src/db/schema";

const maxFailures = 5;
const attemptWindowMs = 15 * 60 * 1000;
const blockDurationMs = 30 * 60 * 1000;

function keyFor(ip: string, email: string) {
  return createHash("sha256")
    .update(`${ip.trim()}|${email.trim().toLowerCase()}`)
    .digest("hex");
}

export function getLoginClientIp(headers: Headers) {
  return (
    headers.get("x-real-ip")?.trim() ||
    headers.get("x-forwarded-for")?.split(",").at(-1)?.trim() ||
    "unknown"
  );
}

export async function getLoginBlock(ip: string, email: string) {
  const id = keyFor(ip, email);
  const [attempt] = await db
    .select()
    .from(adminLoginAttempts)
    .where(eq(adminLoginAttempts.id, id))
    .limit(1);

  if (!attempt?.blockedUntil || attempt.blockedUntil.getTime() <= Date.now()) {
    return null;
  }

  return {
    retryAfterSeconds: Math.max(
      1,
      Math.ceil((attempt.blockedUntil.getTime() - Date.now()) / 1000)
    ),
  };
}

export async function recordLoginFailure(ip: string, email: string) {
  const id = keyFor(ip, email);
  const now = new Date();
  const windowBoundary = new Date(now.getTime() - attemptWindowMs);
  const nextBlockedUntil = new Date(now.getTime() + blockDurationMs);
  const result = await db.execute(sql`
    INSERT INTO admin_login_attempts
      (id, failed_attempts, window_started_at, blocked_until, updated_at)
    VALUES (${id}, 1, ${now}, NULL, ${now})
    ON CONFLICT (id) DO UPDATE SET
      failed_attempts = CASE
        WHEN admin_login_attempts.window_started_at < ${windowBoundary} THEN 1
        ELSE admin_login_attempts.failed_attempts + 1
      END,
      window_started_at = CASE
        WHEN admin_login_attempts.window_started_at < ${windowBoundary} THEN ${now}
        ELSE admin_login_attempts.window_started_at
      END,
      blocked_until = CASE
        WHEN (
          CASE
            WHEN admin_login_attempts.window_started_at < ${windowBoundary} THEN 1
            ELSE admin_login_attempts.failed_attempts + 1
          END
        ) >= ${maxFailures} THEN ${nextBlockedUntil}::timestamp
        ELSE NULL
      END,
      updated_at = ${now}
    RETURNING blocked_until
  `);

  const row = result.rows[0] as { blocked_until?: Date | string | null } | undefined;
  return row?.blocked_until ? new Date(row.blocked_until) : null;
}

export async function clearLoginFailures(ip: string, email: string) {
  await db
    .delete(adminLoginAttempts)
    .where(eq(adminLoginAttempts.id, keyFor(ip, email)));
}
