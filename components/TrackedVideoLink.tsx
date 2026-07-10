"use client";

import type { ReactNode } from "react";

type TrackedVideoLinkProps = {
  href: string;
  title: string;
  children: ReactNode;
  className?: string;
};

function getStoredId(key: string) {
  const existing = window.localStorage.getItem(key);

  if (existing) return existing;

  const value = crypto.randomUUID();
  window.localStorage.setItem(key, value);

  return value;
}

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
        visitorId: getStoredId("luneva_visitor_id"),
        sessionId: getStoredId("luneva_session_id"),
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
