"use client";

import { useEffect, useMemo, useState } from "react";

import { adminFetch } from "@/src/lib/admin-fetch";

type AppointmentStatus = "new" | "scheduled" | "completed" | "cancelled";

type AppointmentHistoryEntry = {
  id: string;
  action: string;
  details: string | null;
  createdAt: string;
};

type Appointment = {
  id: string;
  name: string;
  contact: string;
  contactMethod: string;
  consultationFormat: "online" | "office";
  consultationLocation: "online" | "moscow" | "vidnoye";
  preferredTime: string | null;
  message: string;
  scheduledAt: string | null;
  notes: string | null;
  status: AppointmentStatus;
  paymentMethod: "online" | "after_confirmation" | "package";
  paymentStatus:
    | "waiting"
    | "invoice_sent"
    | "waiting_for_capture"
    | "paid"
    | "partially_refunded"
    | "refund_pending"
    | "refund_failed"
    | "manual_review"
    | "cancelled"
    | "refunded"
    | "not_required";
  yookassaPaymentId: string | null;
  paymentAmount: number | null;
  paymentLink: string | null;
  paymentNote: string | null;
  notificationStatus: "not_sent" | "sent" | "failed";
  createdAt: string;
  updatedAt: string;
  history: AppointmentHistoryEntry[];
  paymentSummary: {
    id: string;
    providerPaymentId: string | null;
    status: string;
    providerStatus: string | null;
    amountKopeks: number;
    paidAmountKopeks: number;
    refundedAmountKopeks: number;
    activeRefundAmountKopeks: number;
    refundableAmountKopeks: number;
    capturedAt: string | null;
    canceledAt: string | null;
    fullyRefundedAt: string | null;
    latestRefund: {
      id: string;
      providerRefundId: string | null;
      amountKopeks: number;
      type: string;
      status: string;
      reason: string | null;
      requestedBy: string;
      createdAt: string;
      processedAt: string | null;
    } | null;
  } | null;
};

type AvailabilitySlot = {
  id: string;
  date: string;
  time: string;
  consultationFormat: "online" | "office";
  consultationLocation: "online" | "moscow" | "vidnoye";
  enabled: boolean;
  createdAt: string;
};

const statusLabels: Record<AppointmentStatus, string> = {
  new: "Новая",
  scheduled: "Запланирована",
  completed: "Проведена",
  cancelled: "Отменена",
};

const methodLabels: Record<string, string> = {
  telegram: "Telegram",
  whatsapp: "WhatsApp",
  phone: "Телефон",
  email: "Email",
  contact: "Контакт",
};

const formatLabels: Record<string, string> = {
  online: "Онлайн",
  office: "Очно в кабинете",
};

const consultationFormats = [
  { value: "online", label: "Онлайн" },
  { value: "office", label: "Очно в кабинете" },
];

const locationLabels: Record<string, string> = {
  online: "Онлайн",
  moscow: "Москва",
  vidnoye: "Видное",
};

const officeLocations = [
  { value: "moscow", label: "Москва" },
  { value: "vidnoye", label: "Видное" },
];

const paymentMethodLabels: Record<string, string> = {
  online: "ЮKassa",
  after_confirmation: "После подтверждения",
  package: "Пакет консультаций",
};

const paymentStatusLabels: Record<string, string> = {
  waiting: "Ожидает оплаты",
  invoice_sent: "Ссылка отправлена",
  waiting_for_capture: "Ожидает подтверждения",
  paid: "Оплачено",
  partially_refunded: "Частичный возврат",
  refund_pending: "Возврат в обработке",
  refund_failed: "Ошибка возврата",
  manual_review: "Требует проверки",
  cancelled: "Отменено",
  refunded: "Возврат",
  not_required: "Без онлайн-оплаты",
};

