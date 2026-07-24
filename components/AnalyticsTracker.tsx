"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import {
  COOKIE_CONSENT_EVENT,
  COOKIE_CONSENT_KEY,
} from "@/components/CookieBanner";
import {
  captureAttribution,
  getAttribution,
  getSessionId,
  getVisitorId,
  trackGoal,
} from "@/src/lib/client-analytics";

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

      captureAttribution(searchParams);

      const query = searchParams.toString();
      const path = query ? `${pathname}?${query}` : pathname;
      const metrikaId = Number(process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID);

      if (
        process.env.NODE_ENV === "production" &&
        Number.isInteger(metrikaId) &&
        metrikaId > 0 &&
        typeof window.ym === "function"
      ) {
        window.ym(metrikaId, "hit", path);
      }

      void fetch("/api/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        keepalive: true,
        body: JSON.stringify({
          eventType: "page_view",
          path,
          title: document.title,
          referrer: document.referrer,
          visitorId: getVisitorId(),
          sessionId: getSessionId(),
          attribution: getAttribution(),
        }),
      });
    };

    trackPageView();
    window.addEventListener(COOKIE_CONSENT_EVENT, trackPageView);

    return () => {
      window.removeEventListener(COOKIE_CONSENT_EVENT, trackPageView);
    };
  }, [pathname, searchParams]);

  useEffect(() => {
    function trackLinkClick(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const link = target.closest("a");
      const href = link?.getAttribute("href") ?? "";

      if (!href) return;

      if (href.startsWith("tel:")) {
        trackGoal("phone_click");
        return;
      }

      if (href.includes("wa.me") || href.includes("whatsapp")) {
        trackGoal("whatsapp_click");
        return;
      }

      if (href.includes("t.me") || href.includes("telegram")) {
        trackGoal("telegram_click");
        return;
      }

      if (href === "/contacts#booking" || href.endsWith("/contacts#booking")) {
        trackGoal("booking_cta_click");
      }
    }

    document.addEventListener("click", trackLinkClick);

    return () => {
      document.removeEventListener("click", trackLinkClick);
    };
  }, []);

  return null;
}
