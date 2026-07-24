"use client";

import type { ReactNode } from "react";

import {
  getAttribution,
  getSessionId,
  getVisitorId,
} from "@/src/lib/client-analytics";

type TrackedVideoLinkProps = {
  href: string;
  title: string;
  children: ReactNode;
  className?: string;
};

export default function TrackedVideoLink({
  href,
  title,
  children,
  className,
}: TrackedVideoLinkProps) {
  function trackClick() {
    void fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        eventType: "video_click",
        path: "/videos",
        title,
        target: href,
        referrer: document.referrer,
        visitorId: getVisitorId(),
        sessionId: getSessionId(),
        attribution: getAttribution(),
      }),
    });
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      onClick={trackClick}
      className={className}
    >
      {children}
    </a>
  );
}
