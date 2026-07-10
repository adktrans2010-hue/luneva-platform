import { randomUUID } from "node:crypto";

import { siteUrl } from "@/src/lib/seo";

type YooKassaPayment = {
  id: string;
  status: string;
  paid?: boolean;
  amount?: {
    value: string;
    currency: string;
  };
  confirmation?: {
    type: string;
    confirmation_url?: string;
  };
  metadata?: Record<string, string>;
};

type CreatePaymentInput = {
  appointmentId: string;
  name: string;
  contact: string;
  scheduledAt: Date | null;
};

const apiUrl = "https://api.yookassa.ru/v3";

export function isYooKassaConfigured() {
  return Boolean(process.env.YOOKASSA_SHOP_ID && process.env.YOOKASSA_SECRET_KEY);
}

export function getYooKassaAmountRub() {
  const amount = Number(process.env.YOOKASSA_PAYMENT_AMOUNT_RUB ?? 7000);

  return Number.isFinite(amount) && amount > 0 ? amount : 7000;
}

function getAuthHeader() {
  const credentials = `${process.env.YOOKASSA_SHOP_ID}:${process.env.YOOKASSA_SECRET_KEY}`;

  return `Basic ${Buffer.from(credentials).toString("base64")}`;
}

function getReturnUrl() {
  return (
    process.env.YOOKASSA_RETURN_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    `${siteUrl}/contacts`
  );
}

function toPaymentStatus(status: string, paid?: boolean) {
  if (status === "succeeded" || paid) return "paid";
  if (status === "canceled") return "cancelled";
  if (status === "waiting_for_capture" || status === "pending") {
    return "invoice_sent";
  }

  return "waiting";
}

export function mapYooKassaPaymentStatus(payment: Pick<YooKassaPayment, "status" | "paid">) {
  return toPaymentStatus(payment.status, payment.paid);
}

export async function createYooKassaPayment(input: CreatePaymentInput) {
  if (!isYooKassaConfigured()) {
    throw new Error("ЮKassa не настроена: добавьте YOOKASSA_SHOP_ID и YOOKASSA_SECRET_KEY.");
  }

  const amountRub = getYooKassaAmountRub();
  const response = await fetch(`${apiUrl}/payments`, {
    method: "POST",
    headers: {
      Authorization: getAuthHeader(),
      "Content-Type": "application/json",
      "Idempotence-Key": randomUUID(),
    },
    body: JSON.stringify({
      amount: {
        value: amountRub.toFixed(2),
        currency: "RUB",
      },
      capture: true,
      confirmation: {
        type: "redirect",
        return_url: getReturnUrl(),
      },
      description: `Консультация психолога: ${input.name}`,
      metadata: {
        appointmentId: input.appointmentId,
        contact: input.contact,
        scheduledAt: input.scheduledAt?.toISOString() ?? "",
      },
    }),
  });

  const data = (await response.json()) as YooKassaPayment & { description?: string };

  if (!response.ok) {
    throw new Error(data.description ?? "ЮKassa не создала платеж.");
  }

  return {
    id: data.id,
    status: mapYooKassaPaymentStatus(data),
    amountRub,
    paymentUrl: data.confirmation?.confirmation_url ?? null,
  };
}

export async function getYooKassaPayment(paymentId: string) {
  if (!isYooKassaConfigured()) {
    throw new Error("ЮKassa не настроена.");
  }

  const response = await fetch(`${apiUrl}/payments/${paymentId}`, {
    headers: {
      Authorization: getAuthHeader(),
    },
  });

  const data = (await response.json()) as YooKassaPayment;

  if (!response.ok) {
    throw new Error("Не удалось получить статус платежа ЮKassa.");
  }

  return data;
}
