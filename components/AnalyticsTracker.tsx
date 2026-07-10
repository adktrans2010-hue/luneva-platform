"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function getStoredId(key: string) {
  const existing = window.localStorage.getItem(key);

  if (existing) return existing;

  const value = crypto.randomUUID();
  window.localStorage.setItem(key, value);

  return value;
}

export default function AnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin") || pathname.startsWith("/api")) {
      return;
    }

    const query = searchParams.toString();
    const path = query ? `${pathname}?${query}` : pathname;

    void fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        eventType: "page_view",
        path,
        title: document.title,
        referrer: document.referrer,
        visitorId: getStoredId("luneva_visitor_id"),
        sessionId: getStoredId("luneva_session_id"),
      }),
    });
  }, [pathname, searchParams]);

  return null;
}
