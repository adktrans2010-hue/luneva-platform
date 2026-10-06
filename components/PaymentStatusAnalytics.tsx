"use client";

import { useEffect } from "react";

import { trackGoal } from "@/src/lib/client-analytics";

type PaymentStatusAnalyticsProps = {
  paymentId?: string | null;
  status?: string | null;
};

export default function PaymentStatusAnalytics({
  paymentId,
  status,
}: PaymentStatusAnalyticsProps) {
  useEffect(() => {
    if (!paymentId || !status) return;

    if (status === "paid") {
      trackGoal(
        "payment_success",
        { payment_status: "paid", booking_channel: "website" },
        { once: true, dedupeKey: paymentId },
      );
      return;
    }

  }, [paymentId, status]);

  return null;
}
