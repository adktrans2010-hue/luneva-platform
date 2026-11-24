"use client";

import { useEffect, useState } from "react";

import { adminFetch } from "@/src/lib/admin-fetch";

type Payment = {
  id: string;
  createdAt: string;
  status: string;
  providerStatus: string | null;
  providerPaymentId: string | null;
  amountKopeks: number;
  paidAmountKopeks: number | null;
  refundedAmountKopeks: number;
  currency: string;
  appointmentId: string;
  productName: string | null;
  clientName: string | null;
  scheduledAt: string | null;
  appointmentStatus: string | null;
};

function formatMoney(kopeks: number, currency: string) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(kopeks / 100);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    timeZone: "Europe/Moscow",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function AdminPayments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    void adminFetch("/api/admin/payments")
      .then(async (response) => {
        if (!response.ok) throw new Error("Payment list unavailable");
        setPayments((await response.json()) as Payment[]);
        setState("ready");
      })
      .catch(() => setState("error"));
  }, []);

  if (state === "loading") return <p className="text-[#5f5552]">Загрузка платежей...</p>;
  if (state === "error") return <p className="text-[#b94a48]">Не удалось загрузить платежи.</p>;
  if (payments.length === 0) return <p className="text-[#5f5552]">Платежей пока нет.</p>;

  return (
    <div className="overflow-x-auto rounded-2xl border border-[#ead7d1] bg-white">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-[#fff8f6] text-[#8a7a76]">
          <tr>
            <th className="px-4 py-3 font-medium">Дата</th>
            <th className="px-4 py-3 font-medium">Клиент / запись</th>
            <th className="px-4 py-3 font-medium">Сумма</th>
            <th className="px-4 py-3 font-medium">Статус</th>
            <th className="px-4 py-3 font-medium">Payment ID</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((payment) => (
            <tr key={payment.id} className="border-t border-[#ead7d1] text-[#332725]">
              <td className="px-4 py-3 whitespace-nowrap">{formatDate(payment.createdAt)}</td>
              <td className="px-4 py-3">
                <div>{payment.clientName ?? "Запись удалена"}</div>
                <div className="mt-1 text-xs text-[#8a7a76]">{payment.productName ?? payment.appointmentId}</div>
              </td>
              <td className="px-4 py-3 whitespace-nowrap">{formatMoney(payment.paidAmountKopeks ?? payment.amountKopeks, payment.currency)}</td>
              <td className="px-4 py-3"><span className="rounded-full bg-[#fff8f6] px-3 py-1">{payment.providerStatus ?? payment.status}</span></td>
              <td className="px-4 py-3 font-mono text-xs text-[#5f5552]">{payment.providerPaymentId ?? "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
