import { NextRequest, NextResponse } from "next/server";
import { and, asc, eq } from "drizzle-orm";

import { db } from "@/src/db";
import { appointmentAvailability } from "@/src/db/schema";
import { normalizeConsultationLocation } from "@/src/lib/consultation-locations";

function isValidTime(time: string) {
  return /^\d{2}:\d{2}$/.test(time);
}

export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get("date");
  const consultationFormat = request.nextUrl.searchParams.get("format");
  const consultationLocation = request.nextUrl.searchParams.get("location");

  const query = db
    .select()
    .from(appointmentAvailability)
    .orderBy(asc(appointmentAvailability.date), asc(appointmentAvailability.time));

  if (!date && !consultationFormat) {
    return NextResponse.json(await query);
  }

  if (date && consultationFormat && consultationLocation) {
    const data = await db
      .select()
      .from(appointmentAvailability)
      .where(
        and(
          eq(appointmentAvailability.date, date),
          eq(appointmentAvailability.consultationFormat, consultationFormat),
          eq(
            appointmentAvailability.consultationLocation,
            consultationLocation
          )
        )
      )
      .orderBy(asc(appointmentAvailability.time));

    return NextResponse.json(data);
  }

  const data = await db
    .select()
    .from(appointmentAvailability)
    .where(
      date
        ? eq(appointmentAvailability.date, date)
        : eq(appointmentAvailability.consultationFormat, consultationFormat ?? "online")
    )
    .orderBy(asc(appointmentAvailability.time));

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const body = (await request.json()) as Record<string, unknown>;
  const date = String(body.date ?? "").trim();
  const time = String(body.time ?? "").trim();
  const consultationFormat = String(body.format ?? "online").trim();
  const consultationLocation = normalizeConsultationLocation(
    consultationFormat,
    body.location
  );

  if (
    !date ||
    !isValidTime(time) ||
    !["online", "office"].includes(consultationFormat) ||
    !consultationLocation
  ) {
    return NextResponse.json(
      { error: "Выберите формат, дату и время приема." },
      { status: 400 }
    );
  }

  const existing = await db
    .select()
    .from(appointmentAvailability)
    .where(
      and(
        eq(appointmentAvailability.date, date),
        eq(appointmentAvailability.time, time),
        eq(appointmentAvailability.consultationFormat, consultationFormat),
        eq(
          appointmentAvailability.consultationLocation,
          consultationLocation
        )
      )
    )
    .limit(1);

  if (existing.length > 0) {
    return NextResponse.json(
      { error: "Такое окно уже добавлено." },
      { status: 409 }
    );
  }

  const [createdSlot] = await db
    .insert(appointmentAvailability)
    .values({
      date,
      time,
      consultationFormat,
      consultationLocation,
      enabled: true,
    })
    .returning();

  return NextResponse.json(createdSlot, { status: 201 });
}
