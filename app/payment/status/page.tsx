import Link from "next/link";
import type { Metadata } from "next";
import { eq } from "drizzle-orm";

import { db } from "@/src/db";
import { appointmentRequests, yookassaPayments } from "@/src/db/schema";
import PaymentStatusAnalytics from "@/components/PaymentStatusAnalytics";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Статус оплаты | Luneva Psy",
  description: "Страница статуса оплаты консультации.",
  robots: {
    index: false,
    follow: false,
  },
};

type PaymentStatusPageProps = {
  searchParams: Promise<{
    paymentId?: string;
  }>;
};

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const statusCopy: Record<
  string,
  { title: string; text: string; tone: "success" | "waiting" | "error" }
> = {
  paid: {
    title: "Оплата получена",
    text: "Спасибо. Запись сохранена, а информация об оплате передана Александре.",
    tone: "success",
  },
  invoice_sent: {
    title: "Платеж ожидает подтверждения",
    text: "Если вы уже оплатили, статус обновится автоматически после подтверждения ЮKassa.",
    tone: "waiting",
  },
  waiting: {
    title: "Платеж ожидает оплаты",
    text: "Если страница оплаты была закрыта, можно вернуться к записи или связаться с Александрой.",
    tone: "waiting",
  },
  creating: {
    title: "Платеж создается",
    text: "Подождите немного и обновите страницу. Обычно это занимает несколько секунд.",
    tone: "waiting",
  },
  waiting_for_capture: {
    title: "Оплата авторизована",
    text: "Платеж ожидает финального подтверждения.",
    tone: "waiting",
  },
  cancelled: {
    title: "Платеж отменен",
    text: "Оплата не завершена. Можно создать новую запись или выбрать оплату после подтверждения.",
    tone: "error",
  },
  failed: {
    title: "Платеж не создан",
    text: "Не удалось создать оплату. Попробуйте еще раз или выберите оплату после подтверждения.",
    tone: "error",
  },
  validation_failed: {
    title: "Платеж требует проверки",
    text: "Данные платежа не совпали с записью. Александра получит информацию для ручной проверки.",
    tone: "error",
  },
  partially_refunded: {
    title: "Часть оплаты возвращена",
    text: "По платежу оформлен частичный возврат.",
    tone: "waiting",
  },
  refunded: {
    title: "Оплата возвращена",
    text: "По платежу оформлен полный возврат.",
    tone: "error",
  },
};

function formatRub(amountKopeks: number) {
  return `${new Intl.NumberFormat("ru-RU").format(amountKopeks / 100)} руб.`;
}

function getStatusCopy(status?: string | null) {
  return statusCopy[status || ""] ?? statusCopy.waiting;
}

function toneClasses(tone: "success" | "waiting" | "error") {
  if (tone === "success") return "border-[#b8d7ba] bg-[#f1fbf2] text-[#416d44]";
  if (tone === "error") return "border-[#e7c1b7] bg-[#fff3ef] text-[#8c4538]";

  return "border-[#ead7d1] bg-[#fff8f6] text-[#5f5552]";
}

async function getPayment(paymentId: string) {
  if (!uuidPattern.test(paymentId)) return null;

  const [payment] = await db
    .select()
    .from(yookassaPayments)
    .where(eq(yookassaPayments.id, paymentId))
    .limit(1);

  if (!payment) return null;

  const [appointment] = await db
    .select()
    .from(appointmentRequests)
    .where(eq(appointmentRequests.id, payment.appointmentId))
    .limit(1);

  return { payment, appointment };
}

export default async function PaymentStatusPage({
  searchParams,
}: PaymentStatusPageProps) {
  const params = await searchParams;
  const result = params.paymentId ? await getPayment(params.paymentId) : null;

  if (!result) {
    return (
      <section className="bg-[#fff8f6] px-6 py-24">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-[#ead7d1] bg-white p-8 shadow-sm md:p-12">
          <p className="mb-4 text-sm uppercase tracking-[0.25em] text-[#c98778]">
            Оплата
          </p>
          <h1 className="font-serif text-5xl leading-tight text-[#332725]">
            Платеж не найден
          </h1>
          <p className="mt-6 leading-8 text-[#5f5552]">
            Возможно, ссылка устарела или платеж еще не успел сохраниться. Если
            вы уже оплатили консультацию, напишите Александре в WhatsApp.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/contacts#booking"
              className="rounded-2xl bg-[#332725] px-6 py-3 text-white"
            >
              Записаться
            </Link>
            <Link
              href="/contacts"
              className="rounded-2xl border border-[#c98778] px-6 py-3 text-[#8c4538]"
            >
              Контакты
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const { payment, appointment } = result;
  const copy = getStatusCopy(payment.status);

  return (
    <section className="bg-[#fff8f6] px-6 py-24">
      <PaymentStatusAnalytics paymentId={payment.id} status={payment.status} />
      <div className="mx-auto max-w-4xl rounded-[2rem] border border-[#ead7d1] bg-white p-8 shadow-sm md:p-12">
        <p className="mb-4 text-sm uppercase tracking-[0.25em] text-[#c98778]">
          Оплата
        </p>

        <h1 className="font-serif text-5xl leading-tight text-[#332725]">
          {copy.title}
        </h1>

        <div className={`mt-8 rounded-2xl border p-5 ${toneClasses(copy.tone)}`}>
          <p>{copy.text}</p>
        </div>

        <dl className="mt-8 grid gap-4 text-[#5f5552] sm:grid-cols-2">
          <div className="rounded-2xl border border-[#ead7d1] bg-[#fff8f6] p-5">
            <dt className="text-sm uppercase tracking-[0.18em] text-[#c98778]">
              Сумма
            </dt>
            <dd className="mt-2 text-xl font-semibold text-[#332725]">
              {formatRub(payment.amountKopeks)}
            </dd>
          </div>

          <div className="rounded-2xl border border-[#ead7d1] bg-[#fff8f6] p-5">
            <dt className="text-sm uppercase tracking-[0.18em] text-[#c98778]">
              Услуга
            </dt>
            <dd className="mt-2 text-xl font-semibold text-[#332725]">
              {payment.productNameSnapshot || "Консультация"}
            </dd>
          </div>

          <div className="rounded-2xl border border-[#ead7d1] bg-[#fff8f6] p-5">
            <dt className="text-sm uppercase tracking-[0.18em] text-[#c98778]">
              Статус
            </dt>
            <dd className="mt-2 text-xl font-semibold text-[#332725]">
              {payment.status}
            </dd>
          </div>

          <div className="rounded-2xl border border-[#ead7d1] bg-[#fff8f6] p-5">
            <dt className="text-sm uppercase tracking-[0.18em] text-[#c98778]">
              Запись
            </dt>
            <dd className="mt-2 text-xl font-semibold text-[#332725]">
              {appointment?.scheduledAt
                ? appointment.scheduledAt.toLocaleString("ru-RU")
                : "Время уточняется"}
            </dd>
          </div>
        </dl>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/account"
            className="rounded-2xl bg-[#332725] px-6 py-3 text-white"
          >
            Открыть кабинет
          </Link>
          <Link
            href="/contacts"
            className="rounded-2xl border border-[#c98778] px-6 py-3 text-[#8c4538]"
          >
            Контакты
          </Link>
        </div>
      </div>
    </section>
  );
}
