import { cookies } from "next/headers";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";

import { db } from "@/src/db";
import { appointmentRequests, users } from "@/src/db/schema";
import {
  getUserIdFromSession,
  USER_COOKIE_NAME,
} from "@/src/lib/user-session";

export const dynamic = "force-dynamic";

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

function formatDateTime(value: Date | null) {
  if (!value) return "Дата уточняется";

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

export default async function AccountPage() {
  const cookieStore = await cookies();
  const userId = await getUserIdFromSession(
    cookieStore.get(USER_COOKIE_NAME)?.value
  );

  const [user] = userId
    ? await db.select().from(users).where(eq(users.id, userId)).limit(1)
    : [];

  const appointments = user
    ? await db
        .select()
        .from(appointmentRequests)
        .where(eq(appointmentRequests.userId, user.id))
        .orderBy(desc(appointmentRequests.createdAt))
    : [];

  return (
    <section className="bg-[#fff8f6] px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="mb-4 text-sm uppercase tracking-[0.25em] text-[#c98778]">
              Личный кабинет
            </p>

            <h1 className="font-serif text-6xl leading-tight text-[#332725]">
              {user?.name}
            </h1>

            <p className="mt-5 text-lg text-[#5f5552]">
              {user?.email}
              {user?.phone ? ` · ${user.phone}` : ""}
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

        <div className="mt-14 rounded-[2rem] border border-[#ead7d1] bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-serif text-4xl text-[#332725]">
                Мои записи
              </h2>
              <p className="mt-3 text-[#5f5552]">
                Здесь будут отображаться консультации, созданные после входа в
                кабинет.
              </p>
            </div>

            <Link
              href="/contacts#booking"
              className="rounded-2xl bg-[#332725] px-6 py-3 text-white"
            >
              Записаться
            </Link>
          </div>

          {appointments.length > 0 ? (
            <div className="mt-8 grid gap-4">
              {appointments.map((appointment) => (
                <article
                  key={appointment.id}
                  className="rounded-2xl border border-[#ead7d1] bg-[#fff8f6] p-5"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-sm uppercase tracking-[0.18em] text-[#c98778]">
                        {statusLabels[appointment.status] ??
                          appointment.status}
                      </p>
                      <h3 className="mt-3 text-2xl font-medium text-[#332725]">
                        {formatDateTime(appointment.scheduledAt)}
                      </h3>
                      <p className="mt-2 text-[#5f5552]">
                        Формат:{" "}
                        {formatLabels[appointment.consultationFormat] ??
                          appointment.consultationFormat}
                      </p>
                    </div>

                    <div className="text-sm text-[#5f5552] md:text-right">
                      <p>
                        Оплата:{" "}
                        {paymentStatusLabels[appointment.paymentStatus] ??
                          appointment.paymentStatus}
                      </p>
                      {appointment.paymentLink && (
                        <a
                          href={appointment.paymentLink}
                          className="mt-2 inline-flex text-[#c98778]"
                        >
                          Перейти к оплате
                        </a>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-8 rounded-2xl bg-[#fff8f6] p-6 text-[#5f5552]">
              У вас пока нет записей в личном кабинете.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
