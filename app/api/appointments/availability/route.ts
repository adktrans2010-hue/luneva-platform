import { NextRequest, NextResponse } from "next/server";

import { getAvailableAppointmentSlots } from "@/src/lib/appointment-slots";
import { normalizeConsultationFormat } from "@/src/lib/consultation-products";
import { normalizeConsultationLocation } from "@/src/lib/consultation-locations";

export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get("date") ?? "";
  const consultationFormat = normalizeConsultationFormat(
    request.nextUrl.searchParams.get("format")
  );
  const consultationLocation = normalizeConsultationLocation(
    consultationFormat,
    request.nextUrl.searchParams.get("location")
  );

  if (!date || !consultationLocation) {
    return NextResponse.json({ slots: [] });
  }

  return NextResponse.json({
    slots: await getAvailableAppointmentSlots(
      date,
      consultationFormat,
      consultationLocation
    ),
  });
}
