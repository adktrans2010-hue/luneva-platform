"use client";

import { useEffect } from "react";

import { METRIKA_READY_EVENT, trackGoal } from "@/src/lib/client-analytics";

export default function ServiceViewTracker({ serviceType }: { serviceType: string }) {
  useEffect(() => {
    const trackView = () => trackGoal(
      "view_service",
      { service_type: serviceType, booking_channel: "website" },
      { once: true, dedupeKey: serviceType },
    );
    trackView();
    // Consent can be accepted after this page mounted; wait for the real counter init.
    window.addEventListener(METRIKA_READY_EVENT, trackView);
    return () => window.removeEventListener(METRIKA_READY_EVENT, trackView);
  }, [serviceType]);

  return null;
}
