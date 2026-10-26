import assert from "node:assert/strict";

import {
  createPaidAppointmentConfirmation,
  renderPaidAppointmentEmailHtml,
  renderPaidAppointmentTelegram,
} from "../src/lib/paid-appointment-confirmation";

const confirmation = createPaidAppointmentConfirmation(
  {
    scheduledAt: new Date("2026-10-27T14:30:00.000Z"),
    consultationFormat: "online",
    consultationLocation: "online",
  },
  "Индивидуальная консультация"
);

assert.equal(confirmation.date, "27 октября 2026 г.");
assert.equal(confirmation.time, "17:30");
assert.equal(confirmation.format, "Онлайн");

const telegram = renderPaidAppointmentTelegram(confirmation);
assert.match(telegram, /Оплата получена/);
assert.match(telegram, /Индивидуальная консультация/);
assert.doesNotMatch(telegram, /[0-9a-f]{8}-[0-9a-f]{4}-/i);

const email = renderPaidAppointmentEmailHtml(
  confirmation,
  "https://example.test/account/invite?token=local-preview"
);
assert.match(email, /Ваша консультация подтверждена/);
assert.match(email, /Формат встречи/);
assert.match(email, /Открыть личный кабинет/);
assert.doesNotMatch(email, /undefined|null/);

console.log("paid appointment confirmation checks passed");
