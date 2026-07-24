"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import LegalConsent from "@/components/legal/legal-consent";
import { getAttribution, trackGoal } from "@/src/lib/client-analytics";

type AccountPackage = {
  id: string;
  title: string;
  consultationFormat: "online" | "office";
  totalSessions: number;
  remainingSessions: number;
};

type AccountBookingFormProps = {
  packages: AccountPackage[];
};

const consultationFormats = [
  { value: "online", label: "Онлайн" },
  { value: "office", label: "Очно в кабинете" },
];

const officeLocations = [
  { value: "moscow", label: "Москва" },
  { value: "vidnoye", label: "Видное" },
];

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default function AccountBookingForm({ packages }: AccountBookingFormProps) {
  const minDate = useMemo(() => toDateInputValue(new Date()), []);
  const [consultationFormat, setConsultationFormat] = useState("online");
  const [consultationLocation, setConsultationLocation] = useState("online");
  const [appointmentDate, setAppointmentDate] = useState(minDate);
  const [appointmentTime, setAppointmentTime] = useState("");
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState("online");
  const [packageId, setPackageId] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [legalAccepted, setLegalAccepted] = useState(false);
  const [formOpenedTracked, setFormOpenedTracked] = useState(false);

  const availablePackages = packages.filter(
    (item) =>
      item.consultationFormat === consultationFormat && item.remainingSessions > 0
  );

  useEffect(() => {
    const controller = new AbortController();

    void fetch(
      `/api/appointments/availability?date=${appointmentDate}&format=${consultationFormat}&location=${consultationLocation}`,
      { signal: controller.signal }
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
  }, [appointmentDate, consultationFormat, consultationLocation]);

  function changeConsultationFormat(format: string) {
    setConsultationFormat(format);
    setConsultationLocation(format === "office" ? "moscow" : "online");
    setAppointmentTime("");
    setAvailableSlots([]);
    setLoadingSlots(true);
    setPaymentMethod("online");
    setPackageId("");
  }

  function changeConsultationLocation(location: string) {
    setConsultationLocation(location);
    setAppointmentTime("");
    setAvailableSlots([]);
    setLoadingSlots(true);
  }

  function changeAppointmentDate(date: string) {
    setAppointmentDate(date);
    setAppointmentTime("");
    setAvailableSlots([]);
    setLoadingSlots(true);
  }

  function trackFormOpenOnce() {
    if (formOpenedTracked) return;

    setFormOpenedTracked(true);
    trackGoal("booking_form_open", { source: "account" }, { once: true });
  }

  async function submitAppointment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setSent(false);
    setError(null);
    setPaymentUrl(null);
    trackGoal("booking_submit", { source: "account" });

    const response = await fetch("/api/account/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        consultationFormat,
        consultationLocation,
        appointmentDate,
        appointmentTime,
        paymentMethod,
        packageId: paymentMethod === "package" ? packageId : null,
        message,
        legalConsent: legalAccepted,
        attribution: getAttribution(),
      }),
    });

    const data = (await response.json()) as {
      error?: string;
      paymentUrl?: string | null;
    };

    if (!response.ok) {
      trackGoal("booking_error", { source: "account" });
      setError(data.error ?? "Не удалось создать запись.");
      setSending(false);
      return;
    }

    trackGoal("booking_success", { source: "account" }, { once: true, dedupeKey: appointmentTime });
    if (data.paymentUrl) {
      trackGoal("payment_created", { source: "account" }, { once: true, dedupeKey: data.paymentUrl });
    }

    setSent(true);
    setMessage("");
    setAppointmentTime("");
    setPaymentUrl(data.paymentUrl ?? null);
    setSending(false);
    setLegalAccepted(false);

    const slotsResponse = await fetch(
      `/api/appointments/availability?date=${appointmentDate}&format=${consultationFormat}&location=${consultationLocation}`
    );
    const slotsData = (await slotsResponse.json()) as { slots: string[] };
    setAvailableSlots(slotsData.slots);
  }

  return (
    <form onSubmit={submitAppointment} onFocusCapture={trackFormOpenOnce} className="grid gap-5">
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

      {consultationFormat === "office" && (
        <div className="rounded-2xl border border-[#ead7d1] bg-[#fff8f6] p-4">
          <p className="text-sm uppercase tracking-[0.18em] text-[#8a7a76]">
            Город очной консультации
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            {officeLocations.map((location) => (
              <button
                key={location.value}
                type="button"
                onClick={() => changeConsultationLocation(location.value)}
                className={
                  consultationLocation === location.value
                    ? "rounded-xl bg-[#332725] px-4 py-2 text-white"
                    : "rounded-xl border border-[#332725] px-4 py-2 text-[#332725]"
                }
              >
                {location.label}
              </button>
            ))}
          </div>
          <p className="mt-3 text-sm text-[#8a7a76]">
            Точный адрес и детали встречи будут подтверждены отдельно.
          </p>
        </div>
      )}

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
          Свободное время
        </p>

        {loadingSlots ? (
          <p className="mt-3 text-[#5f5552]">Проверяю свободные окна...</p>
        ) : availableSlots.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-3">
            {availableSlots.map((slot) => (
              <button
                key={slot}
                type="button"
                onClick={() => {
                  setAppointmentTime(slot);
                  trackGoal("slot_selected", { source: "account", slot });
                }}
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

      <div className="rounded-2xl border border-[#ead7d1] bg-[#fff8f6] p-4">
        <p className="text-sm uppercase tracking-[0.18em] text-[#8a7a76]">
          Оплата
        </p>

        <div className="mt-4 flex flex-wrap gap-3">
          {availablePackages.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setPaymentMethod("package");
                setPackageId(availablePackages[0]?.id ?? "");
              }}
              className={
                paymentMethod === "package"
                  ? "rounded-xl bg-[#332725] px-4 py-2 text-white"
                  : "rounded-xl border border-[#332725] px-4 py-2 text-[#332725]"
              }
            >
              Использовать пакет
            </button>
          )}

          <button
            type="button"
            onClick={() => setPaymentMethod("online")}
            className={
              paymentMethod === "online"
                ? "rounded-xl bg-[#332725] px-4 py-2 text-white"
                : "rounded-xl border border-[#332725] px-4 py-2 text-[#332725]"
            }
          >
            Онлайн-оплата
          </button>

          <button
            type="button"
            onClick={() => setPaymentMethod("after_confirmation")}
            className={
              paymentMethod === "after_confirmation"
                ? "rounded-xl bg-[#332725] px-4 py-2 text-white"
                : "rounded-xl border border-[#332725] px-4 py-2 text-[#332725]"
            }
          >
            После подтверждения
          </button>
        </div>

        {paymentMethod === "package" && availablePackages.length > 0 && (
          <select
            value={packageId}
            onChange={(event) => setPackageId(event.target.value)}
            className="mt-4 w-full rounded-2xl border border-[#ead7d1] bg-white px-4 py-3"
          >
            {availablePackages.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}: осталось {item.remainingSessions} из{" "}
                {item.totalSessions}
              </option>
            ))}
          </select>
        )}
      </div>

      <textarea
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        rows={4}
        className="rounded-2xl border border-[#ead7d1] px-4 py-3 outline-none transition focus:border-[#c98778]"
        placeholder="Комментарий к записи, если нужно"
      />

      {error && (
        <p className="rounded-2xl bg-[#fff3df] px-4 py-3 text-sm text-[#9a5a1f]">
          {error}
        </p>
      )}

      {sent && (
        <div className="rounded-2xl bg-[#edf7ed] px-4 py-3 text-sm text-[#5f8a5f]">
          <p>Запись создана. Она появилась в списке ваших консультаций.</p>
          {paymentMethod === "package" && (
            <p className="mt-2">
              Из пакета списана 1 консультация. Обновите страницу, чтобы увидеть
              новый остаток.
            </p>
          )}
          {paymentUrl && (
            <a
              href={paymentUrl}
              onClick={() => trackGoal("payment_click", { source: "account" }, { once: true, dedupeKey: paymentUrl })}
              className="mt-3 inline-flex rounded-xl bg-[#332725] px-4 py-2 text-white"
            >
              Перейти к оплате
            </a>
          )}
        </div>
      )}

      <LegalConsent checked={legalAccepted} onChange={setLegalAccepted} />

      <button
        disabled={sending || !appointmentTime || !legalAccepted}
        className="rounded-2xl bg-[#332725] px-8 py-4 text-white transition hover:bg-[#4a3935] disabled:opacity-60"
      >
        {sending ? "Записываю..." : "Записаться на выбранное время"}
      </button>
    </form>
  );
}
