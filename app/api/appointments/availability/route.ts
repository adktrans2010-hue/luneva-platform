import { NextRequest, NextResponse } from "next/server";

import {
  getAvailableAppointmentDays,
  getAvailableAppointmentSlots,
  nearestAvailableSlots,
} from "@/src/lib/appointment-slots";
import { normalizeConsultationFormat } from "@/src/lib/consultation-products";
import { normalizeConsultationLocation } from "@/src/lib/consultation-locations";

export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get("date") ?? "";
  const rangeDays = Number(request.nextUrl.searchParams.get("rangeDays") ?? "");
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

  if (Number.isFinite(rangeDays) && rangeDays > 1) {
    const availability = await getAvailableAppointmentDays(
      date,
      rangeDays,
      consultationFormat,
      consultationLocation
    );

    return NextResponse.json({
      availability,
      nearestSlots: nearestAvailableSlots(availability, 12),
    });
  }

  return NextResponse.json({
    slots: await getAvailableAppointmentSlots(
      date,
      consultationFormat,
      consultationLocation
    ),
  });
}
