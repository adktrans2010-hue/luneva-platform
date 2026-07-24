import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/src/db";
import { yookassaRefunds } from "@/src/db/schema";
import { requireAdminApiSession } from "@/src/lib/admin-api";

type RefundParams = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(request: Request, { params }: RefundParams) {
  const admin = await requireAdminApiSession(request);
  if (!admin.authorized) return admin.response;

  const { id } = await params;
  const [refund] = await db
    .select()
    .from(yookassaRefunds)
    .where(eq(yookassaRefunds.id, id))
    .limit(1);

  if (!refund) {
    return NextResponse.json({ error: "Возврат не найден." }, { status: 404 });
  }

  return NextResponse.json(refund);
}
