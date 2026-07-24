import { NextRequest, NextResponse } from "next/server";

import { requireAdminApiSession } from "@/src/lib/admin-api";
import { consumeRateLimit, getRequestClientIp } from "@/src/lib/rate-limit";
import {
  createFullRefund,
  createPartialRefund,
} from "@/src/lib/yookassa-refunds";

type PaymentParams = {
  params: Promise<{
    id: string;
  }>;
};

function readPositiveInteger(value: unknown) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : null;
}

export async function POST(request: NextRequest, { params }: PaymentParams) {
  const { id } = await params;
  const admin = await requireAdminApiSession(request);
  if (!admin.authorized) return admin.response;

  const ip = getRequestClientIp(request.headers);
  const rate = await consumeRateLimit({
    scope: "admin-yookassa-refund",
    identifier: `${ip}|${id}`,
    limit: 5,
    windowMs: 60 * 1000,
    blockMs: 5 * 60 * 1000,
  });

  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Слишком много попыток возврата. Попробуйте позже." },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
    );
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const type = String(body.type ?? "").trim();
  const reason = String(body.reason ?? "").trim();

  if (type !== "full" && type !== "partial") {
    return NextResponse.json({ error: "Выберите полный или частичный возврат." }, { status: 400 });
  }

  if (reason.length < 3) {
    return NextResponse.json({ error: "Укажите причину возврата." }, { status: 400 });
  }

  if (type === "full" && String(body.confirmText ?? "").trim() !== "ВОЗВРАТ") {
    return NextResponse.json(
      { error: "Для полного возврата введите подтверждение: ВОЗВРАТ." },
      { status: 400 }
    );
  }

  try {
    const refund =
      type === "full"
        ? await createFullRefund({
            paymentId: id,
            reason,
            requestedByAdminId: admin.session.email,
          })
        : await createPartialRefund({
            paymentId: id,
            amountKopeks: readPositiveInteger(body.amountKopeks) ?? 0,
            reason,
            requestedByAdminId: admin.session.email,
          });

    return NextResponse.json(refund);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Не удалось оформить возврат.",
      },
      { status: 400 }
    );
  }
}
