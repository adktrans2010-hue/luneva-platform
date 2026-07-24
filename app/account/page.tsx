import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { asc, desc, eq } from "drizzle-orm";

import { db } from "@/src/db";
import {
  appointmentRequests,
  clientNotifications,
  userConsultationPackages,
} from "@/src/db/schema";
import { getCurrentUser } from "@/src/lib/auth-user";
import AccountBookingForm from "@/components/AccountBookingForm";
import AccountNotifications from "@/components/AccountNotifications";
import LegalConsent from "@/components/legal/legal-consent";
import {
  getConsultationAddress,
  getConsultationPlaceLabel,
} from "@/src/lib/consultation-locations";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

type AccountPageProps = {
  searchParams: Promise<{
    profile?: string;
    password?: string;
  }>;
};

const statusLabels: Record<string, string> = {
  new: "Новая",
  scheduled: "Запланирована",
  completed: "Проведена",
  cancelled: "Отменена",
};

const formatLabels: Record<string, string> = {
  online: "Онлайн",
  office: "Очно в кабинете",
};

const paymentStatusLabels: Record<string, string> = {
  waiting: "Ожидает оплаты",
  invoice_sent: "Ссылка отправлена",
  paid: "Оплачено",
  cancelled: "Отменено",
  refunded: "Возврат",
  not_required: "Без онлайн-оплаты",
};

const contactMethodLabels: Record<string, string> = {
  telegram: "Telegram",
  phone: "Телефон",
  email: "Email",
  whatsapp: "WhatsApp",
};

const menuItems = [
  { label: "Сегодня", href: "#today" },
  { label: "Записаться", href: "#booking" },
  { label: "Мои записи", href: "#appointments" },
  { label: "Пакеты", href: "#packages" },
  { label: "Оплата", href: "#payments" },
  { label: "Материалы", href: "#materials" },
  { label: "Сообщения", href: "#messages" },
  { label: "Профиль", href: "#profile" },
];

