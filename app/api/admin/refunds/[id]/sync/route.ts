import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/src/db";
import { yookassaRefunds } from "@/src/db/schema";
import { requireAdminApiSession } from "@/src/lib/admin-api";
import { syncRefund } from "@/src/lib/yookassa-refunds";

type RefundParams = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: Request, { params }: RefundParams) {
  const admin = await requireAdminApiSession(request);
  if (!admin.authorized) return admin.response;

  const { id } = await params;
  const [refund] = await db
    .select()
    .from(yookassaRefunds)
    .where(eq(yookassaRefunds.id, id))
    .limit(1);

  if (!refund?.providerRefundId) {
    return NextResponse.json(
      { error: "Возврат ЮKassa не найден или еще не создан." },
      { status: 404 }
    );
  }

  try {
    const synced = await syncRefund(refund.providerRefundId, {
      source: "reconcile",
      localRefundId: refund.id,
    });

    return NextResponse.json(synced);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Не удалось синхронизировать возврат.",
      },
      { status: 400 }
    );
  }
}
