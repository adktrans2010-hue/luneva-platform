"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";

import {
  COOKIE_CONSENT_EVENT,
  hasAnalyticsConsent,
} from "@/src/lib/cookie-consent";

function subscribe(callback: () => void) {
  window.addEventListener(COOKIE_CONSENT_EVENT, callback);
  window.addEventListener("storage", callback);

  return () => {
    window.removeEventListener(COOKIE_CONSENT_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

function consentSnapshot() {
  return hasAnalyticsConsent(window.localStorage);
}

const privateRoutePrefixes = [
  "/admin",
  "/account",
  "/login",
  "/register",
  "/verify",
  "/forgot-password",
  "/reset-password",
];

export default function YandexMetrika() {
  const counterId = process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID;
  const hasConsent = useSyncExternalStore(subscribe, consentSnapshot, () => false);
  const pathname = usePathname();
  const isPrivateRoute = Boolean(
    pathname && privateRoutePrefixes.some((prefix) => pathname.startsWith(prefix)),
  );
  const numericCounterId = Number(counterId);
  const validCounterId = Number.isInteger(numericCounterId) && numericCounterId > 0;

  useEffect(() => {
    if (!validCounterId || typeof window.ym !== "function") return;

    if ((!hasConsent || isPrivateRoute) && window.__lunevaMetrikaActive) {
      window.ym(numericCounterId, "destruct");
      window.__lunevaMetrikaActive = false;
      return;
    }

    if (hasConsent && !isPrivateRoute && pathname && !window.__lunevaMetrikaActive) {
      window.ym(numericCounterId, "init", {
        defer: true,
        clickmap: true,
        trackLinks: true,
        accurateTrackBounce: true,
        webvisor: true,
      });
      window.ym(numericCounterId, "hit", pathname, { title: document.title });
      window.__lunevaMetrikaActive = true;
    }
  }, [hasConsent, isPrivateRoute, numericCounterId, pathname, validCounterId]);

  if (
    process.env.NODE_ENV !== "production" ||
    !counterId ||
    !hasConsent ||
    !pathname ||
    isPrivateRoute
  ) {
    return null;
  }

  if (!validCounterId) {
    return null;
  }

  return (
    <Script
      id="yandex-metrika"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
            (function(m,e,t,r,i,k,a){
              m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
              m[i].l=1*new Date();
              for (var j = 0; j < document.scripts.length; j++) {
                if (document.scripts[j].src === r) { return; }
              }
              k=e.createElement(t),a=e.getElementsByTagName(t)[0],
              k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
            })(window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");
            if (!window.__lunevaMetrikaActive) {
              ym(${numericCounterId}, "init", {
                defer: true,
                clickmap: true,
                trackLinks: true,
                accurateTrackBounce: true,
                webvisor: true
              });
              ym(${numericCounterId}, "hit", ${JSON.stringify(pathname)}, {
                title: document.title
              });
              window.__lunevaMetrikaActive = true;
            }
          `,
      }}
    />
  );
}
