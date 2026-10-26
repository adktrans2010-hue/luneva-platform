type ConfirmationAppointment = {
  scheduledAt: Date | null;
  consultationFormat: string;
  consultationLocation?: string | null;
};

export type PaidAppointmentConfirmation = {
  date: string;
  time: string;
  format: string;
  service: string;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function formatConsultationFormat(
  format: string,
  location?: string | null
) {
  if (format === "online") return "Онлайн";
  if (format === "office" || format === "in_person") return "Очно";
  if (location === "online") return "Онлайн";
  return "Формат уточняется";
}

export function createPaidAppointmentConfirmation(
  appointment: ConfirmationAppointment,
  serviceName: string
): PaidAppointmentConfirmation {
  const scheduledAt = appointment.scheduledAt;
  const formatter = new Intl.DateTimeFormat("ru-RU", {
    timeZone: "Europe/Moscow",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const timeFormatter = new Intl.DateTimeFormat("ru-RU", {
    timeZone: "Europe/Moscow",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  return {
    date: scheduledAt ? formatter.format(scheduledAt) : "будет уточнена",
    time: scheduledAt ? timeFormatter.format(scheduledAt) : "будет уточнено",
    format: formatConsultationFormat(
      appointment.consultationFormat,
      appointment.consultationLocation
    ),
    service: serviceName || "Консультация",
  };
}

export function renderPaidAppointmentTelegram(
  confirmation: PaidAppointmentConfirmation
) {
  return [
    "✅ Оплата получена. Ваша запись подтверждена.",
    "",
    `📅 ${confirmation.date}`,
    `🕐 ${confirmation.time}`,
    `📍 Формат: ${confirmation.format}`,
    `💬 ${confirmation.service}`,
    "",
    "В ближайшее время Александра свяжется с вами и уточнит детали встречи.",
    "",
    "До встречи!",
  ].join("\n");
}

export function renderPaidAppointmentEmailHtml(
  confirmation: PaidAppointmentConfirmation,
  accountUrl?: string
) {
  const row = (label: string, value: string) =>
    `<tr><td style="padding:8px 0;color:#8a7a76">${escapeHtml(label)}</td><td style="padding:8px 0;text-align:right;color:#332725;font-weight:600">${escapeHtml(value)}</td></tr>`;
  const account = accountUrl
    ? `<p style="margin:24px 0 0"><a href="${escapeHtml(accountUrl)}" style="color:#9c544c">Открыть личный кабинет</a></p>`
    : "";

  return `<!doctype html><html lang="ru"><body style="margin:0;background:#fff8f6;color:#332725;font-family:Arial,sans-serif"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:24px 12px"><tr><td align="center"><table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;background:#fffdfc;border:1px solid #ead7d1;border-radius:20px"><tr><td style="padding:36px 32px"><p style="margin:0 0 16px;color:#9c544c;letter-spacing:1.5px;font-size:12px">LUNEVA PSY</p><h1 style="margin:0 0 16px;font-size:26px;line-height:1.25">Ваша консультация подтверждена</h1><p style="margin:0 0 24px;line-height:1.55">Здравствуйте!</p><p style="margin:0 0 24px;line-height:1.55">Оплата получена, ваша запись подтверждена.</p><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-top:1px solid #ead7d1;border-bottom:1px solid #ead7d1">${row("Дата", confirmation.date)}${row("Время", confirmation.time)}${row("Формат встречи", confirmation.format)}${row("Услуга", confirmation.service)}</table><p style="margin:24px 0 0;line-height:1.55">В ближайшее время Александра свяжется с вами и уточнит детали встречи.</p><p style="margin:16px 0 0;line-height:1.55">Если планы изменятся, информацию о записи можно посмотреть в личном кабинете или связаться с Александрой.</p>${account}<p style="margin:24px 0 0;line-height:1.55">До встречи!<br>Александра Лунева</p></td></tr></table></td></tr></table></body></html>`;
}
