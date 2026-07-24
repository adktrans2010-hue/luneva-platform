"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import LegalConsent from "@/components/legal/legal-consent";
import {
  formatKopeks,
  type PublicConsultationProduct,
} from "@/src/lib/consultation-product-shared";
import { getAttribution, trackGoal } from "@/src/lib/client-analytics";

type AppointmentFormProps = {
  products: PublicConsultationProduct[];
};

const consultationFormats = [
  { value: "online", label: "Онлайн" },
  { value: "in_person", label: "Очно в кабинете" },
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

export default function AppointmentForm({ products }: AppointmentFormProps) {
  const minDate = useMemo(() => toDateInputValue(new Date()), []);
  const [formStartedAt] = useState(() => Date.now());
  const [productCode, setProductCode] = useState(products[0]?.code ?? "");
  const [consultationFormat, setConsultationFormat] = useState("online");
  const [consultationLocation, setConsultationLocation] = useState("online");
  const [appointmentDate, setAppointmentDate] = useState(minDate);
  const [appointmentTime, setAppointmentTime] = useState("");
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [legalAccepted, setLegalAccepted] = useState(false);
  const [formOpenedTracked, setFormOpenedTracked] = useState(false);

  const selectedProduct =
    products.find((product) => product.code === productCode) ?? products[0];

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

  function resetSlots() {
    setAppointmentTime("");
    setAvailableSlots([]);
    setLoadingSlots(true);
  }

  function changeConsultationFormat(format: string) {
    setConsultationFormat(format);
    setConsultationLocation(format === "in_person" ? "moscow" : "online");
    resetSlots();
  }

  function changeAppointmentDate(date: string) {
    setAppointmentDate(date);
    resetSlots();
  }

  function trackFormOpenOnce() {
    if (formOpenedTracked) return;

    setFormOpenedTracked(true);
    trackGoal("booking_form_open", {}, { once: true });
  }

  async function submitAppointment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setError(null);
    trackGoal("booking_submit");

    const response = await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productCode: selectedProduct?.code,
        preferredFormat: consultationFormat,
        consultationFormat,
        consultationLocation,
        appointmentDate,
        appointmentTime,
        name,
        email,
        website,
        formStartedAt,
        legalConsent: legalAccepted,
        attribution: getAttribution(),
      }),
    });

    const data = (await response.json()) as {
      error?: string;
      paymentUrl?: string | null;
    };

    if (!response.ok || !data.paymentUrl) {
      trackGoal("booking_error");
      setError(data.error ?? "Не удалось создать оплату. Проверьте данные и попробуйте ещё раз.");
      setSending(false);
      return;
    }

    trackGoal("booking_success", {}, { once: true, dedupeKey: appointmentTime });
    trackGoal("payment_created", {}, { once: true, dedupeKey: data.paymentUrl });
    window.location.assign(data.paymentUrl);
  }

  if (!selectedProduct) {
    return (
      <p className="mt-8 rounded-2xl bg-[#fff3df] px-4 py-3 text-sm text-[#9a5a1f]">
        Сейчас нет доступных услуг для онлайн-записи.
      </p>
    );
  }

  return (
    <form onSubmit={submitAppointment} onFocusCapture={trackFormOpenOnce} className="mt-8 grid gap-5">
      <input
        value={website}
        onChange={(event) => setWebsite(event.target.value)}
        type="text"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden="true"
      />

      <div className="rounded-2xl border border-[#ead7d1] bg-[#fff8f6] p-4">
        <p className="text-sm uppercase tracking-[0.18em] text-[#8a7a76]">
          Услуга
        </p>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {products.map((product) => (
            <button
              key={product.id}
              type="button"
              onClick={() => setProductCode(product.code)}
              className={
                productCode === product.code
                  ? "rounded-2xl bg-[#332725] px-4 py-3 text-left text-white"
                  : "rounded-2xl border border-[#ead7d1] bg-white px-4 py-3 text-left text-[#332725]"
              }
            >
              <span className="block font-medium">{product.name}</span>
              <span className="mt-1 block text-sm opacity-80">
                {product.sessionsCount} консультаций · {product.durationMinutes} мин ·{" "}
                {formatKopeks(product.priceKopeks)} руб.
              </span>
            </button>
          ))}
        </div>
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

      {consultationFormat === "in_person" && (
        <div className="rounded-2xl border border-[#ead7d1] bg-[#fff8f6] p-4">
          <p className="text-sm uppercase tracking-[0.18em] text-[#8a7a76]">
            Город очной консультации
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            {officeLocations.map((location) => (
              <button
                key={location.value}
                type="button"
                onClick={() => {
                  setConsultationLocation(location.value);
                  resetSlots();
                }}
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
        </div>
      )}

      <input
        value={appointmentDate}
        onChange={(event) => changeAppointmentDate(event.target.value)}
        type="date"
        min={minDate}
        className="rounded-2xl border border-[#ead7d1] px-4 py-3 outline-none transition focus:border-[#c98778]"
        required
      />

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
                  trackGoal("slot_selected", { slot });
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

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-sm uppercase tracking-[0.18em] text-[#8a7a76]">
            Имя
          </span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="rounded-2xl border border-[#ead7d1] px-4 py-3 outline-none transition focus:border-[#c98778]"
            placeholder="Ваше имя"
            required
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm uppercase tracking-[0.18em] text-[#8a7a76]">
            Email для подтверждения
          </span>
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            className="rounded-2xl border border-[#ead7d1] px-4 py-3 outline-none transition focus:border-[#c98778]"
            placeholder="email@example.ru"
            required
          />
        </label>
      </div>

      <p className="-mt-2 text-sm text-[#7a6d69]">
        На этот адрес придут подтверждение оплаты, запись и одноразовая ссылка для входа в личный кабинет.
      </p>

      <div className="rounded-2xl border border-[#ead7d1] bg-white p-5 text-[#5f5552]">
        <p className="font-medium text-[#332725]">Итог записи</p>
        <p className="mt-3">{selectedProduct.name}</p>
        <p>
          {selectedProduct.sessionsCount} консультаций ·{" "}
          {selectedProduct.durationMinutes} минут
        </p>
        <p>
          Формат:{" "}
          {
            consultationFormats.find((format) => format.value === consultationFormat)
              ?.label
          }
        </p>
        <p>
          Дата и время: {appointmentDate}
          {appointmentTime ? `, ${appointmentTime}` : ""}
        </p>
        <p className="mt-3 text-lg font-semibold text-[#332725]">
          К оплате: {formatKopeks(selectedProduct.priceKopeks)} руб.
        </p>
      </div>

      {error && (
        <p className="rounded-2xl bg-[#fff3df] px-4 py-3 text-sm text-[#9a5a1f]">
          {error}
        </p>
      )}

      <LegalConsent checked={legalAccepted} onChange={setLegalAccepted} />

      <button
        disabled={sending || !appointmentTime || !legalAccepted || !name || !email}
        className="rounded-2xl bg-[#332725] px-8 py-4 text-white transition hover:bg-[#4a3935] disabled:opacity-60"
      >
        {sending ? "Перехожу к оплате..." : "Оплатить и записаться"}
      </button>
    </form>
  );
}