const notificationStatusLabels: Record<string, string> = {
  not_sent: "Не отправлено",
  sent: "Отправлено",
  failed: "Ошибка",
};

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function toDateTimeInputValue(value: string | null) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const day = toDateInputValue(date);
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${day}T${hours}:${minutes}`;
}

function formatDateTime(value: string | null) {
  if (!value) return "Не назначено";

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatRubFromKopeks(value: number) {
  return `${(value / 100).toLocaleString("ru-RU")} руб.`;
}

export default function AdminAppointments() {
  const today = useMemo(() => toDateInputValue(new Date()), []);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [selectedDate, setSelectedDate] = useState(today);
  const [newSlotTime, setNewSlotTime] = useState("10:00");
  const [scheduleFormat, setScheduleFormat] = useState<"online" | "office">(
    "online"
  );
  const [scheduleLocation, setScheduleLocation] = useState<
    "online" | "moscow" | "vidnoye"
  >("online");
  const [view, setView] = useState<"calendar" | "list" | "journal">("calendar");
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | "all">(
    "all"
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadAppointments() {
    const [appointmentsResponse, slotsResponse] = await Promise.all([
      adminFetch("/api/admin/appointments"),
      adminFetch(
        `/api/admin/availability?date=${selectedDate}&format=${scheduleFormat}&location=${scheduleLocation}`
      ),
    ]);

    const appointmentsData = (await appointmentsResponse.json()) as Appointment[];
    const slotsData = (await slotsResponse.json()) as AvailabilitySlot[];

    setAppointments(appointmentsData);
    setSlots(slotsData);
    setLoading(false);
  }

  async function addSlot() {
    setError(null);

    const response = await adminFetch("/api/admin/availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: selectedDate,
        time: newSlotTime,
        format: scheduleFormat,
        location: scheduleLocation,
      }),
    });

    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      setError(data.error ?? "Не удалось добавить свободное время.");
      return;
    }

    await loadAppointments();
  }

  async function deleteSlot(id: string) {
    await adminFetch(`/api/admin/availability/${id}`, { method: "DELETE" });
    await loadAppointments();
  }

  async function updateAppointment(
    appointment: Appointment,
    patch: Partial<Appointment>
  ) {
    setError(null);

    const nextAppointment = { ...appointment, ...patch };
    const response = await adminFetch(`/api/admin/appointments/${appointment.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: nextAppointment.status,
        scheduledAt: nextAppointment.scheduledAt,
        consultationLocation: nextAppointment.consultationLocation,
        notes: nextAppointment.notes,
        paymentStatus: nextAppointment.paymentStatus,
        paymentLink: nextAppointment.paymentLink,
        paymentNote: nextAppointment.paymentNote,
        notificationStatus: nextAppointment.notificationStatus,
      }),
    });

    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      setError(data.error ?? "Не удалось обновить консультацию.");
      return;
    }

    await loadAppointments();
  }

  async function deleteAppointment(id: string) {
    const confirmed = window.confirm("Удалить эту запись и историю?");
    if (!confirmed) return;

    await adminFetch(`/api/admin/appointments/${id}`, { method: "DELETE" });
    await loadAppointments();
  }

  async function createPayment(appointment: Appointment) {
    setError(null);

    const response = await adminFetch(
      `/api/admin/appointments/${appointment.id}/payment`,
      { method: "POST" }
    );

    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      setError(data.error ?? "Не удалось создать платеж ЮKassa.");
      return;
    }

    await loadAppointments();
  }

  async function createRefund(
    appointment: Appointment,
    type: "full" | "partial"
  ) {
    const payment = appointment.paymentSummary;
    if (!payment) return;

    const reason = window.prompt("Укажите причину возврата");
    if (!reason?.trim()) return;

    let amountKopeks: number | undefined;
    let confirmText: string | undefined;

    if (type === "full") {
      const confirmed = window.prompt(
        `Вы собираетесь вернуть клиенту ${formatRubFromKopeks(
          payment.refundableAmountKopeks
        )}.\nЗапись: ${appointment.name}.\nДействие нельзя отменить.\nВведите ВОЗВРАТ для подтверждения.`
      );
      if (confirmed !== "ВОЗВРАТ") return;
      confirmText = confirmed;
    } else {
      const amountRub = window.prompt(
        `Доступно к возврату: ${formatRubFromKopeks(
          payment.refundableAmountKopeks
        )}.\nВведите сумму частичного возврата в рублях.`
      );
      if (!amountRub) return;
      amountKopeks = Math.round(Number(amountRub.replace(",", ".")) * 100);
    }

    setError(null);
    const response = await adminFetch(
      `/api/admin/payments/${payment.id}/refund`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          amountKopeks,
          reason,
          confirmText,
        }),
      }
    );

    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      setError(data.error ?? "Не удалось оформить возврат.");
      return;
    }

    await loadAppointments();
  }

  async function cancelPaymentAuthorization(appointment: Appointment) {
    const payment = appointment.paymentSummary;
    if (!payment) return;

    const confirmed = window.confirm(
      "Отменить авторизацию платежа в ЮKassa? Это действие доступно только для waiting_for_capture."
    );
    if (!confirmed) return;

    const response = await adminFetch(
      `/api/admin/payments/${payment.id}/cancel`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Отмена из админки" }),
      }
    );

    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      setError(data.error ?? "Не удалось отменить платеж.");
      return;
    }

    await loadAppointments();
  }

  async function sendClientMessage(appointment: Appointment, message: string) {
    setError(null);

    const response = await adminFetch(
      `/api/admin/appointments/${appointment.id}/message`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      }
    );

    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      setError(data.error ?? "Не удалось отправить сообщение клиенту.");
      return false;
    }

    await loadAppointments();
    return true;
  }

  useEffect(() => {
    const controller = new AbortController();

    void Promise.all([
      adminFetch("/api/admin/appointments", { signal: controller.signal }),
      adminFetch(
        `/api/admin/availability?date=${selectedDate}&format=${scheduleFormat}&location=${scheduleLocation}`,
        {
          signal: controller.signal,
        }
      ),
    ])
      .then(async ([appointmentsResponse, slotsResponse]) => {
        const appointmentsData =
          (await appointmentsResponse.json()) as Appointment[];
        const slotsData = (await slotsResponse.json()) as AvailabilitySlot[];

        setAppointments(appointmentsData);
        setSlots(slotsData);
        setLoading(false);
      })
      .catch((fetchError: unknown) => {
        if (fetchError instanceof DOMException && fetchError.name === "AbortError") {
          return;
        }

        setLoading(false);
      });

    return () => controller.abort();
  }, [selectedDate, scheduleFormat, scheduleLocation]);

  const selectedDateAppointments = appointments.filter((appointment) => {
    if (!appointment.scheduledAt) return false;

    return (
      toDateInputValue(new Date(appointment.scheduledAt)) === selectedDate &&
      appointment.consultationFormat === scheduleFormat &&
      appointment.consultationLocation === scheduleLocation
    );
  });

  const statusCounts = useMemo(() => {
    return {
      all: appointments.length,
      new: appointments.filter((appointment) => appointment.status === "new")
        .length,
      scheduled: appointments.filter(
        (appointment) => appointment.status === "scheduled"
      ).length,
      completed: appointments.filter(
        (appointment) => appointment.status === "completed"
      ).length,
      cancelled: appointments.filter(
        (appointment) => appointment.status === "cancelled"
      ).length,
    };
  }, [appointments]);

  const filteredAppointments =
    statusFilter === "all"
      ? appointments
      : appointments.filter((appointment) => appointment.status === statusFilter);

  if (loading) {
    return (
      <section className="px-6 py-16">
        <div className="mx-auto max-w-7xl text-[#332725]">Загрузка...</div>
      </section>
    );
  }

  return (
    <section className="px-6 py-16">
      <div className="mx-auto max-w-7xl">
        {error && (
          <p className="mb-6 rounded-2xl bg-[#fff3df] px-4 py-3 text-sm text-[#9a5a1f]">
            {error}
          </p>
        )}

        <div className="rounded-[2rem] border border-[#ead7d1] bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="font-serif text-4xl text-[#332725]">
                Календарь приема
              </h2>
              <p className="mt-3 text-[#5f5552]">
                Добавьте свободные окна отдельно для онлайн и очного приема.
                На сайте клиент увидит график выбранного формата.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setView("calendar")}
                className={
                  view === "calendar"
                    ? "rounded-xl bg-[#332725] px-4 py-2 text-white"
                    : "rounded-xl border border-[#332725] px-4 py-2 text-[#332725]"
                }
              >
                Календарь
              </button>
              <button
                onClick={() => setView("list")}
                className={
                  view === "list"
                    ? "rounded-xl bg-[#332725] px-4 py-2 text-white"
                    : "rounded-xl border border-[#332725] px-4 py-2 text-[#332725]"
                }
              >
                Список
              </button>
              <button
                onClick={() => setView("journal")}
                className={
                  view === "journal"
                    ? "rounded-xl bg-[#332725] px-4 py-2 text-white"
                    : "rounded-xl border border-[#332725] px-4 py-2 text-[#332725]"
                }
              >
                Журнал
              </button>
            </div>
          </div>

          <div className="mt-8 rounded-2xl bg-[#fff8f6] p-4">
            <p className="text-sm uppercase tracking-[0.18em] text-[#8a7a76]">
              График приема
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              {consultationFormats.map((format) => (
                <button
                  key={format.value}
                  onClick={() =>
                    {
                      setScheduleFormat(format.value as "online" | "office");
                      setScheduleLocation(
                        format.value === "office" ? "moscow" : "online"
                      );
                    }
                  }
                  className={
                    scheduleFormat === format.value
                      ? "rounded-xl bg-[#332725] px-4 py-2 text-white"
                      : "rounded-xl border border-[#332725] px-4 py-2 text-[#332725]"
                  }
                >
                  {format.label}
                </button>
              ))}
            </div>
            {scheduleFormat === "office" && (
              <div className="mt-4 flex flex-wrap gap-3">
                {officeLocations.map((location) => (
                  <button
                    key={location.value}
                    onClick={() =>
                      setScheduleLocation(
                        location.value as "moscow" | "vidnoye"
                      )
                    }
                    className={
                      scheduleLocation === location.value
                        ? "rounded-xl bg-[#c98778] px-4 py-2 text-white"
                        : "rounded-xl border border-[#c98778] px-4 py-2 text-[#8a5f55]"
                    }
                  >
                    {location.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-[1fr_180px_auto]">
            <input
              type="date"
              min={today}
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
              className="rounded-2xl border border-[#ead7d1] px-4 py-3"
            />

            <input
              type="time"
              value={newSlotTime}
              onChange={(event) => setNewSlotTime(event.target.value)}
              className="rounded-2xl border border-[#ead7d1] px-4 py-3"
            />

            <button
              onClick={addSlot}
              className="rounded-2xl bg-[#332725] px-6 py-3 text-white"
            >
              Добавить окно
            </button>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {slots.length > 0 ? (
              slots.map((slot) => (
                <button
                  key={slot.id}
                  onClick={() => deleteSlot(slot.id)}
                  className="rounded-xl border border-[#c98778] px-4 py-2 text-[#332725]"
                >
                  {slot.time} · {locationLabels[slot.consultationLocation]} · удалить
                </button>
              ))
            ) : (
              <p className="text-[#8a7a76]">
                На выбранную дату свободные окна пока не добавлены.
              </p>
            )}
          </div>
        </div>

        {view === "calendar" && (
          <div className="mt-8 grid gap-6 lg:grid-cols-[360px_1fr]">
            <div className="rounded-[2rem] border border-[#ead7d1] bg-white p-6 shadow-sm">
              <h3 className="text-xl font-medium text-[#332725]">
                {new Date(`${selectedDate}T00:00:00`).toLocaleDateString("ru-RU", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </h3>

              <div className="mt-5 grid gap-3">
                {slots.map((slot) => {
                  const appointment = selectedDateAppointments.find(
                    (item) =>
                      item.scheduledAt &&
                      toDateTimeInputValue(item.scheduledAt).endsWith(slot.time)
                  );

                  return (
                    <div
                      key={slot.id}
                      className="rounded-2xl bg-[#fff8f6] p-4 text-sm"
                    >
                      <div className="font-medium text-[#332725]">{slot.time}</div>
                      <div className="mt-1 text-[#5f5552]">
                        {appointment
                          ? `${appointment.name} · ${
                              locationLabels[appointment.consultationLocation]
                            }`
                          : `${formatLabels[scheduleFormat]} · свободно`}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <AppointmentList
              appointments={selectedDateAppointments}
              emptyText="На выбранную дату консультаций пока нет."
              onUpdate={updateAppointment}
              onDelete={deleteAppointment}
              onCreatePayment={createPayment}
              onCreateRefund={createRefund}
              onCancelPaymentAuthorization={cancelPaymentAuthorization}
              onSendClientMessage={sendClientMessage}
            />
          </div>
        )}

        {view === "list" && (
          <div className="mt-8">
            <StatusFilters
              value={statusFilter}
              counts={statusCounts}
              onChange={setStatusFilter}
            />

            <div className="mt-6">
              <AppointmentList
                appointments={filteredAppointments}
                emptyText="Заявок пока нет."
                onUpdate={updateAppointment}
                onDelete={deleteAppointment}
                onCreatePayment={createPayment}
                onCreateRefund={createRefund}
                onCancelPaymentAuthorization={cancelPaymentAuthorization}
                onSendClientMessage={sendClientMessage}
              />
            </div>
          </div>
        )}

        {view === "journal" && (
          <ConsultationJournal appointments={appointments} />
        )}
      </div>
    </section>
  );
}

function StatusFilters({
  value,
  counts,
  onChange,
}: {
  value: AppointmentStatus | "all";
  counts: Record<AppointmentStatus | "all", number>;
  onChange: (value: AppointmentStatus | "all") => void;
}) {
  const items: Array<{ value: AppointmentStatus | "all"; label: string }> = [
    { value: "all", label: "Все" },
    { value: "new", label: "Новые" },
    { value: "scheduled", label: "Запланированы" },
    { value: "completed", label: "Проведены" },
    { value: "cancelled", label: "Отменены" },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <button
          key={item.value}
          onClick={() => onChange(item.value)}
          className={
            value === item.value
              ? "rounded-full bg-[#332725] px-4 py-2 text-sm text-white"
              : "rounded-full border border-[#ead7d1] bg-white px-4 py-2 text-sm text-[#5f5552]"
          }
        >
          {item.label} · {counts[item.value]}
        </button>
      ))}
    </div>
  );
}

function AppointmentList({
  appointments,
  emptyText,
  onUpdate,
  onDelete,
  onCreatePayment,
  onCreateRefund,
  onCancelPaymentAuthorization,
  onSendClientMessage,
}: {
  appointments: Appointment[];
  emptyText: string;
  onUpdate: (appointment: Appointment, patch: Partial<Appointment>) => void;
  onDelete: (id: string) => void;
  onCreatePayment: (appointment: Appointment) => void;
  onCreateRefund: (appointment: Appointment, type: "full" | "partial") => void;
  onCancelPaymentAuthorization: (appointment: Appointment) => void;
  onSendClientMessage: (
    appointment: Appointment,
    message: string
  ) => Promise<boolean>;
}) {
  if (appointments.length === 0) {
    return (
      <div className="rounded-[2rem] border border-[#ead7d1] bg-white p-8 shadow-sm">
        <p className="text-[#5f5552]">{emptyText}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      {appointments.map((appointment) => (
        <article
          key={appointment.id}
          className="rounded-[2rem] border border-[#ead7d1] bg-white p-6 shadow-sm"
        >
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <span className="rounded-full bg-[#fff3df] px-3 py-1 text-sm text-[#9a5a1f]">
                {statusLabels[appointment.status]}
              </span>

              <h2 className="mt-4 text-2xl font-medium text-[#332725]">
                {appointment.name}
              </h2>

              <p className="mt-2 text-[#5f5552]">
                {methodLabels[appointment.contactMethod] ??
                  appointment.contactMethod}
                : {appointment.contact}
              </p>

              <p className="mt-2 text-[#5f5552]">
                Формат: {formatLabels[appointment.consultationFormat]}
                {appointment.consultationFormat === "office"
                  ? ` · ${locationLabels[appointment.consultationLocation]}`
                  : ""}
              </p>

              <p className="mt-2 text-[#8a7a76]">
                Запись: {formatDateTime(appointment.scheduledAt)}
              </p>

              <div className="mt-4 grid gap-2 text-sm text-[#5f5552]">
                <p>
                  Оплата: {paymentMethodLabels[appointment.paymentMethod]} ·{" "}
                  {paymentStatusLabels[appointment.paymentStatus]}
                </p>
                {appointment.paymentAmount && (
                  <p>Сумма: {appointment.paymentAmount} руб.</p>
                )}
                <p>
                  Уведомление:{" "}
                  {notificationStatusLabels[appointment.notificationStatus]}
                </p>
                {appointment.paymentLink && (
                  <a
                    href={appointment.paymentLink}
                    target="_blank"
                    className="text-[#c98778]"
                  >
                    Открыть ссылку оплаты
                  </a>
                )}
              </div>

              <p className="mt-4 whitespace-pre-line leading-7 text-[#332725]">
                {appointment.message}
              </p>
            </div>

            <div className="grid gap-3 lg:w-80">
              <input
                type="datetime-local"
                value={toDateTimeInputValue(appointment.scheduledAt)}
                onChange={(event) =>
                  onUpdate(appointment, {
                    scheduledAt: event.target.value,
                    status: "scheduled",
                  })
                }
                className="rounded-xl border border-[#ead7d1] px-4 py-2"
                aria-label="Перенос записи"
              />
              <div className="-mt-2 text-xs uppercase tracking-[0.16em] text-[#8a7a76]">
                Перенос записи
              </div>

              <select
                value={appointment.status}
                onChange={(event) =>
                  onUpdate(appointment, {
                    status: event.target.value as AppointmentStatus,
                  })
                }
                className="rounded-xl border border-[#ead7d1] px-4 py-2"
              >
                <option value="new">Новая</option>
                <option value="scheduled">Запланирована</option>
                <option value="completed">Проведена</option>
                <option value="cancelled">Отменена</option>
              </select>

              {appointment.consultationFormat === "office" && (
                <select
                  value={appointment.consultationLocation}
                  onChange={(event) =>
                    onUpdate(appointment, {
                      consultationLocation: event.target
                        .value as Appointment["consultationLocation"],
                    })
                  }
                  className="rounded-xl border border-[#ead7d1] px-4 py-2"
                >
                  <option value="moscow">Москва</option>
                  <option value="vidnoye">Видное</option>
                </select>
              )}

              <select
                value={appointment.paymentStatus}
                onChange={(event) =>
                  onUpdate(appointment, {
                    paymentStatus: event.target.value as Appointment["paymentStatus"],
                  })
                }
                className="rounded-xl border border-[#ead7d1] px-4 py-2"
              >
                <option value="waiting">Ожидает оплаты</option>
                <option value="invoice_sent">Ссылка отправлена</option>
                <option value="waiting_for_capture">Ожидает подтверждения</option>
                <option value="paid">Оплачено</option>
                <option value="partially_refunded">Частичный возврат</option>
                <option value="refund_pending">Возврат в обработке</option>
                <option value="refund_failed">Ошибка возврата</option>
                <option value="manual_review">Требует проверки</option>
                <option value="cancelled">Отменено</option>
                <option value="refunded">Возврат</option>
                <option value="not_required">Без онлайн-оплаты</option>
              </select>

              <input
                defaultValue={appointment.paymentLink ?? ""}
                onBlur={(event) =>
                  onUpdate(appointment, { paymentLink: event.target.value })
                }
                className="rounded-xl border border-[#ead7d1] px-4 py-2"
                placeholder="Ссылка на оплату"
              />

              <select
                value={appointment.notificationStatus}
                onChange={(event) =>
                  onUpdate(appointment, {
                    notificationStatus:
                      event.target.value as Appointment["notificationStatus"],
                  })
                }
                className="rounded-xl border border-[#ead7d1] px-4 py-2"
              >
                <option value="not_sent">Уведомление не отправлено</option>
                <option value="sent">Уведомление отправлено</option>
                <option value="failed">Ошибка уведомления</option>
              </select>

              <textarea
                defaultValue={appointment.notes ?? ""}
                onBlur={(event) =>
                  onUpdate(appointment, { notes: event.target.value })
                }
                rows={3}
                className="rounded-xl border border-[#ead7d1] px-4 py-2"
                placeholder="Заметки Александры"
              />

              <textarea
                defaultValue={appointment.paymentNote ?? ""}
                onBlur={(event) =>
                  onUpdate(appointment, { paymentNote: event.target.value })
                }
                rows={2}
                className="rounded-xl border border-[#ead7d1] px-4 py-2"
                placeholder="Заметка по оплате"
              />

              <ClientMessageComposer
                appointment={appointment}
                onSend={onSendClientMessage}
              />

              <button
                onClick={() => onCreatePayment(appointment)}
                className="rounded-xl border border-[#c98778] px-4 py-2 text-[#c98778]"
              >
                Создать ссылку ЮKassa
              </button>

              {appointment.paymentSummary && (
                <div className="rounded-xl border border-[#ead7d1] bg-[#fff8f6] p-3 text-sm text-[#5f5552]">
                  <p className="font-medium text-[#332725]">Финансы ЮKassa</p>
                  <p>Оплачено: {formatRubFromKopeks(appointment.paymentSummary.paidAmountKopeks)}</p>
                  <p>Возвращено: {formatRubFromKopeks(appointment.paymentSummary.refundedAmountKopeks)}</p>
                  <p>Доступно: {formatRubFromKopeks(appointment.paymentSummary.refundableAmountKopeks)}</p>
                  <p>Статус: {paymentStatusLabels[appointment.paymentSummary.status] ?? appointment.paymentSummary.status}</p>
                  {appointment.paymentSummary.providerPaymentId && (
                    <p>ID платежа: {appointment.paymentSummary.providerPaymentId}</p>
                  )}
                  {appointment.paymentSummary.latestRefund && (
                    <p>
                      Последний возврат:{" "}
                      {formatRubFromKopeks(
                        appointment.paymentSummary.latestRefund.amountKopeks
                      )} · {appointment.paymentSummary.latestRefund.status}
                    </p>
                  )}
                  <div className="mt-3 grid gap-2">
                    {["paid", "partially_refunded"].includes(
                      appointment.paymentSummary.status
                    ) &&
                      appointment.paymentSummary.refundableAmountKopeks > 0 && (
                        <>
                          <button
                            onClick={() => onCreateRefund(appointment, "full")}
                            className="rounded-lg bg-[#332725] px-3 py-2 text-white"
                          >
                            Вернуть всю сумму
                          </button>
                          <button
                            onClick={() => onCreateRefund(appointment, "partial")}
                            className="rounded-lg border border-[#c98778] px-3 py-2 text-[#c98778]"
                          >
                            Вернуть часть суммы
                          </button>
                        </>
                      )}
                    {appointment.paymentSummary.status === "waiting_for_capture" && (
                      <button
                        onClick={() => onCancelPaymentAuthorization(appointment)}
                        className="rounded-lg border border-[#b94a48] px-3 py-2 text-[#b94a48]"
                      >
                        Отменить авторизацию
                      </button>
                    )}
                  </div>
                </div>
              )}

              <button
                onClick={() =>
                  onUpdate(appointment, { status: "cancelled" })
                }
                className="rounded-xl border border-[#b94a48] px-4 py-2 text-[#b94a48]"
              >
                Отменить запись
              </button>

              <button
                onClick={() => onDelete(appointment.id)}
                className="rounded-xl bg-[#332725] px-4 py-2 text-white"
              >
                Удалить
              </button>
            </div>
          </div>

          {appointment.history.length > 0 && (
            <div className="mt-6 border-t border-[#ead7d1] pt-5">
              <h3 className="text-sm uppercase tracking-[0.18em] text-[#8a7a76]">
                История
              </h3>
              <div className="mt-3 grid gap-2">
                {appointment.history.map((entry) => (
                  <p key={entry.id} className="text-sm text-[#5f5552]">
                    {formatDateTime(entry.createdAt)} · {entry.action}
                    {entry.details ? ` · ${entry.details}` : ""}
                  </p>
                ))}
              </div>
            </div>
          )}
        </article>
      ))}
    </div>
  );
}

function ClientMessageComposer({
  appointment,
  onSend,
}: {
  appointment: Appointment;
  onSend: (appointment: Appointment, message: string) => Promise<boolean>;
}) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit() {
    const text = message.trim();
    if (!text || sending) return;

    setSending(true);
    setSent(false);
    const success = await onSend(appointment, text);
    setSending(false);

    if (success) {
      setMessage("");
      setSent(true);
    }
  }

  return (
    <div className="rounded-xl border border-[#ead7d1] bg-[#fff8f6] p-3">
      <textarea
        value={message}
        onChange={(event) => {
          setMessage(event.target.value);
          setSent(false);
        }}
        rows={3}
        className="w-full rounded-lg border border-[#ead7d1] bg-white px-3 py-2"
        placeholder="Сообщение клиенту в личный кабинет"
      />
      <button
        type="button"
        onClick={submit}
        disabled={!message.trim() || sending}
        className="mt-2 w-full rounded-lg bg-[#c98778] px-4 py-2 text-white disabled:opacity-50"
      >
        {sending ? "Отправляю..." : sent ? "Сообщение отправлено" : "Отправить клиенту"}
      </button>
    </div>
  );
}

function ConsultationJournal({
  appointments,
}: {
  appointments: Appointment[];
}) {
  const people = useMemo(() => {
    const grouped = new Map<string, Appointment[]>();

    appointments.forEach((appointment) => {
      const key = `${appointment.contact.toLowerCase()}-${appointment.name.toLowerCase()}`;
      grouped.set(key, [...(grouped.get(key) ?? []), appointment]);
    });

    return Array.from(grouped.values())
      .map((items) => {
        const sorted = [...items].sort(
          (first, second) =>
            new Date(second.createdAt).getTime() -
            new Date(first.createdAt).getTime()
        );
        const meetings = sorted
          .filter((appointment) => appointment.scheduledAt)
          .sort(
            (first, second) =>
              new Date(first.scheduledAt ?? "").getTime() -
              new Date(second.scheduledAt ?? "").getTime()
          );

        return {
          key: sorted[0].id,
          name: sorted[0].name,
          contact: sorted[0].contact,
          contactMethod: sorted[0].contactMethod,
          requests: sorted,
          meetings,
          lastRequest: sorted[0],
          notes: sorted.filter((appointment) => appointment.notes),
        };
      })
      .sort(
        (first, second) =>
          new Date(second.lastRequest.createdAt).getTime() -
          new Date(first.lastRequest.createdAt).getTime()
      );
  }, [appointments]);

  return (
    <section className="mt-8 rounded-[2rem] border border-[#ead7d1] bg-white p-8 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="font-serif text-4xl text-[#332725]">
            Журнал консультаций
          </h2>
          <p className="mt-3 max-w-3xl text-[#5f5552]">
            Закрытый раздел для истории обращений, дат встреч и рабочих заметок
            Александры.
          </p>
        </div>

        <div className="rounded-2xl bg-[#fff8f6] px-5 py-3 text-sm uppercase tracking-[0.18em] text-[#c98778]">
          Людей: {people.length}
        </div>
      </div>

      <div className="mt-8 grid gap-5">
        {people.length > 0 ? (
          people.map((person) => (
            <article
              key={person.key}
              className="rounded-[1.5rem] border border-[#ead7d1] bg-[#fff8f6] p-6"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h3 className="text-2xl font-medium text-[#332725]">
                    {person.name}
                  </h3>
                  <p className="mt-2 text-[#5f5552]">
                    {methodLabels[person.contactMethod] ??
                      person.contactMethod}
                    : {person.contact}
                  </p>
                  <p className="mt-2 text-sm text-[#8a7a76]">
                    Обращений: {person.requests.length} · Встреч:{" "}
                    {person.meetings.length}
                  </p>
                </div>

                <div className="rounded-2xl bg-white px-4 py-3 text-sm text-[#5f5552]">
                  Последнее обращение: {formatDateTime(person.lastRequest.createdAt)}
                </div>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-3">
                <div className="rounded-2xl bg-white p-4">
                  <h4 className="text-sm uppercase tracking-[0.16em] text-[#8a7a76]">
                    Даты встреч
                  </h4>
                  <div className="mt-3 grid gap-2 text-sm text-[#5f5552]">
                    {person.meetings.length > 0 ? (
                      person.meetings.map((appointment) => (
                        <p key={appointment.id}>
                          {formatDateTime(appointment.scheduledAt)} ·{" "}
                          {statusLabels[appointment.status]}
                        </p>
                      ))
                    ) : (
                      <p>Встречи пока не назначены.</p>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl bg-white p-4">
                  <h4 className="text-sm uppercase tracking-[0.16em] text-[#8a7a76]">
                    История обращений
                  </h4>
                  <div className="mt-3 grid gap-2 text-sm text-[#5f5552]">
                    {person.requests.map((appointment) => (
                      <p key={appointment.id}>
                        {formatDateTime(appointment.createdAt)} ·{" "}
                        {formatLabels[appointment.consultationFormat]} ·{" "}
                        {statusLabels[appointment.status]}
                      </p>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl bg-white p-4">
                  <h4 className="text-sm uppercase tracking-[0.16em] text-[#8a7a76]">
                    Заметки Александры
                  </h4>
                  <div className="mt-3 grid gap-2 whitespace-pre-line text-sm text-[#5f5552]">
                    {person.notes.length > 0 ? (
                      person.notes.map((appointment) => (
                        <p key={appointment.id}>
                          {formatDateTime(appointment.updatedAt)} ·{" "}
                          {appointment.notes}
                        </p>
                      ))
                    ) : (
                      <p>Заметок пока нет.</p>
                    )}
                  </div>
                </div>
              </div>

              <details className="mt-4 rounded-2xl bg-white p-4">
                <summary className="cursor-pointer text-[#332725]">
                  Подробная история
                </summary>
                <div className="mt-4 grid gap-4">
                  {person.requests.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="border-t border-[#ead7d1] pt-4 first:border-t-0 first:pt-0"
                    >
                      <p className="font-medium text-[#332725]">
                        {formatDateTime(appointment.createdAt)} ·{" "}
                        {statusLabels[appointment.status]}
                      </p>
                      <p className="mt-2 whitespace-pre-line text-sm leading-6 text-[#5f5552]">
                        {appointment.message}
                      </p>
                      {appointment.history.length > 0 && (
                        <div className="mt-3 grid gap-1 text-sm text-[#8a7a76]">
                          {appointment.history.map((entry) => (
                            <p key={entry.id}>
                              {formatDateTime(entry.createdAt)} · {entry.action}
                              {entry.details ? ` · ${entry.details}` : ""}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </details>
            </article>
          ))
        ) : (
          <p className="text-[#5f5552]">В журнале пока нет обращений.</p>
        )}
      </div>
    </section>
  );
}
