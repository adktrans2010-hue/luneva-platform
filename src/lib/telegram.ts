import { isEmailConfigured, sendMail } from "@/src/lib/email";
import { getAdminSettings } from "@/src/lib/admin-settings";
import { SITE_CONTACTS, getOwnerNotificationEmail } from "@/src/lib/site-contacts";
import { getConsultationPlaceLabel } from "@/src/lib/consultation-locations";

type TelegramMessage = {
  text: string;
  chatId?: string | null;
};

type AppointmentLike = {
  id: string;
  name: string;
  contact: string;
  consultationFormat: string;
  consultationLocation?: string | null;
  scheduledAt: Date | null;
  message?: string | null;
  paymentMethod?: string | null;
  paymentStatus?: string | null;
  paymentAmount?: number | null;
  paymentLink?: string | null;
  paymentNote?: string | null;
};

type ClientLike = {
  name: string;
  email: string;
  phone?: string | null;
};

const formatLabels: Record<string, string> = {
  online: "Онлайн",
  office: "Очно в кабинете",
};

const statusLabels: Record<string, string> = {
  new: "Новая",
  scheduled: "Запланирована",
  completed: "Проведена",
  cancelled: "Отменена",
};

const paymentMethodLabels: Record<string, string> = {
  online: "Онлайн-оплата",
  package: "Оплаченный пакет",
  after_confirmation: "После подтверждения",
};

const paymentStatusLabels: Record<string, string> = {
  waiting: "Ожидает оплаты",
  invoice_sent: "Ссылка отправлена",
  partially_refunded: "Частичный возврат",
  refund_pending: "Возврат в обработке",
  refund_failed: "Ошибка возврата",
  manual_review: "Требует проверки",
  paid: "Оплачено",
  cancelled: "Отменено",
  refunded: "Возврат",
  not_required: "Без онлайн-оплаты",
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function formatDateTime(value: Date | null) {
  if (!value) return "не назначено";

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

function stripTelegramHtml(value: string) {
  return value.replace(/<[^>]*>/g, "");
}

function formatAppointmentLines(appointment: AppointmentLike) {
  return [
    `Клиент: ${escapeHtml(appointment.name)}`,
    `Контакт: ${escapeHtml(appointment.contact)}`,
    `Формат: ${formatLabels[appointment.consultationFormat] ?? appointment.consultationFormat}`,
    appointment.consultationFormat === "office"
      ? `Место: ${getConsultationPlaceLabel(
          appointment.consultationFormat,
          appointment.consultationLocation ?? "moscow"
        )}`
      : "",
    `Дата: ${formatDateTime(appointment.scheduledAt)}`,
    appointment.paymentMethod
      ? `Способ оплаты: ${
          paymentMethodLabels[appointment.paymentMethod] ?? appointment.paymentMethod
        }`
      : "",
    appointment.paymentStatus
      ? `Статус оплаты: ${
          paymentStatusLabels[appointment.paymentStatus] ?? appointment.paymentStatus
        }`
      : "",
    appointment.paymentAmount ? `Сумма: ${appointment.paymentAmount} руб.` : "",
    appointment.paymentLink ? `Ссылка оплаты: ${escapeHtml(appointment.paymentLink)}` : "",
    appointment.paymentNote ? `Комментарий оплаты: ${escapeHtml(appointment.paymentNote)}` : "",
    appointment.message ? `Запрос: ${escapeHtml(appointment.message)}` : "",
  ].filter(Boolean);
}

async function getOwnerEmail() {
  const settings = await getAdminSettings().catch(() => null);
  return (
    settings?.email?.trim() ||
    getOwnerNotificationEmail() ||
    SITE_CONTACTS.email
  );
}

async function sendOwnerEmailNotification(subject: string, text: string) {
  if (!isEmailConfigured()) {
    return {
      ok: false,
      reason: "Email не настроен: добавьте SMTP_HOST, SMTP_USER и SMTP_PASSWORD.",
    };
  }

  try {
    await sendMail({
      to: await getOwnerEmail(),
      subject,
      text: stripTelegramHtml(text),
    });

    return { ok: true, reason: null };
  } catch (error) {
    return {
      ok: false,
      reason:
        error instanceof Error
          ? error.message
          : "Не удалось отправить email-уведомление.",
    };
  }
}

function combineNotificationResults(
  telegramResult: Awaited<ReturnType<typeof sendTelegramMessage>>,
  emailResult: Awaited<ReturnType<typeof sendOwnerEmailNotification>>
) {
  const reasons = [
    telegramResult.ok ? null : `Telegram: ${telegramResult.reason}`,
    emailResult.ok ? null : `Email: ${emailResult.reason}`,
  ].filter(Boolean);

  return {
    ok: telegramResult.ok || emailResult.ok,
    reason: reasons.length > 0 ? reasons.join(" | ") : null,
  };
}

async function notifyOwner(subject: string, text: string) {
  const [telegramResult, emailResult] = await Promise.all([
    sendTelegramMessage({ text }),
    sendOwnerEmailNotification(subject, text),
  ]);

  return combineNotificationResults(telegramResult, emailResult);
}

export function isTelegramConfigured() {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_OWNER_CHAT_ID);
}

export async function sendTelegramMessage({ text, chatId }: TelegramMessage) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const targetChatId = chatId || process.env.TELEGRAM_OWNER_CHAT_ID;

  if (!token || !targetChatId) {
    return {
      ok: false,
      reason: "Telegram не настроен: добавьте TELEGRAM_BOT_TOKEN и TELEGRAM_OWNER_CHAT_ID.",
    };
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: targetChatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });

    if (!response.ok) {
      return {
        ok: false,
        reason: `Telegram вернул ошибку ${response.status}.`,
      };
    }

    return { ok: true, reason: null };
  } catch (error) {
    return {
      ok: false,
      reason:
        error instanceof Error
          ? error.message
          : "Не удалось отправить Telegram-уведомление.",
    };
  }
}

