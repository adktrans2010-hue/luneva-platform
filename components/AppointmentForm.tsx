"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";

import LegalConsent from "@/components/legal/legal-consent";
import {
  formatKopeks,
  type PublicConsultationProduct,
} from "@/src/lib/consultation-product-shared";
import { getAttribution, trackGoal } from "@/src/lib/client-analytics";
import {
  createPromotionQuoteRequestKey,
  createPromotionQuoteFallback,
  quoteForCurrentSelection,
  readPromotionQuoteResponse,
  type PromotionQuoteState,
} from "@/src/lib/promotion-quote";

type AppointmentFormProps = {
  products: PublicConsultationProduct[];
};

type AvailableDay = { date: string; slots: string[] };
type QuickSlot = { date: string; time: string };

const consultationFormats = [
  { value: "online", label: "Онлайн" },
  { value: "in_person", label: "Очно в кабинете" },
];

const officeLocations = [
  { value: "moscow", label: "Москва" },
  { value: "vidnoye", label: "Видное" },
];

function campaignPromoFromUrl() {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get("promo")?.trim() ?? "";
}

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatBookingDate(date: string, withWeekday = false) {
  const parsed = new Date(`${date}T12:00:00`);
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short",
    ...(withWeekday ? { weekday: "short" } : {}),
  }).format(parsed).replace(".", "");
}

