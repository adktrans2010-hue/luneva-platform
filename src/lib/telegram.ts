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
  return sendTelegramMessage({
    text: [
      "<b>Новая запись</b>",
      `Клиент: ${escapeHtml(appointment.name)}`,
      `Контакт: ${escapeHtml(appointment.contact)}`,
      `Формат: ${formatLabels[appointment.consultationFormat] ?? appointment.consultationFormat}`,
      `Дата: ${formatDateTime(appointment.scheduledAt)}`,
      appointment.message ? `Запрос: ${escapeHtml(appointment.message)}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
  });
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
  return sendTelegramMessage({
    text: [
      dateChanged ? "<b>Изменена дата записи</b>" : "<b>Изменен статус записи</b>",
      `Клиент: ${escapeHtml(appointment.name)}`,
      `Контакт: ${escapeHtml(appointment.contact)}`,
      `Статус: ${status ? statusLabels[status] ?? status : "без изменения"}`,
      `Дата: ${formatDateTime(appointment.scheduledAt)}`,
    ].join("\n"),
  });
}

export async function notifyOwnerPayment(appointment: AppointmentLike) {
  return sendTelegramMessage({
    text: [
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
      .join("\n"),
  });
}
