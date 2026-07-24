import { NextRequest, NextResponse } from "next/server";

import { requireAdminApiSession } from "@/src/lib/admin-api";
import { consumeRateLimit, getRequestClientIp } from "@/src/lib/rate-limit";
import { cancelWaitingForCapturePayment } from "@/src/lib/yookassa-refunds";

type PaymentParams = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: NextRequest, { params }: PaymentParams) {
  const { id } = await params;
  const admin = await requireAdminApiSession(request);
  if (!admin.authorized) return admin.response;

  const ip = getRequestClientIp(request.headers);
  const rate = await consumeRateLimit({
    scope: "admin-yookassa-cancel",
    identifier: `${ip}|${id}`,
    limit: 5,
    windowMs: 60 * 1000,
    blockMs: 5 * 60 * 1000,
  });

  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Слишком много попыток отмены платежа. Попробуйте позже." },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
    );
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  try {
    const payment = await cancelWaitingForCapturePayment({
      paymentId: id,
      reason: String(body.reason ?? "").trim() || null,
      requestedByAdminId: admin.session.email,
    });

    return NextResponse.json(payment);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Не удалось отменить авторизацию платежа.",
      },
      { status: 400 }
    );
  }
}