export async function notifyOwnerNewAppointment(appointment: AppointmentLike) {
  const text = [
    "<b>Новая запись на консультацию</b>",
    ...formatAppointmentLines(appointment),
  ].join("\n");

  return notifyOwner("Новая запись на консультацию", text);
}

export async function notifyOwnerAppointmentChanged({
  appointment,
  status,
  dateChanged,
  locationChanged,
}: {
  appointment: AppointmentLike;
  status?: string;
  dateChanged?: boolean;
  locationChanged?: boolean;
}) {
  const title =
    status === "cancelled"
      ? "Отмена консультации"
      : dateChanged
        ? "Перенос консультации"
        : locationChanged
          ? "Изменение места консультации"
          : "Изменение консультации";

  const text = [
    `<b>${title}</b>`,
    `Статус: ${status ? statusLabels[status] ?? status : "без изменения"}`,
    ...formatAppointmentLines(appointment),
  ].join("\n");

  return notifyOwner(title, text);
}

export async function notifyOwnerAppointmentEvent({
  appointment,
  title,
  details,
}: {
  appointment: AppointmentLike;
  title: string;
  details?: string | null;
}) {
  const text = [
    `<b>${escapeHtml(title)}</b>`,
    details ? `Детали: ${escapeHtml(details)}` : "",
    ...formatAppointmentLines(appointment),
  ]
    .filter(Boolean)
    .join("\n");

  return notifyOwner(title, text);
}

export async function notifyOwnerPayment(appointment: AppointmentLike) {
  const text = [
    "<b>Оплата по записи</b>",
    ...formatAppointmentLines(appointment),
  ].join("\n");

  return notifyOwner("Оплата по записи", text);
}

export async function notifyOwnerPaymentRefund({
  appointment,
  refund,
  payment,
  refundedAmountKopeks,
  remainingAmountKopeks,
}: {
  appointment: AppointmentLike;
  refund: {
    type: string;
    amountKopeks: number;
    providerRefundId?: string | null;
    reason?: string | null;
    requestedBy?: string | null;
  };
  payment: {
    providerPaymentId?: string | null;
  };
  refundedAmountKopeks: number;
  remainingAmountKopeks: number;
}) {
  const text = [
    "<b>Возврат выполнен</b>",
    `Тип: ${refund.type === "full" ? "полный" : "частичный"}`,
    ...formatAppointmentLines(appointment),
    `Сумма возврата: ${(refund.amountKopeks / 100).toLocaleString("ru-RU")} руб.`,
    `Всего возвращено: ${(refundedAmountKopeks / 100).toLocaleString("ru-RU")} руб.`,
    `Остаток оплаты: ${(remainingAmountKopeks / 100).toLocaleString("ru-RU")} руб.`,
    payment.providerPaymentId
      ? `ID платежа ЮKassa: ${escapeHtml(payment.providerPaymentId)}`
      : "",
    refund.providerRefundId
      ? `ID возврата ЮKassa: ${escapeHtml(refund.providerRefundId)}`
      : "",
    refund.requestedBy === "yookassa_dashboard"
      ? "Инициатор: кабинет ЮKassa"
      : "Инициатор: администратор",
    refund.reason ? `Причина: ${escapeHtml(refund.reason)}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return notifyOwner("Возврат по записи", text);
}

export async function notifyOwnerClientRegistered(client: ClientLike) {
  const message = [
    "<b>Новый клиент зарегистрировался</b>",
    `Имя: ${escapeHtml(client.name)}`,
    `Email: ${escapeHtml(client.email)}`,
    client.phone ? `Телефон: ${escapeHtml(client.phone)}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return notifyOwner("Новый клиент зарегистрировался", message);
}

export async function notifyOwnerPackageCreated({
  client,
  title,
  consultationFormat,
  totalSessions,
}: {
  client: ClientLike;
  title: string;
  consultationFormat: string;
  totalSessions: number;
}) {
  const message = [
    "<b>Клиенту добавлен пакет консультаций</b>",
    `Клиент: ${escapeHtml(client.name)}`,
    `Email: ${escapeHtml(client.email)}`,
    client.phone ? `Телефон: ${escapeHtml(client.phone)}` : "",
    `Пакет: ${escapeHtml(title)}`,
    `Формат: ${formatLabels[consultationFormat] ?? consultationFormat}`,
    `Количество консультаций: ${totalSessions}`,
  ]
    .filter(Boolean)
    .join("\n");

  return notifyOwner("Клиенту добавлен пакет консультаций", message);
}

export async function notifyOwnerNewReview({
  name,
  age,
  text,
  rating,
}: {
  name: string;
  age: string | null;
  text: string;
  rating: number;
}) {
  const message = [
    "<b>Новый отзыв на Luneva Psy</b>",
    `Имя: ${escapeHtml(name)}`,
    age ? `Возраст: ${escapeHtml(age)}` : "",
    `Оценка: ${rating} из 5`,
    "Статус: ожидает модерации",
    "",
    escapeHtml(text),
  ]
    .filter(Boolean)
    .join("\n");

  return notifyOwner("Новый отзыв на Luneva Psy", message);
}
