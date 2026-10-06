"use client";

import { useEffect } from "react";

import { trackGoal } from "@/src/lib/client-analytics";

export default function ServiceViewTracker({ serviceType }: { serviceType: string }) {
  useEffect(() => {
    trackGoal(
      "view_service",
      { service_type: serviceType, booking_channel: "website" },
      { once: true, dedupeKey: serviceType },
    );
  }, [serviceType]);

  return null;
}
