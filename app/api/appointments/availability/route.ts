import { NextRequest, NextResponse } from "next/server";

import { getAvailableAppointmentSlots } from "@/src/lib/appointment-slots";

export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get("date") ?? "";
  const consultationFormat =
    request.nextUrl.searchParams.get("format") === "office" ? "office" : "online";

  if (!date) {
    return NextResponse.json({ slots: [] });
  }

  return NextResponse.json({
    slots: await getAvailableAppointmentSlots(date, consultationFormat),
  });
}
