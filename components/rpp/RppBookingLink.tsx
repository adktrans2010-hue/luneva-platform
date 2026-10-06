"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { trackGoal } from "@/src/lib/client-analytics";

type RppBookingLinkProps = {
  children: ReactNode;
  className?: string;
};

export default function RppBookingLink({ children, className }: RppBookingLinkProps) {
  return (
    <Link
      href="/contacts#booking"
      className={className}
      onClick={() =>
        trackGoal(
          "click_book",
          { service_type: "eating_behavior", booking_channel: "website" },
          { once: true },
        )
      }
    >
      {children}
    </Link>
  );
}
