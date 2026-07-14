import { NextResponse } from "next/server";

import { db } from "@/src/db";
import { analyticsEvents } from "@/src/db/schema";
import { consumeRateLimit, getRequestClientIp } from "@/src/lib/rate-limit";

const allowedEvents = new Set(["page_view", "video_click"]);

function normalizePath(path: string) {
  if (!path.startsWith("/")) return "/";
  return path.slice(0, 500);
}

function getSource(referrer: string | null) {
  if (!referrer) return "Прямой заход";

  try {
    const host = new URL(referrer).hostname.replace(/^www\./, "");

    if (host.includes("localhost") || host.includes("luneva-psy.ru")) {
      return "Внутри сайта";
    }

    if (host.includes("yandex")) return "Яндекс";
    if (host.includes("google")) return "Google";
    if (host.includes("vk.com")) return "VK";
    if (host.includes("t.me") || host.includes("telegram")) return "Telegram";
    if (host.includes("whatsapp")) return "WhatsApp";

    return host;
  } catch {
    return "Другой источник";
  }
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;

  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ success: true });
  }

  const eventType = String(body.eventType ?? "page_view");
  const path = normalizePath(String(body.path ?? "/"));
  const referrer = String(body.referrer ?? "").trim() || null;

  if (!allowedEvents.has(eventType) || path.startsWith("/admin") || path.startsWith("/api")) {
    return NextResponse.json({ success: true });
  }

  const rate = await consumeRateLimit({
    scope: "analytics",
    identifier: getRequestClientIp(request.headers),
    limit: 120,
    windowMs: 60 * 1000,
  });
  if (!rate.allowed) {
    return NextResponse.json({ success: true }, { status: 202 });
  }

  await db.insert(analyticsEvents).values({
    visitorId: String(body.visitorId ?? "").slice(0, 100) || "unknown",
    sessionId: String(body.sessionId ?? "").slice(0, 100) || "unknown",
    eventType,
    path,
    title: String(body.title ?? "").slice(0, 300) || null,
    target: String(body.target ?? "").slice(0, 600) || null,
    referrer,
    source: getSource(referrer),
    userAgent: request.headers.get("user-agent"),
  });

  return NextResponse.json({ success: true });
}
