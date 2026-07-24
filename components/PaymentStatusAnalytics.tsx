"use client";

import { useEffect } from "react";

import { trackGoal } from "@/src/lib/client-analytics";

type PaymentStatusAnalyticsProps = {
  paymentId?: string | null;
  status?: string | null;
};

const failedStatuses = new Set([
  "cancelled",
  "canceled",
  "failed",
  "validation_failed",
]);

export default function PaymentStatusAnalytics({
  paymentId,
  status,
}: PaymentStatusAnalyticsProps) {
  useEffect(() => {
    if (!paymentId || !status) return;

    if (status === "paid") {
      trackGoal("payment_success", {}, { once: true, dedupeKey: paymentId });
      return;
    }

    if (failedStatuses.has(status)) {
      trackGoal("payment_failed", { status }, { once: true, dedupeKey: paymentId });
    }
  }, [paymentId, status]);

  return null;
}
