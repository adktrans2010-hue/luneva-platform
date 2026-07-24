import { NextResponse } from "next/server";

import { requireAdminApiSession } from "@/src/lib/admin-api";
import {
  getPaymentRefundSummary,
  listPaymentRefunds,
} from "@/src/lib/yookassa-refunds";

type PaymentParams = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(request: Request, { params }: PaymentParams) {
  const admin = await requireAdminApiSession(request);
  if (!admin.authorized) return admin.response;

  const { id } = await params;
  const summary = await getPaymentRefundSummary(id);

  if (!summary) {
    return NextResponse.json({ error: "Платеж не найден." }, { status: 404 });
  }

  return NextResponse.json({
    ...summary,
    refunds: await listPaymentRefunds(id),
  });
}
