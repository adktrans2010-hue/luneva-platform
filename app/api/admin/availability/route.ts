import { NextRequest, NextResponse } from "next/server";
import { and, asc, eq } from "drizzle-orm";

import { db } from "@/src/db";
import { appointmentAvailability } from "@/src/db/schema";

function isValidTime(time: string) {
  return /^\d{2}:\d{2}$/.test(time);
}

export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get("date");

  const query = db
    .select()
    .from(appointmentAvailability)
    .orderBy(asc(appointmentAvailability.date), asc(appointmentAvailability.time));

  if (!date) {
    return NextResponse.json(await query);
  }

  const data = await db
    .select()
    .from(appointmentAvailability)
    .where(eq(appointmentAvailability.date, date))
    .orderBy(asc(appointmentAvailability.time));

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const body = (await request.json()) as Record<string, unknown>;
  const date = String(body.date ?? "").trim();
  const time = String(body.time ?? "").trim();

  if (!date || !isValidTime(time)) {
    return NextResponse.json(
      { error: "Выберите дату и время приема." },
      { status: 400 }
    );
  }

  const existing = await db
    .select()
    .from(appointmentAvailability)
    .where(
      and(
        eq(appointmentAvailability.date, date),
        eq(appointmentAvailability.time, time)
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
    .values({ date, time, enabled: true })
    .returning();

  return NextResponse.json(createdSlot, { status: 201 });
}