function formatDateTime(value: Date | null) {
  if (!value) return "Дата уточняется";

  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

function formatShortDate(value: Date | null) {
  if (!value) return "Дата уточняется";

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

function formatGoogleDate(value: Date) {
  return value.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function buildCalendarLink(appointment: {
  scheduledAt: Date | null;
  consultationFormat: string;
  consultationLocation: string;
}) {
  if (!appointment.scheduledAt) return "/contacts#booking";

  const start = appointment.scheduledAt;
  const end = new Date(start.getTime() + 50 * 60 * 1000);
  const location = getConsultationAddress(appointment.consultationLocation);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: "Консультация с Александрой Луневой",
    dates: `${formatGoogleDate(start)}/${formatGoogleDate(end)}`,
    details: "Психологическая консультация. Детали встречи будут направлены отдельно.",
    location,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className="rounded-[2rem] border border-[#ead7d1] bg-white p-8 shadow-sm"
    >
      <h2 className="font-serif text-4xl text-[#332725]">{title}</h2>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function AppointmentCard({
  appointment,
}: {
  appointment: typeof appointmentRequests.$inferSelect;
}) {
  return (
    <article className="rounded-2xl border border-[#ead7d1] bg-[#fff8f6] p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-[#c98778]">
            {statusLabels[appointment.status] ?? appointment.status}
          </p>
          <h3 className="mt-3 text-2xl font-medium text-[#332725]">
            {formatShortDate(appointment.scheduledAt)}
          </h3>
          <p className="mt-2 text-[#5f5552]">
            {formatLabels[appointment.consultationFormat] ??
              appointment.consultationFormat}
            {appointment.consultationFormat === "office"
              ? ` · ${getConsultationPlaceLabel(
                  appointment.consultationFormat,
                  appointment.consultationLocation
                )}`
              : ""}
          </p>
        </div>

        <div className="text-sm text-[#5f5552] md:text-right">
          <p>
            Оплата:{" "}
            {paymentStatusLabels[appointment.paymentStatus] ??
              appointment.paymentStatus}
          </p>
          {appointment.paymentLink && (
            <a href={appointment.paymentLink} className="mt-2 inline-flex text-[#c98778]">
              Перейти к оплате
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

export default async function AccountPage({ searchParams }: AccountPageProps) {
  const params = await searchParams;
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const appointments = await db
    .select()
    .from(appointmentRequests)
    .where(eq(appointmentRequests.userId, user.id))
    .orderBy(desc(appointmentRequests.createdAt));

  const futureAppointments = await db
    .select()
    .from(appointmentRequests)
    .where(eq(appointmentRequests.userId, user.id))
    .orderBy(asc(appointmentRequests.scheduledAt));

  const now = new Date();
  const upcoming = futureAppointments.filter(
    (appointment) =>
      appointment.status !== "cancelled" &&
      appointment.status !== "completed" &&
      appointment.scheduledAt &&
      appointment.scheduledAt >= now
  );
  const nearest = upcoming[0] ?? null;
  const past = appointments.filter(
    (appointment) =>
      appointment.status === "completed" ||
      (appointment.scheduledAt && appointment.scheduledAt < now)
  );
  const cancelled = appointments.filter(
    (appointment) => appointment.status === "cancelled"
  );
  const payments = appointments.filter(
    (appointment) => appointment.paymentStatus !== "not_required"
  );
  const packages = await db
    .select()
    .from(userConsultationPackages)
    .where(eq(userConsultationPackages.userId, user.id))
    .orderBy(desc(userConsultationPackages.createdAt));
  const notifications = await db
    .select()
    .from(clientNotifications)
    .where(eq(clientNotifications.userId, user.id))
    .orderBy(desc(clientNotifications.createdAt));
  const unreadNotifications = notifications.filter(
    (notification) => !notification.readAt
  ).length;
  const activePackages = packages
    .filter((item) => item.status === "active" && item.remainingSessions > 0)
    .map((item) => ({
      id: item.id,
      title: item.title,
      consultationFormat: "online" as const,
      totalSessions: item.totalSessions,
      remainingSessions: item.remainingSessions,
    }));

  return (
    <section className="bg-[#fff8f6] px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="mb-4 text-sm uppercase tracking-[0.25em] text-[#c98778]">
              Мой кабинет
            </p>

            <h1 className="font-serif text-6xl leading-tight text-[#332725]">
              Здравствуйте, {user.name}
            </h1>

            <p className="mt-6 max-w-3xl text-lg leading-8 text-[#5f5552]">
              Здесь можно посмотреть ваши записи, оплату и материалы от
              Александры.
            </p>
          </div>

          <form action="/api/auth/logout" method="post">
            <button
              type="submit"
              className="rounded-2xl border border-[#c98778] px-5 py-3 text-[#c98778] transition hover:bg-white"
            >
              Выйти
            </button>
          </form>
        </div>

        <nav className="mt-10 flex flex-wrap gap-3">
          {menuItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-full border border-[#ead7d1] bg-white px-5 py-3 text-sm text-[#5f5552] transition hover:border-[#c98778] hover:text-[#332725]"
            >
              {item.label}
              {item.href === "#messages" && unreadNotifications > 0
                ? ` · ${unreadNotifications}`
                : ""}
            </a>
          ))}
          <form action="/api/auth/logout" method="post">
            <button className="rounded-full border border-[#ead7d1] bg-white px-5 py-3 text-sm text-[#5f5552] transition hover:border-[#c98778] hover:text-[#332725]">
              Выйти
            </button>
          </form>
        </nav>

        <div className="mt-12 grid gap-8">
          <Section id="today" title="Ближайшая консультация">
            {nearest ? (
              <div className="rounded-[2rem] bg-[#332725] p-8 text-white md:p-10">
                <p className="text-sm uppercase tracking-[0.2em] text-[#ead7d1]">
                  {statusLabels[nearest.status] ?? nearest.status}
                </p>
                <h3 className="mt-4 font-serif text-4xl">
                  {formatDateTime(nearest.scheduledAt)}
                </h3>
                <p className="mt-4 text-lg text-[#ead7d1]">
                  {formatLabels[nearest.consultationFormat]}
                  {nearest.consultationFormat === "office"
                    ? ` · ${getConsultationPlaceLabel(
                        nearest.consultationFormat,
                        nearest.consultationLocation
                      )}`
                    : ""}{" "}
                  · 50 минут
                </p>
                <p className="mt-2 text-[#ead7d1]">
                  {nearest.consultationFormat === "office"
                    ? getConsultationAddress(nearest.consultationLocation)
                    : "Ссылка на онлайн-встречу будет направлена отдельно."}
                </p>
                <p className="mt-4 text-lg">
                  {paymentStatusLabels[nearest.paymentStatus] ??
                    nearest.paymentStatus}
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  {nearest.consultationFormat === "online" && (
                    <Link
                      href="/contacts"
                      className="rounded-2xl bg-white px-6 py-3 text-[#332725]"
                    >
                      Подключиться
                    </Link>
                  )}
                  <Link
                    href="/contacts#booking"
                    className="rounded-2xl border border-white px-6 py-3 text-white"
                  >
                    Перенести
                  </Link>
                  <Link
                    href="/contacts"
                    className="rounded-2xl border border-white/60 px-6 py-3 text-white"
                  >
                    Отменить
                  </Link>
                  <a
                    href={buildCalendarLink(nearest)}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-2xl border border-white/60 px-6 py-3 text-white"
                  >
                    Добавить в календарь
                  </a>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl bg-[#fff8f6] p-6 text-[#5f5552]">
                Ближайшая консультация пока не запланирована.
                <Link href="/contacts#booking" className="ml-2 text-[#c98778]">
                  Выбрать время
                </Link>
              </div>
            )}
          </Section>

          <Section id="booking" title="Записаться на консультацию">
            <p className="mb-6 leading-7 text-[#5f5552]">
              Выберите формат, дату и свободное время. Если у вас есть
              оплаченный пакет, можно списать из него одну консультацию.
            </p>
            <AccountBookingForm packages={activePackages} />
          </Section>

          <Section id="packages" title="Пакеты консультаций">
            <div className="grid gap-4 md:grid-cols-2">
              {packages.length > 0 ? (
                packages.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-2xl border border-[#ead7d1] bg-[#fff8f6] p-5"
                  >
                    <p className="text-sm uppercase tracking-[0.18em] text-[#c98778]">
                      {formatLabels[item.consultationFormat] ??
                        item.consultationFormat}
                    </p>
                    <h3 className="mt-3 text-2xl font-medium text-[#332725]">
                      {item.title}
                    </h3>
                    <p className="mt-3 text-lg text-[#332725]">
                      Осталось {item.remainingSessions} из {item.totalSessions}
                    </p>
                    <p className="mt-2 text-[#5f5552]">
                      {item.status === "active"
                        ? "Активен"
                        : item.status === "used"
                          ? "Использован"
                          : item.status}
                    </p>
                  </article>
                ))
              ) : (
                <p className="rounded-2xl bg-[#fff8f6] p-5 text-[#5f5552]">
                  Активных пакетов пока нет. После оплаты пакета он появится
                  здесь.
                </p>
              )}
            </div>
          </Section>

          <Section id="appointments" title="Мои записи">
            <div className="grid gap-8 lg:grid-cols-3">
              <div>
                <h3 className="text-xl font-medium text-[#332725]">
                  Будущие консультации
                </h3>
                <div className="mt-4 grid gap-4">
                  {upcoming.length > 0 ? (
                    upcoming.map((appointment) => (
                      <AppointmentCard
                        key={appointment.id}
                        appointment={appointment}
                      />
                    ))
                  ) : (
                    <p className="rounded-2xl bg-[#fff8f6] p-5 text-[#5f5552]">
                      Будущих записей пока нет.
                    </p>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-xl font-medium text-[#332725]">
                  Прошедшие консультации
                </h3>
                <div className="mt-4 grid gap-4">
                  {past.length > 0 ? (
                    past.map((appointment) => (
                      <AppointmentCard
                        key={appointment.id}
                        appointment={appointment}
                      />
                    ))
                  ) : (
                    <p className="rounded-2xl bg-[#fff8f6] p-5 text-[#5f5552]">
                      Прошедших консультаций пока нет.
                    </p>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-xl font-medium text-[#332725]">
                  Отмененные записи
                </h3>
                <div className="mt-4 grid gap-4">
                  {cancelled.length > 0 ? (
                    cancelled.map((appointment) => (
                      <AppointmentCard
                        key={appointment.id}
                        appointment={appointment}
                      />
                    ))
                  ) : (
                    <p className="rounded-2xl bg-[#fff8f6] p-5 text-[#5f5552]">
                      Отмененных записей пока нет.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </Section>

          <Section id="payments" title="Оплата">
            <p className="mb-6 leading-7 text-[#5f5552]">
              Данные банковской карты на сайте не хранятся.
            </p>
            <div className="grid gap-4">
              {payments.length > 0 ? (
                payments.map((appointment) => (
                  <article
                    key={appointment.id}
                    className="flex flex-col gap-4 rounded-2xl bg-[#fff8f6] p-5 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <p className="font-medium text-[#332725]">
                        {formatShortDate(appointment.scheduledAt)}
                      </p>
                      <p className="mt-2 text-[#5f5552]">
                        {paymentStatusLabels[appointment.paymentStatus] ??
                          appointment.paymentStatus}
                        {appointment.paymentAmount
                          ? ` · ${appointment.paymentAmount} руб.`
                          : ""}
                      </p>
                    </div>
                    {appointment.paymentLink && (
                      <a
                        href={appointment.paymentLink}
                        className="rounded-2xl bg-[#332725] px-5 py-3 text-center text-white"
                      >
                        Повторить оплату
                      </a>
                    )}
                  </article>
                ))
              ) : (
                <p className="rounded-2xl bg-[#fff8f6] p-5 text-[#5f5552]">
                  Оплат в кабинете пока нет.
                </p>
              )}
            </div>
          </Section>

          <Section id="materials" title="Материалы от Александры">
            <div className="rounded-2xl bg-[#fff8f6] p-6 text-[#5f5552]">
              Здесь появятся статьи, видео, упражнения, памятки, PDF и
              организационная информация, которые Александра отправит лично вам.
            </div>
          </Section>

          <Section id="messages" title="Сообщения">
            <AccountNotifications
              notifications={notifications.map((notification) => ({
                ...notification,
                readAt: notification.readAt?.toISOString() ?? null,
                createdAt: notification.createdAt.toISOString(),
              }))}
            />
          </Section>

          <Section id="profile" title="Профиль">
            <div className="grid gap-8 lg:grid-cols-2">
              <form action="/api/auth/profile" method="post" className="grid gap-4">
                <input
                  name="name"
                  defaultValue={user.name}
                  className="rounded-2xl border border-[#ead7d1] px-4 py-3"
                  placeholder="Имя"
                  required
                />
                <input
                  name="phone"
                  defaultValue={user.phone ?? ""}
                  className="rounded-2xl border border-[#ead7d1] px-4 py-3"
                  placeholder="Телефон"
                />
                <input
                  name="telegram"
                  defaultValue={user.telegram ?? ""}
                  className="rounded-2xl border border-[#ead7d1] px-4 py-3"
                  placeholder="Telegram"
                />
                <input
                  name="timeZone"
                  defaultValue={user.timeZone}
                  className="rounded-2xl border border-[#ead7d1] px-4 py-3"
                  placeholder="Часовой пояс"
                />
                <select
                  name="preferredContact"
                  defaultValue={user.preferredContact}
                  className="rounded-2xl border border-[#ead7d1] bg-white px-4 py-3"
                >
                  {Object.entries(contactMethodLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>

                {params.profile === "updated" && (
                  <p className="rounded-2xl bg-[#edf7ed] px-4 py-3 text-sm text-[#5f8a5f]">
                    Профиль обновлен.
                  </p>
                )}

                {params.profile === "consent" && (
                  <p className="rounded-2xl bg-[#fff3df] px-4 py-3 text-sm text-[#9a5a1f]">
                    Подтвердите согласие с правовыми документами.
                  </p>
                )}

                <LegalConsent />

                <button className="rounded-2xl bg-[#332725] px-5 py-3 text-white">
                  Сохранить профиль
                </button>
              </form>

              <div className="grid gap-6">
                <form
                  action="/api/auth/password"
                  method="post"
                  className="grid gap-4 rounded-2xl bg-[#fff8f6] p-5"
                >
                  <h3 className="text-xl font-medium text-[#332725]">
                    Смена пароля
                  </h3>
                  <input
                    name="currentPassword"
                    type="password"
                    className="rounded-2xl border border-[#ead7d1] px-4 py-3"
                    placeholder="Текущий пароль"
                    required
                  />
                  <input
                    name="nextPassword"
                    type="password"
                    minLength={8}
                    className="rounded-2xl border border-[#ead7d1] px-4 py-3"
                    placeholder="Новый пароль от 8 символов"
                    required
                  />
                  {params.password === "updated" && (
                    <p className="rounded-2xl bg-[#edf7ed] px-4 py-3 text-sm text-[#5f8a5f]">
                      Пароль обновлен.
                    </p>
                  )}
                  {params.password === "error" && (
                    <p className="rounded-2xl bg-[#fff3df] px-4 py-3 text-sm text-[#9a5a1f]">
                      Проверьте текущий пароль и длину нового пароля.
                    </p>
                  )}
                  <button className="rounded-2xl border border-[#332725] px-5 py-3 text-[#332725]">
                    Обновить пароль
                  </button>
                </form>

                <form action="/api/auth/logout" method="post">
                  <button className="w-full rounded-2xl border border-[#c98778] px-5 py-3 text-[#c98778]">
                    Выйти со всех устройств
                  </button>
                  <p className="mt-3 text-sm leading-6 text-[#8a7a76]">
                    Сейчас кнопка завершает текущий сеанс. Полное завершение
                    всех устройств добавим вместе с 2FA.
                  </p>
                </form>
              </div>
            </div>
          </Section>
        </div>
      </div>
    </section>
  );
}
