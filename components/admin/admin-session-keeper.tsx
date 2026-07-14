"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { adminFetch } from "@/src/lib/admin-fetch";

const idleTimeoutMs = 60 * 60 * 1000;
const renewalIntervalMs = 5 * 60 * 1000;
const checkIntervalMs = 60 * 1000;

export function AdminSessionKeeper() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === "/admin/login") return;

    let lastActivityAt = Date.now();
    let lastRenewalAt = Date.now();
    let requestInProgress = false;

    const recordActivity = () => {
      lastActivityAt = Date.now();
    };

    const redirectToLogin = () => {
      window.location.replace(
        `/admin/login?next=${encodeURIComponent(window.location.pathname)}`
      );
    };

    const endSession = async () => {
      if (requestInProgress) return;
      requestInProgress = true;

      try {
        await adminFetch("/api/admin/logout", {
          method: "POST",
          credentials: "same-origin",
          cache: "no-store",
        });
      } finally {
        redirectToLogin();
      }
    };

    const checkSession = async () => {
      const now = Date.now();

      if (now - lastActivityAt >= idleTimeoutMs) {
        await endSession();
        return;
      }

      const hasNewActivity = lastActivityAt > lastRenewalAt;
      if (
        requestInProgress ||
        !hasNewActivity ||
        now - lastRenewalAt < renewalIntervalMs
      ) {
        return;
      }

      requestInProgress = true;
      try {
        const response = await adminFetch("/api/admin/session", {
          method: "POST",
          credentials: "same-origin",
          cache: "no-store",
        });

        if (!response.ok) {
          redirectToLogin();
          return;
        }

        lastRenewalAt = Date.now();
      } catch {
        // A temporary network failure must not log the administrator out.
      } finally {
        requestInProgress = false;
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") void checkSession();
    };

    const activityEvents: Array<keyof WindowEventMap> = [
      "keydown",
      "pointerdown",
      "scroll",
      "touchstart",
    ];

    for (const eventName of activityEvents) {
      window.addEventListener(eventName, recordActivity, { passive: true });
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);
    const interval = window.setInterval(() => void checkSession(), checkIntervalMs);

    return () => {
      window.clearInterval(interval);
      for (const eventName of activityEvents) {
        window.removeEventListener(eventName, recordActivity);
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [pathname]);

  return null;
}
