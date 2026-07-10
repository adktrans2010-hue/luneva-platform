import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";

import { db } from "@/src/db";
import { appointmentHistory, appointmentRequests } from "@/src/db/schema";

export async function GET() {
  const data = await db
    .select()
    .from(appointmentRequests)
    .orderBy(desc(appointmentRequests.createdAt));

  const history = await db
    .select()
    .from(appointmentHistory)
    .orderBy(desc(appointmentHistory.createdAt));

  return NextResponse.json(
    data.map((appointment) => ({
      ...appointment,
      history: history.filter(
        (entry) => entry.appointmentId === appointment.id
      ),
    }))
  );
}
