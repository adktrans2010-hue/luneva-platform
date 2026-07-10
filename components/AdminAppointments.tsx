"use client";

import { useEffect, useMemo, useState } from "react";

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
  preferredTime: string | null;
  message: string;
  scheduledAt: string | null;
  notes: string | null;
  status: AppointmentStatus;
  paymentMethod: "online" | "after_confirmation";
  paymentStatus:
    | "waiting"
    | "invoice_sent"
    | "paid"
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
};

type AvailabilitySlot = {
  id: string;
  date: string;
  time: string;
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

const paymentMethodLabels: Record<string, string> = {
  online: "ЮKassa",
  after_confirmation: "После подтверждения",
};

const paymentStatusLabels: Record<string, string> = {
  waiting: "Ожидает оплаты",
  invoice_sent: "Ссылка отправлена",
  paid: "Оплачено",
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

export default function AdminAppointments() {
  const today = useMemo(() => toDateInputValue(new Date()), []);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [selectedDate, setSelectedDate] = useState(today);
  const [newSlotTime, setNewSlotTime] = useState("10:00");
  const [view, setView] = useState<"calendar" | "list">("calendar");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadAppointments() {
    const [appointmentsResponse, slotsResponse] = await Promise.all([
      fetch("/api/admin/appointments"),
      fetch(`/api/admin/availability?date=${selectedDate}`),
    ]);

    const appointmentsData = (await appointmentsResponse.json()) as Appointment[];
    const slotsData = (await slotsResponse.json()) as AvailabilitySlot[];

    setAppointments(appointmentsData);
    setSlots(slotsData);
    setLoading(false);
  }

  async function addSlot() {
    setError(null);

    const response = await fetch("/api/admin/availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: selectedDate, time: newSlotTime }),
    });

    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      setError(data.error ?? "Не удалось добавить свободное время.");
      return;
    }

    await loadAppointments();
  }

  async function deleteSlot(id: string) {
    await fetch(`/api/admin/availability/${id}`, { method: "DELETE" });
    await loadAppointments();
  }

  async function updateAppointment(
    appointment: Appointment,
    patch: Partial<Appointment>
  ) {
    setError(null);

    const nextAppointment = { ...appointment, ...patch };
    const response = await fetch(`/api/admin/appointments/${appointment.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: nextAppointment.status,
        scheduledAt: nextAppointment.scheduledAt,
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

    await fetch(`/api/admin/appointments/${id}`, { method: "DELETE" });
    await loadAppointments();
  }

  async function createPayment(appointment: Appointment) {
    setError(null);

    const response = await fetch(
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

  useEffect(() => {
    const controller = new AbortController();

    void Promise.all([
      fetch("/api/admin/appointments", { signal: controller.signal }),
      fetch(`/api/admin/availability?date=${selectedDate}`, {
        signal: controller.signal,
      }),
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
  }, [selectedDate]);

  const selectedDateAppointments = appointments.filter((appointment) => {
    if (!appointment.scheduledAt) return false;

    return toDateInputValue(new Date(appointment.scheduledAt)) === selectedDate;
  });

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
                Добавьте свободные окна. На сайте клиент увидит только эти
                даты и время, кроме уже занятых консультаций.
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
            </div>
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
                  {slot.time} · удалить
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
                        {appointment ? appointment.name : "Свободно"}
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
            />
          </div>
        )}

        {view === "list" && (
          <AppointmentList
            appointments={appointments}
            emptyText="Заявок пока нет."
            onUpdate={updateAppointment}
            onDelete={deleteAppointment}
            onCreatePayment={createPayment}
          />
        )}
      </div>
    </section>
  );
}

function AppointmentList({
  appointments,
  emptyText,
  onUpdate,
  onDelete,
  onCreatePayment,
}: {
  appointments: Appointment[];
  emptyText: string;
  onUpdate: (appointment: Appointment, patch: Partial<Appointment>) => void;
  onDelete: (id: string) => void;
  onCreatePayment: (appointment: Appointment) => void;
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
              />

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
                <option value="paid">Оплачено</option>
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
                placeholder="Заметка администратора"
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

              <button
                onClick={() => onCreatePayment(appointment)}
                className="rounded-xl border border-[#c98778] px-4 py-2 text-[#c98778]"
              >
                Создать ссылку ЮKassa
              </button>

              <button
                onClick={() =>
                  onUpdate(appointment, { status: "cancelled" })
                }
                className="rounded-xl border border-[#b94a48] px-4 py-2 text-[#b94a48]"
              >
                Отменить
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