function formatBookingDateLong(date: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
  }).format(new Date(`${date}T12:00:00`));
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
  const [availability, setAvailability] = useState<AvailableDay[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [showAllNearest, setShowAllNearest] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [legalAccepted, setLegalAccepted] = useState(false);
  const [formOpenedTracked, setFormOpenedTracked] = useState(false);
  const [campaignPromo] = useState(campaignPromoFromUrl);
  const [promoOpen, setPromoOpen] = useState(() => Boolean(campaignPromo));
  const [promoInput, setPromoInput] = useState(campaignPromo);
  const [appliedPromoCode, setAppliedPromoCode] = useState(campaignPromo);
  const [promotionQuoteState, setPromotionQuoteState] =
    useState<PromotionQuoteState | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const promoRequestId = useRef(0);
  const contactFieldsRef = useRef<HTMLDivElement>(null);
  const calendarButtonRef = useRef<HTMLButtonElement>(null);
  const calendarPopoverRef = useRef<HTMLDivElement>(null);
  const appointmentDateRef = useRef(minDate);
  const dateChosenByUserRef = useRef(false);

  const selectedProduct =
    products.find((product) => product.code === productCode) ?? products[0];
  const promotionQuote = quoteForCurrentSelection(
    promotionQuoteState,
    selectedProduct,
    appliedPromoCode
  );

  const displayedPriceKopeks =
    promotionQuote?.applied && promotionQuote.finalPriceKopeks
      ? promotionQuote.finalPriceKopeks
      : selectedProduct?.priceKopeks ?? 0;

  const validatePromo = useCallback(
    async (
      code: string,
      product: PublicConsultationProduct,
      signal: AbortSignal
    ) => {
      const requestId = ++promoRequestId.current;
      const requestKey = createPromotionQuoteRequestKey(product.code, code);
      setPromoLoading(true);

      try {
        const response = await fetch(
          `/api/appointments?productCode=${encodeURIComponent(product.code)}&promo=${encodeURIComponent(code)}`,
          { signal }
        );
        const quote = await readPromotionQuoteResponse(
          response,
          product.priceKopeks
        );

        if (requestId === promoRequestId.current) {
          setPromotionQuoteState({ requestKey, quote });
        }
      } catch (quoteError) {
        if (quoteError instanceof DOMException && quoteError.name === "AbortError") {
          return;
        }

        if (requestId === promoRequestId.current) {
          setPromotionQuoteState({
            requestKey,
            quote: createPromotionQuoteFallback(product.priceKopeks),
          });
        }
      } finally {
        if (requestId === promoRequestId.current) {
          setPromoLoading(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    if (!appliedPromoCode || !selectedProduct) {
      promoRequestId.current += 1;
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void validatePromo(appliedPromoCode, selectedProduct, controller.signal);
    }, 0);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [appliedPromoCode, selectedProduct, validatePromo]);

  useEffect(() => {
    const controller = new AbortController();

    void fetch(
      `/api/appointments/availability?date=${minDate}&rangeDays=30&format=${consultationFormat}&location=${consultationLocation}`,
      { signal: controller.signal }
    )
      .then((response) => response.json())
      .then((data: { availability?: AvailableDay[] }) => {
        const nextAvailability = data.availability ?? [];
        setAvailability(nextAvailability);
        const selectedDate = appointmentDateRef.current;
        const selectedDay = nextAvailability.find((day) => day.date === selectedDate);
        const nextDate = dateChosenByUserRef.current && selectedDay ? selectedDate : nextAvailability[0]?.date ?? minDate;
        appointmentDateRef.current = nextDate;
        setAppointmentDate(nextDate);
        setAvailableSlots(nextAvailability.find((day) => day.date === nextDate)?.slots ?? []);
        setLoadingSlots(false);
      })
      .catch((fetchError: unknown) => {
        if (fetchError instanceof DOMException && fetchError.name === "AbortError") {
          return;
        }

        setAvailability([]);
        setAvailableSlots([]);
        setLoadingSlots(false);
      });

    return () => controller.abort();
  }, [consultationFormat, consultationLocation, productCode, minDate]);

  useEffect(() => {
    if (!calendarOpen) return;

    function closeFromOutside(event: PointerEvent) {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (
        calendarPopoverRef.current?.contains(target) ||
        calendarButtonRef.current?.contains(target)
      ) {
        return;
      }

      setCalendarOpen(false);
      window.setTimeout(() => calendarButtonRef.current?.focus(), 0);
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setCalendarOpen(false);
      window.setTimeout(() => calendarButtonRef.current?.focus(), 0);
    }

    document.addEventListener("pointerdown", closeFromOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeFromOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [calendarOpen]);

  function resetSlots() {
    setAppointmentTime("");
    setAvailableSlots([]);
    setLoadingSlots(true);
  }

  function changeConsultationFormat(format: string) {
    setConsultationFormat(format);
    setConsultationLocation(format === "in_person" ? "moscow" : "online");
    dateChosenByUserRef.current = false;
    trackFormOpenOnce();
    resetSlots();
  }

  function changeAppointmentDate(date: string) {
    const slots = availability.find((day) => day.date === date)?.slots ?? [];
    if (slots.length === 0) return;
    setAppointmentDate(date);
    appointmentDateRef.current = date;
    dateChosenByUserRef.current = true;
    setAppointmentTime("");
    setAvailableSlots(slots);
    setCalendarOpen(false);
    window.setTimeout(() => calendarButtonRef.current?.focus(), 0);
    trackFormOpenOnce();
  }

  function selectSlot(date: string, time: string) {
    setAppointmentDate(date);
    setAvailableSlots(availability.find((day) => day.date === date)?.slots ?? []);
    setAppointmentTime(time);
    appointmentDateRef.current = date;
    dateChosenByUserRef.current = true;
    trackFormOpenOnce();
    trackGoal("slot_selected", {
      service_type: selectedProduct?.code ?? "consultation",
      consultation_format: consultationFormat,
      booking_channel: "website",
    }, { once: true, dedupeKey: `${date}:${time}` });
    window.setTimeout(() => contactFieldsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  }

  function trackFormOpenOnce() {
    if (formOpenedTracked) return;

    setFormOpenedTracked(true);
    trackGoal(
      "booking_started",
      {
        service_type: selectedProduct?.code ?? "consultation",
        consultation_format: consultationFormat,
        booking_channel: "website",
      },
      { once: true },
    );
  }

  const nearestSlots = useMemo<QuickSlot[]>(
    () => availability.flatMap((day) => day.slots.map((time) => ({ date: day.date, time }))).slice(0, 12),
    [availability]
  );
  const visibleNearestSlots = showAllNearest ? nearestSlots : nearestSlots.slice(0, 5);
  const availableDateSet = useMemo(
    () => new Set(availability.map((day) => day.date)),
    [availability]
  );
  const calendarDays = useMemo(
    () =>
      Array.from({ length: 30 }, (_, offset) => {
        const date = new Date(`${minDate}T12:00:00`);
        date.setDate(date.getDate() + offset);
        return {
          date: toDateInputValue(date),
          label: date.getDate(),
        };
      }),
    [minDate]
  );

  async function submitAppointment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setError(null);
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
        phone,
        email,
        website,
        formStartedAt,
        legalConsent: legalAccepted,
        attribution: getAttribution(),
        promoCode: appliedPromoCode,
      }),
    });

    const data = (await response.json()) as {
      error?: string;
      paymentUrl?: string | null;
    };

    if (!response.ok || !data.paymentUrl) {
      setError(data.error ?? "Не удалось создать оплату. Проверьте данные и попробуйте ещё раз.");
      setSending(false);
      return;
    }

    const safeParams = {
      service_type: selectedProduct?.code ?? "consultation",
      consultation_format: consultationFormat,
      booking_channel: "website",
    };
    trackGoal("booking_created", safeParams, {
      once: true,
      dedupeKey: appointmentTime,
    });
    trackGoal("payment_started", safeParams, {
      once: true,
      dedupeKey: data.paymentUrl,
    });
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
    <form onSubmit={submitAppointment} onFocusCapture={trackFormOpenOnce} className="ym-hide-content mt-8 grid gap-5">
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
              onClick={() => {
                setProductCode(product.code);
                dateChosenByUserRef.current = false;
                trackFormOpenOnce();
                resetSlots();
              }}
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

      <div className="rounded-2xl border border-[#ead7d1] bg-white p-4">
        {!promoOpen ? (
          <button
            type="button"
            onClick={() => setPromoOpen(true)}
            className="text-sm font-medium text-[#332725] underline decoration-[#c98778] underline-offset-4"
          >
            Есть промокод?
          </button>
        ) : (
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <label className="grid gap-2">
              <span className="text-sm uppercase tracking-[0.18em] text-[#8a7a76]">
                Промокод
              </span>
              <input
                value={promoInput}
                onChange={(event) => setPromoInput(event.target.value)}
                className="rounded-xl border border-[#ead7d1] px-4 py-3 uppercase outline-none transition focus:border-[#c98778]"
                placeholder="Введите промокод"
                autoComplete="off"
              />
            </label>
            <button
              type="button"
              onClick={() => setAppliedPromoCode(promoInput)}
              disabled={!promoInput.trim() || promoLoading}
              className="rounded-xl border border-[#332725] px-5 py-3 font-medium text-[#332725] disabled:opacity-50"
            >
              {promoLoading ? "Проверяю..." : "Применить"}
            </button>
          </div>
        )}

        {promotionQuote?.message && (
          <p
            className={`mt-3 text-sm ${
              promotionQuote.applied ? "text-[#55704b]" : "text-[#9a5a1f]"
            }`}
          >
            {promotionQuote.message}
          </p>
        )}
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
                  dateChosenByUserRef.current = false;
                  trackFormOpenOnce();
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

      <div className="rounded-2xl border border-[#ead7d1] bg-[#fff8f6] p-4">
        <p className="text-sm uppercase tracking-[0.18em] text-[#8a7a76]">Ближайшее свободное время</p>
        {loadingSlots ? <p className="mt-3 text-[#5f5552]">Проверяю свободные окна...</p> : nearestSlots.length > 0 ? (
          <>
            <div className="mt-3 flex flex-wrap gap-2">
              {visibleNearestSlots.map((slot, index) => (
                <button key={`${slot.date}:${slot.time}`} type="button" onClick={() => selectSlot(slot.date, slot.time)} className={`min-h-11 rounded-xl border px-3 py-2 text-sm transition ${appointmentDate === slot.date && appointmentTime === slot.time ? "border-[#332725] bg-[#332725] text-white" : "border-[#ead7d1] bg-white text-[#332725] hover:border-[#c98778]"} ${index >= 3 && !showAllNearest ? "hidden sm:inline-flex" : "inline-flex"}`}>
                  {formatBookingDate(slot.date)} · {slot.time}
                </button>
              ))}
            </div>
            {nearestSlots.length > 5 && <button type="button" onClick={() => setShowAllNearest((value) => !value)} className="mt-3 text-sm font-medium text-[#332725] underline decoration-[#c98778] underline-offset-4">{showAllNearest ? "Скрыть" : "Показать ещё"}</button>}
          </>
        ) : <p className="mt-3 text-[#5f5552]">Свободных окон на ближайшие даты пока нет.</p>}
      </div>

      {!loadingSlots && availability.length > 0 && (
        <div className="relative">
          <button
            ref={calendarButtonRef}
            type="button"
            aria-controls="booking-date-popover"
            aria-expanded={calendarOpen}
            aria-haspopup="dialog"
            onClick={() => setCalendarOpen((open) => !open)}
            className="flex min-h-12 w-full items-center justify-between rounded-2xl border border-[#ead7d1] bg-white px-4 py-3 text-left text-[#332725] transition hover:border-[#c98778] focus:outline-none focus:ring-2 focus:ring-[#c98778]/40"
          >
            <span className="flex min-w-0 items-center gap-3">
              <span aria-hidden="true" className="text-lg">📅</span>
              <span className="grid gap-0.5">
                <span className="text-xs uppercase tracking-[0.14em] text-[#8a7a76]">
                  Дата консультации
                </span>
                <span className="truncate font-medium">
                  {formatBookingDateLong(appointmentDate)}
                </span>
              </span>
            </span>
            <span aria-hidden="true" className="ml-3 text-sm text-[#8a7a76]">
              {calendarOpen ? "▲" : "▼"}
            </span>
          </button>

          {calendarOpen && (
            <div
              ref={calendarPopoverRef}
              id="booking-date-popover"
              role="dialog"
              aria-label="Выбор даты консультации"
              className="absolute left-0 z-20 mt-2 w-full rounded-2xl border border-[#ead7d1] bg-white p-4 shadow-lg sm:w-[22rem]"
            >
              <p className="text-sm uppercase tracking-[0.14em] text-[#8a7a76]">
                Выберите доступный день
              </p>
              <div className="mt-3 grid grid-cols-7 gap-1.5">
                {calendarDays.map(({ date, label }) => {
                  const enabled = availableDateSet.has(date);
                  const selected = appointmentDate === date;
                  return (
                    <button
                      key={date}
                      type="button"
                      disabled={!enabled}
                      onClick={() => changeAppointmentDate(date)}
                      aria-pressed={selected}
                      aria-label={`${formatBookingDate(date, true)}${enabled ? ", есть свободное время" : ", нет свободных окон"}`}
                      className={
                        selected
                          ? "relative min-h-10 rounded-lg bg-[#332725] px-1 text-sm text-white"
                          : enabled
                            ? "relative min-h-10 rounded-lg border border-[#d9aa9e] bg-[#fff8f6] px-1 text-sm text-[#332725] hover:border-[#c98778]"
                            : "min-h-10 rounded-lg bg-[#f3efed] px-1 text-sm text-[#a79c98]"
                      }
                    >
                      {label}
                      {enabled && !selected && (
                        <span
                          aria-hidden="true"
                          className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-[#c98778]"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
              <p className="mt-3 text-xs text-[#7a6d69]">
                Светлые даты пока недоступны для записи.
              </p>
            </div>
          )}
        </div>
      )}

      <div className="rounded-2xl border border-[#ead7d1] bg-[#fff8f6] p-4">
        <p className="text-sm uppercase tracking-[0.18em] text-[#8a7a76]">
          Свободное время на {formatBookingDateLong(appointmentDate)}
        </p>
        {loadingSlots ? <p className="mt-3 text-[#5f5552]">Проверяю свободные окна...</p> : availableSlots.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {availableSlots.map((slot) => <button key={slot} type="button" onClick={() => selectSlot(appointmentDate, slot)} className={appointmentTime === slot ? "min-h-11 rounded-xl bg-[#332725] px-4 py-2 text-white" : "min-h-11 rounded-xl border border-[#332725] bg-white px-4 py-2 text-[#332725]"}>{slot}</button>)}
          </div>
        ) : <p className="mt-3 text-[#5f5552]">На эту дату свободных окон нет. Выберите ближайший доступный день в календаре или одно из ближайших времён выше.</p>}
      </div>

      <div ref={contactFieldsRef} className="grid gap-4 scroll-mt-28 md:grid-cols-3">
        <label className="grid gap-2">
          <span className="text-sm uppercase tracking-[0.18em] text-[#8a7a76]">
            Имя
          </span>
          <input
            value={name}
            onChange={(event) => { event.target.setCustomValidity(""); setName(event.target.value); }}
            onInvalid={(event) => event.currentTarget.setCustomValidity("Введите имя")}
            className="ym-disable-keys rounded-2xl border border-[#ead7d1] px-4 py-3 outline-none transition focus:border-[#c98778]"
            placeholder="Ваше имя"
            required
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm uppercase tracking-[0.18em] text-[#8a7a76]">
            Телефон
          </span>
          <input
            value={phone}
            onChange={(event) => { event.target.setCustomValidity(""); setPhone(event.target.value); }}
            onInvalid={(event) => event.currentTarget.setCustomValidity("Укажите телефон")}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            pattern="[+0-9() -]{10,25}"
            className="ym-disable-keys rounded-2xl border border-[#ead7d1] px-4 py-3 outline-none transition focus:border-[#c98778]"
            placeholder="+7 999 123-45-67"
            required
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm uppercase tracking-[0.18em] text-[#8a7a76]">
            Email для подтверждения
          </span>
          <input
            value={email}
            onChange={(event) => { event.target.setCustomValidity(""); setEmail(event.target.value); }}
            onInvalid={(event) => event.currentTarget.setCustomValidity("Укажите email")}
            type="email"
            className="ym-disable-keys rounded-2xl border border-[#ead7d1] px-4 py-3 outline-none transition focus:border-[#c98778]"
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
          Дата и время: {formatBookingDate(appointmentDate)}
          {appointmentTime ? `, ${appointmentTime}` : ""}
        </p>
        <p className="mt-3 text-lg font-semibold text-[#332725]">
          К оплате:{" "}
          {promotionQuote?.applied && (
            <span className="mr-2 text-base font-normal text-[#8a7a76] line-through">
              {formatKopeks(selectedProduct.priceKopeks)} руб.
            </span>
          )}
          {formatKopeks(displayedPriceKopeks)} руб.
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
