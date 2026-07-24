import { randomUUID } from "node:crypto";

import { ProductSnapshot } from "@/src/lib/consultation-products";
import { normalizePaymentCustomerContact } from "@/src/lib/payment-contact";
import { siteUrl } from "@/src/lib/seo";

export type YooKassaPayment = {
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

export type YooKassaRefund = {
  id: string;
  payment_id: string;
  status: string;
  amount?: {
    value: string;
    currency: string;
  };
  description?: string;
  metadata?: Record<string, string>;
  cancellation_details?: {
    party?: string;
    reason?: string;
  };
  receipt_registration?: string;
};

type CreatePaymentInput = {
  appointmentId: string;
  internalPaymentId: string;
  name: string;
  contact: string;
  scheduledAt: Date | null;
  amountKopeks: number;
  productSnapshot: ProductSnapshot;
  preferredFormat: string;
  idempotenceKey: string;
};

type CreateRefundInput = {
  paymentId: string;
  amountKopeks: number;
  idempotenceKey: string;
  description: string;
  metadata: Record<string, string>;
};

type YooKassaReceipt = {
  customer: {
    full_name?: string;
    email?: string;
    phone?: string;
  };
  items: Array<{
    description: string;
    quantity: string;
    amount: {
      value: string;
      currency: string;
    };
    vat_code: number;
    payment_subject: string;
    payment_mode: string;
  }>;
};

const apiUrl = "https://api.yookassa.ru/v3";

export function isYooKassaConfigured() {
  return Boolean(process.env.YOOKASSA_SHOP_ID && process.env.YOOKASSA_SECRET_KEY);
}

function getAuthHeader() {
  const credentials = `${process.env.YOOKASSA_SHOP_ID}:${process.env.YOOKASSA_SECRET_KEY}`;

  return `Basic ${Buffer.from(credentials).toString("base64")}`;
}

async function readYooKassaJson<T>(response: Response, fallbackMessage: string) {
  const data = (await response.json().catch(() => ({}))) as T & {
    description?: string;
  };

  if (!response.ok) {
    throw new Error(data.description ?? fallbackMessage);
  }

  return data;
}

function appendPaymentId(url: string, internalPaymentId: string) {
  const parsedUrl = new URL(url, process.env.NEXT_PUBLIC_SITE_URL || siteUrl);
  parsedUrl.searchParams.set("paymentId", internalPaymentId);

  return parsedUrl.toString();
}

function getReturnUrl(internalPaymentId: string) {
  const returnUrl =
    process.env.YOOKASSA_RETURN_URL ||
    `${process.env.NEXT_PUBLIC_SITE_URL || siteUrl}/payment/status`;

  return appendPaymentId(returnUrl, internalPaymentId);
}

function toPaymentStatus(status: string, paid?: boolean) {
  if (status === "succeeded" || paid) return "paid";
  if (status === "canceled") return "cancelled";
  if (status === "waiting_for_capture") return "waiting_for_capture";
  if (status === "pending") return "invoice_sent";

  return "waiting";
}

export function mapYooKassaPaymentStatus(
  payment: Pick<YooKassaPayment, "status" | "paid">
) {
  return toPaymentStatus(payment.status, payment.paid);
}

export function parseYooKassaAmountKopeks(value: string | undefined) {
  const amount = Number(value);

  if (!Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  return Math.round(amount * 100);
}

function buildReceipt(input: CreatePaymentInput, amountRub: number): YooKassaReceipt {
  const customerContact = normalizePaymentCustomerContact(input.contact);

  if (!customerContact) {
    throw new Error(
      "Для онлайн-оплаты нужен email или номер телефона клиента, чтобы сформировать чек."
    );
  }

  return {
    customer: {
      full_name: input.name.trim().slice(0, 256) || undefined,
      ...customerContact,
    },
    items: [
      {
        description: input.productSnapshot.receiptDescriptionSnapshot.slice(0, 128),
        quantity: "1.00",
        amount: {
          value: amountRub.toFixed(2),
          currency: input.productSnapshot.currencySnapshot,
        },
        vat_code: input.productSnapshot.vatCodeSnapshot,
        payment_subject: input.productSnapshot.paymentSubjectSnapshot,
        payment_mode: input.productSnapshot.paymentModeSnapshot,
      },
    ],
  };
}

export async function createYooKassaPayment(input: CreatePaymentInput) {
  if (!isYooKassaConfigured()) {
    throw new Error(
      "ЮKassa не настроена: добавьте YOOKASSA_SHOP_ID и YOOKASSA_SECRET_KEY."
    );
  }

  if (!Number.isInteger(input.amountKopeks) || input.amountKopeks <= 0) {
    throw new Error("Некорректная сумма платежа.");
  }

  const amountRub = input.amountKopeks / 100;
  const receipt = buildReceipt(input, amountRub);
  const response = await fetch(`${apiUrl}/payments`, {
    method: "POST",
    headers: {
      Authorization: getAuthHeader(),
      "Content-Type": "application/json",
      "Idempotence-Key": input.idempotenceKey || randomUUID(),
    },
    body: JSON.stringify({
      amount: {
        value: amountRub.toFixed(2),
        currency: input.productSnapshot.currencySnapshot,
      },
      capture: true,
      confirmation: {
        type: "redirect",
        return_url: getReturnUrl(input.internalPaymentId),
      },
      description: input.productSnapshot.receiptDescriptionSnapshot.slice(0, 128),
      receipt,
      metadata: {
        appointmentId: input.appointmentId,
        internalPaymentId: input.internalPaymentId,
        productId: input.productSnapshot.productId,
        productCode: input.productSnapshot.productCodeSnapshot,
        productName: input.productSnapshot.productNameSnapshot,
        sessionsCount: String(input.productSnapshot.sessionsCountSnapshot),
        preferredFormat: input.preferredFormat,
        scheduledAt: input.scheduledAt?.toISOString() ?? "",
      },
    }),
  });

  const data = await readYooKassaJson<YooKassaPayment>(
    response,
    "ЮKassa не создала платеж."
  );

  return {
    id: data.id,
    status: mapYooKassaPaymentStatus(data),
    providerStatus: data.status,
    amountRub,
    amountKopeks: input.amountKopeks,
    currency: data.amount?.currency ?? input.productSnapshot.currencySnapshot,
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

  return readYooKassaJson<YooKassaPayment>(
    response,
    "Не удалось получить статус платежа ЮKassa."
  );
}

export function mapYooKassaRefundStatus(refund: Pick<YooKassaRefund, "status">) {
  if (refund.status === "succeeded") return "succeeded";
  if (refund.status === "canceled") return "canceled";
  if (refund.status === "pending") return "pending";

  return "manual_review";
}

export async function createYooKassaRefund(input: CreateRefundInput) {
  if (!isYooKassaConfigured()) {
    throw new Error("ЮKassa не настроена.");
  }

  if (!Number.isInteger(input.amountKopeks) || input.amountKopeks <= 0) {
    throw new Error("Некорректная сумма возврата.");
  }

  const response = await fetch(`${apiUrl}/refunds`, {
    method: "POST",
    headers: {
      Authorization: getAuthHeader(),
      "Content-Type": "application/json",
      "Idempotence-Key": input.idempotenceKey,
    },
    body: JSON.stringify({
      payment_id: input.paymentId,
      amount: {
        value: (input.amountKopeks / 100).toFixed(2),
        currency: "RUB",
      },
      description: input.description.slice(0, 128),
      metadata: input.metadata,
    }),
  });

  return readYooKassaJson<YooKassaRefund>(
    response,
    "ЮKassa не создала возврат."
  );
}

export async function getYooKassaRefund(refundId: string) {
  if (!isYooKassaConfigured()) {
    throw new Error("ЮKassa не настроена.");
  }

  const response = await fetch(`${apiUrl}/refunds/${refundId}`, {
    headers: {
      Authorization: getAuthHeader(),
    },
  });

  return readYooKassaJson<YooKassaRefund>(
    response,
    "Не удалось получить статус возврата ЮKassa."
  );
}

export async function cancelYooKassaPayment(
  paymentId: string,
  idempotenceKey: string
) {
  if (!isYooKassaConfigured()) {
    throw new Error("ЮKassa не настроена.");
  }

  const response = await fetch(`${apiUrl}/payments/${paymentId}/cancel`, {
    method: "POST",
    headers: {
      Authorization: getAuthHeader(),
      "Content-Type": "application/json",
      "Idempotence-Key": idempotenceKey,
    },
    body: "{}",
  });

  return readYooKassaJson<YooKassaPayment>(
    response,
    "Не удалось отменить платеж ЮKassa."
  );
}
