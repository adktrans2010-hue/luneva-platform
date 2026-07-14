"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import LegalConsent from "@/components/legal/legal-consent";

const consultationFormats = [
  { value: "online", label: "Онлайн" },
  { value: "office", label: "Очно в кабинете" },
];

const paymentMethods = [
  { value: "online", label: "Онлайн-оплата ЮKassa" },
  { value: "after_confirmation", label: "После подтверждения" },
];

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default function AppointmentForm() {
  const minDate = useMemo(() => toDateInputValue(new Date()), []);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [consultationFormat, setConsultationFormat] = useState("online");
  const [paymentMethod, setPaymentMethod] = useState("online");
  const [appointmentDate, setAppointmentDate] = useState(minDate);
  const [appointmentTime, setAppointmentTime] = useState("");
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState("");
  const [formStartedAt, setFormStartedAt] = useState(() => Date.now());
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [legalAccepted, setLegalAccepted] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    void fetch(
      `/api/appointments/availability?date=${appointmentDate}&format=${consultationFormat}`,
      {
        signal: controller.signal,
      }
    )
      .then((response) => response.json())
      .then((data: { slots: string[] }) => {
        setAvailableSlots(data.slots);
        setLoadingSlots(false);
      })
      .catch((fetchError: unknown) => {
        if (fetchError instanceof DOMException && fetchError.name === "AbortError") {
          return;
        }

        setAvailableSlots([]);
        setLoadingSlots(false);
      });

    return () => controller.abort();
  }, [appointmentDate, consultationFormat]);

  function changeAppointmentDate(date: string) {
    setAppointmentDate(date);
    setAppointmentTime("");
    setAvailableSlots([]);
    setLoadingSlots(true);
  }

  function changeConsultationFormat(format: string) {
    setConsultationFormat(format);
    setAppointmentTime("");
    setAvailableSlots([]);
    setLoadingSlots(true);
  }

  async function submitAppointment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setError(null);
    setSent(false);

    const response = await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        contact,
        consultationFormat,
        paymentMethod,
        appointmentDate,
        appointmentTime,
        message,
        website,
        formStartedAt,
        legalConsent: legalAccepted,
      }),
    });

    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      setError(data.error ?? "Не удалось отправить заявку.");
      setSending(false);
      return;
    }

    const data = (await response.json()) as { paymentUrl?: string | null };

    setName("");
    setContact("");
    setConsultationFormat("online");
    setPaymentMethod("online");
    setMessage("");
    setWebsite("");
    setFormStartedAt(Date.now());
    setAppointmentTime("");
    setPaymentUrl(data.paymentUrl ?? null);
    setSent(true);
    setSending(false);
    setLegalAccepted(true);

    const slotsResponse = await fetch(
      `/api/appointments/availability?date=${appointmentDate}&format=${consultationFormat}`
    );
    const slotsData = (await slotsResponse.json()) as { slots: string[] };
    setAvailableSlots(slotsData.slots);
  }

  return (
    <form id="booking" onSubmit={submitAppointment} className="mt-10 grid gap-4">
      <input
        value={website}
        onChange={(event) => setWebsite(event.target.value)}
        name="website"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden="true"
      />

      <div className="grid gap-4 md:grid-cols-2">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="rounded-2xl border border-[#ead7d1] px-4 py-3 outline-none transition focus:border-[#c98778]"
          placeholder="Ваше имя"
          required
        />

        <input
          value={contact}
          onChange={(event) => setContact(event.target.value)}
          className="rounded-2xl border border-[#ead7d1] px-4 py-3 outline-none transition focus:border-[#c98778]"
          placeholder="Телефон, @username или email"
          required
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <input
          value={appointmentDate}
          onChange={(event) => changeAppointmentDate(event.target.value)}
          type="date"
          min={minDate}
          className="rounded-2xl border border-[#ead7d1] px-4 py-3 outline-none transition focus:border-[#c98778]"
          required
        />
      </div>

      <div className="rounded-2xl border border-[#ead7d1] bg-[#fff8f6] p-4">
        <p className="text-sm uppercase tracking-[0.18em] text-[#8a7a76]">
          Формат консультации
        </p>

        <div className="mt-4 flex flex-wrap gap-3">
          {consultationFormats.map((format) => (
            <button
              key={format.value}
              type="button"
              onClick={() => changeConsultationFormat(format.value)}
              className={
                consultationFormat === format.value
                  ? "rounded-xl bg-[#332725] px-4 py-2 text-white"
                  : "rounded-xl border border-[#332725] px-4 py-2 text-[#332725]"
              }
            >
              {format.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-[#ead7d1] bg-[#fff8f6] p-4">
        <p className="text-sm uppercase tracking-[0.18em] text-[#8a7a76]">
          Оплата
        </p>

        <div className="mt-4 flex flex-wrap gap-3">
          {paymentMethods.map((method) => (
            <button
              key={method.value}
              type="button"
              onClick={() => setPaymentMethod(method.value)}
              className={
                paymentMethod === method.value
                  ? "rounded-xl bg-[#332725] px-4 py-2 text-white"
                  : "rounded-xl border border-[#332725] px-4 py-2 text-[#332725]"
              }
            >
              {method.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-[#ead7d1] bg-[#fff8f6] p-4">
        <p className="text-sm uppercase tracking-[0.18em] text-[#8a7a76]">
          Свободное время
        </p>
        <p className="mt-2 text-sm text-[#8a7a76]">
          Показывается график для формата:{" "}
          {consultationFormats.find((format) => format.value === consultationFormat)
            ?.label ?? "Онлайн"}
        </p>

        {loadingSlots ? (
          <p className="mt-3 text-[#5f5552]">Проверяю свободные окна...</p>
        ) : availableSlots.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-3">
            {availableSlots.map((slot) => (
              <button
                key={slot}
                type="button"
                onClick={() => setAppointmentTime(slot)}
                className={
                  appointmentTime === slot
                    ? "rounded-xl bg-[#332725] px-4 py-2 text-white"
                    : "rounded-xl border border-[#332725] px-4 py-2 text-[#332725]"
                }
              >
                {slot}
              </button>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-[#5f5552]">
            На выбранную дату свободного времени пока нет.
          </p>
        )}
      </div>

      <textarea
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        rows={5}
        className="rounded-2xl border border-[#ead7d1] px-4 py-3 outline-none transition focus:border-[#c98778]"
        placeholder="Коротко напишите, с чем хотите обратиться"
        required
      />

      {error && (
        <p className="rounded-2xl bg-[#fff3df] px-4 py-3 text-sm text-[#9a5a1f]">
          {error}
        </p>
      )}

      {sent && (
        <div className="rounded-2xl bg-[#edf7ed] px-4 py-3 text-sm text-[#5f8a5f]">
          <p>
            Запись отправлена. Выбранное время забронировано, Александра
            свяжется с вами для подтверждения.
          </p>

          {paymentUrl && (
            <a
              href={paymentUrl}
              className="mt-3 inline-flex rounded-xl bg-[#332725] px-4 py-2 text-white"
            >
              Перейти к оплате
            </a>
          )}
        </div>
      )}

      <LegalConsent checked={legalAccepted} onChange={setLegalAccepted} />

      <button
        type="submit"
        disabled={sending || !appointmentTime || !legalAccepted}
        className="rounded-2xl bg-[#332725] px-8 py-4 text-white transition hover:bg-[#4a3935] disabled:opacity-60"
      >
        {sending ? "Отправляю..." : "Записаться на выбранное время"}
      </button>
    </form>
  );
}
