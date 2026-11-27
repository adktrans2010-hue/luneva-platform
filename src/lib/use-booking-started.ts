"use client";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { createBookingStartLifecycle } from "./booking-start-lifecycle";
import type { SafeGoalParams } from "./client-analytics";

export function useBookingStarted(params: SafeGoalParams) {
  const pathname = usePathname();
  const lifecycle = useRef<ReturnType<typeof createBookingStartLifecycle> | null>(null);
  useEffect(() => {
    const current = createBookingStartLifecycle();
    lifecycle.current = current;
    return () => {
      current.dispose();
      lifecycle.current = null;
    };
  }, [pathname]);
  return () => lifecycle.current?.interact(params);
}
