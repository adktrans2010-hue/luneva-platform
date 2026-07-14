import { createHash } from "node:crypto";
import { sql } from "drizzle-orm";

import { db } from "@/src/db";

export type RateLimitOptions = {
  scope: string;
  identifier: string;
  limit: number;
  windowMs: number;
  blockMs?: number;
};

function rateLimitId(scope: string, identifier: string) {
  return createHash("sha256")
    .update(`${scope}|${identifier.trim().toLowerCase()}`)
    .digest("hex");
}

export function getRequestClientIp(headers: Headers) {
  return (
    headers.get("x-real-ip")?.trim() ||
    headers.get("x-forwarded-for")?.split(",").at(-1)?.trim() ||
    "unknown"
  );
}

export async function clearRateLimit(scope: string, identifier: string) {
  const id = rateLimitId(scope, identifier);
  await db.execute(sql`DELETE FROM security_rate_limits WHERE id = ${id}`);
}

export async function consumeRateLimit({
  scope,
  identifier,
  limit,
  windowMs,
  blockMs = windowMs,
}: RateLimitOptions) {
  const id = rateLimitId(scope, identifier);
  const now = new Date();
  const windowBoundary = new Date(now.getTime() - windowMs);
  const nextBlockedUntil = new Date(now.getTime() + blockMs);
  const result = await db.execute(sql`
    INSERT INTO security_rate_limits
      (id, request_count, window_started_at, blocked_until, updated_at)
    VALUES (${id}, 1, ${now}, NULL, ${now})
    ON CONFLICT (id) DO UPDATE SET
      request_count = CASE
        WHEN security_rate_limits.window_started_at < ${windowBoundary} THEN 1
        ELSE security_rate_limits.request_count + 1
      END,
      window_started_at = CASE
        WHEN security_rate_limits.window_started_at < ${windowBoundary} THEN ${now}
        ELSE security_rate_limits.window_started_at
      END,
      blocked_until = CASE
        WHEN security_rate_limits.blocked_until > ${now}
          THEN security_rate_limits.blocked_until
        WHEN (
          CASE
            WHEN security_rate_limits.window_started_at < ${windowBoundary} THEN 1
            ELSE security_rate_limits.request_count + 1
          END
        ) > ${limit} THEN ${nextBlockedUntil}::timestamp
        ELSE NULL
      END,
      updated_at = ${now}
    RETURNING request_count, blocked_until
  `);

  const row = result.rows[0] as
    | { request_count?: number | string; blocked_until?: Date | string | null }
    | undefined;
  const blockedUntil = row?.blocked_until ? new Date(row.blocked_until) : null;

  return {
    allowed: !blockedUntil || blockedUntil.getTime() <= now.getTime(),
    remaining: Math.max(0, limit - Number(row?.request_count ?? 1)),
    retryAfterSeconds: blockedUntil
      ? Math.max(1, Math.ceil((blockedUntil.getTime() - now.getTime()) / 1000))
      : 0,
  };
}
