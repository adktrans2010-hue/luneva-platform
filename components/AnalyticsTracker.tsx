"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import {
  COOKIE_CONSENT_EVENT,
  hasAnalyticsConsent,
} from "@/src/lib/cookie-consent";
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
  const previousPath = useRef<string | null>(null);

  useEffect(() => {
    if (
      !pathname ||
      !searchParams ||
      pathname.startsWith("/admin") ||
      pathname.startsWith("/api")
    ) {
      return;
    }

    const trackPageView = () => {
      if (!hasAnalyticsConsent(window.localStorage)) {
        return;
      }

      captureAttribution(searchParams);

      // Never send arbitrary query values (payment IDs, promo codes, or user
      // input) to either analytics sink. UTM attribution is handled separately.
      const path = pathname;
      const metrikaId = Number(process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID);

      if (
        previousPath.current !== null &&
        previousPath.current !== path &&
        process.env.NODE_ENV === "production" &&
        Number.isInteger(metrikaId) &&
        metrikaId > 0 &&
        typeof window.ym === "function"
      ) {
        window.ym(metrikaId, "hit", path);
      }

      previousPath.current = path;

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
        const isHelpBot = /lunevapsyhelp_bot/i.test(href);
        trackGoal(isHelpBot ? "help_bot_click" : "telegram_click", {
          booking_channel: "website",
        });
        return;
      }

      if (href.includes("max.ru")) {
        trackGoal("max_click");
        return;
      }

      if (href.startsWith("mailto:")) {
        trackGoal("email_click");
        return;
      }

      if (href === "/contacts#booking" || href.endsWith("/contacts#booking")) {
        trackGoal(
          "click_book",
          { booking_channel: "website" },
          { once: true },
        );
      }
    }

    document.addEventListener("click", trackLinkClick);

    return () => {
      document.removeEventListener("click", trackLinkClick);
    };
  }, []);

  return null;
}
