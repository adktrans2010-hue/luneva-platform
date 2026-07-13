"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import {
  COOKIE_CONSENT_EVENT,
  COOKIE_CONSENT_KEY,
} from "@/components/CookieBanner";

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

    const trackPageView = () => {
      if (window.localStorage.getItem(COOKIE_CONSENT_KEY) !== "accepted") {
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
    };

    trackPageView();
    window.addEventListener(COOKIE_CONSENT_EVENT, trackPageView);

    return () => {
      window.removeEventListener(COOKIE_CONSENT_EVENT, trackPageView);
    };
  }, [pathname, searchParams]);

  return null;
}
