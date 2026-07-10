import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/src/db";
import { appointmentAvailability } from "@/src/db/schema";

type AvailabilityParams = {
  params: Promise<{
    id: string;
  }>;
};

export async function DELETE(_request: Request, { params }: AvailabilityParams) {
  const { id } = await params;

  await db
    .delete(appointmentAvailability)
    .where(eq(appointmentAvailability.id, id));

  return NextResponse.json({ success: true });
}
