import { isEmailConfigured, sendMail } from "@/src/lib/email";
import { getOwnerNotificationEmail } from "@/src/lib/site-contacts";

type TelegramMessage = {
  text: string;
  chatId?: string | null;
};

type AppointmentLike = {
  id: string;
  name: string;
  contact: string;
  consultationFormat: string;
  scheduledAt: Date | null;
  message?: string | null;
  paymentStatus?: string | null;
  paymentLink?: string | null;
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

const paymentStatusLabels: Record<string, string> = {
  waiting: "Ожидает оплаты",
  invoice_sent: "Ссылка отправлена",
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

async function sendOwnerEmailNotification(subject: string, text: string) {
  if (!isEmailConfigured()) {
    return {
      ok: false,
      reason: "Email не настроен: добавьте SMTP_HOST, SMTP_USER и SMTP_PASSWORD.",
    };
  }

  try {
    await sendMail({
      to: getOwnerNotificationEmail(),
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
      "<b>Новая запись</b>",
      `Клиент: ${escapeHtml(appointment.name)}`,
      `Контакт: ${escapeHtml(appointment.contact)}`,
      `Формат: ${formatLabels[appointment.consultationFormat] ?? appointment.consultationFormat}`,
      `Дата: ${formatDateTime(appointment.scheduledAt)}`,
      appointment.message ? `Запрос: ${escapeHtml(appointment.message)}` : "",
    ]
      .filter(Boolean)
      .join("\n");

  const [telegramResult, emailResult] = await Promise.all([
    sendTelegramMessage({ text }),
    sendOwnerEmailNotification("Новая запись на консультацию", text),
  ]);

  return combineNotificationResults(telegramResult, emailResult);
}

export async function notifyOwnerAppointmentChanged({
  appointment,
  status,
  dateChanged,
}: {
  appointment: AppointmentLike;
  status?: string;
  dateChanged?: boolean;
}) {
  const text = [
      dateChanged ? "<b>Изменена дата записи</b>" : "<b>Изменен статус записи</b>",
      `Клиент: ${escapeHtml(appointment.name)}`,
      `Контакт: ${escapeHtml(appointment.contact)}`,
      `Статус: ${status ? statusLabels[status] ?? status : "без изменения"}`,
      `Дата: ${formatDateTime(appointment.scheduledAt)}`,
    ].join("\n");

  const [telegramResult, emailResult] = await Promise.all([
    sendTelegramMessage({ text }),
    sendOwnerEmailNotification("Изменение записи на консультацию", text),
  ]);

  return combineNotificationResults(telegramResult, emailResult);
}

export async function notifyOwnerPayment(appointment: AppointmentLike) {
  const text = [
      "<b>Оплата по записи</b>",
      `Клиент: ${escapeHtml(appointment.name)}`,
      `Контакт: ${escapeHtml(appointment.contact)}`,
      `Дата: ${formatDateTime(appointment.scheduledAt)}`,
      `Статус оплаты: ${
        appointment.paymentStatus
          ? paymentStatusLabels[appointment.paymentStatus] ?? appointment.paymentStatus
          : "не указан"
      }`,
      appointment.paymentLink ? `Ссылка: ${escapeHtml(appointment.paymentLink)}` : "",
    ]
      .filter(Boolean)
      .join("\n");

  const [telegramResult, emailResult] = await Promise.all([
    sendTelegramMessage({ text }),
    sendOwnerEmailNotification("Оплата по записи", text),
  ]);

  return combineNotificationResults(telegramResult, emailResult);
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

  const [telegramResult, emailResult] = await Promise.all([
    sendTelegramMessage({ text: message }),
    sendOwnerEmailNotification("Новый отзыв на Luneva Psy", message),
  ]);

  return combineNotificationResults(telegramResult, emailResult);
}
