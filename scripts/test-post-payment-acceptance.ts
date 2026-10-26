import assert from "node:assert/strict";

import {
  createPaidAppointmentConfirmation,
  renderPaidAppointmentEmailHtml,
  renderPaidAppointmentTelegram,
} from "../src/lib/paid-appointment-confirmation";

type Fixture = {
  status: "awaiting_payment" | "confirmed" | "expired";
  payment: "waiting" | "paid";
  holdExpiresAt: Date;
  slotAssigned: boolean;
  processed: boolean;
  email: number;
  telegram: number;
  owner: number;
};

const now = new Date("2026-10-26T10:00:00.000Z");
const confirmation = createPaidAppointmentConfirmation(
  { scheduledAt: new Date("2026-10-28T15:30:00.000Z"), consultationFormat: "online" },
  "Тестовая консультация"
);

function fixture(): Fixture {
  return {
    status: "awaiting_payment",
    payment: "waiting",
    holdExpiresAt: new Date(now.getTime() + 60 * 60_000),
    slotAssigned: true,
    processed: false,
    email: 0,
    telegram: 0,
    owner: 0,
  };
}

function succeed(value: Fixture, failures = { email: false, telegram: false }) {
  if (value.processed) return;
  value.payment = "paid";
  value.status = "confirmed";
  value.processed = true;
  if (!failures.email) value.email += 1;
  if (!failures.telegram) value.telegram += 1;
  value.owner += 1;
}

function expire(value: Fixture, at: Date) {
  if (value.status === "awaiting_payment" && value.payment !== "paid" && value.holdExpiresAt <= at) {
    value.status = "expired";
    value.slotAssigned = false;
  }
}

const paid = fixture();
succeed(paid);
assert.deepEqual(
  { status: paid.status, payment: paid.payment, slotAssigned: paid.slotAssigned },
  { status: "confirmed", payment: "paid", slotAssigned: true }
);
assert.equal(paid.email, 1);
assert.equal(paid.telegram, 1);
assert.equal(paid.owner, 1);
succeed(paid);
assert.deepEqual([paid.email, paid.telegram, paid.owner], [1, 1, 1]);

const expired = fixture();
expire(expired, new Date(now.getTime() + 61 * 60_000));
assert.equal(expired.status, "expired");
assert.equal(expired.slotAssigned, false);
assert.equal([expired].filter((item) => item.status === "awaiting_payment").length, 0);

const emailFailure = fixture();
succeed(emailFailure, { email: true, telegram: false });
assert.equal(emailFailure.status, "confirmed");
assert.equal(emailFailure.payment, "paid");
assert.equal(emailFailure.email, 0);

const telegramFailure = fixture();
succeed(telegramFailure, { email: false, telegram: true });
assert.equal(telegramFailure.status, "confirmed");
assert.equal(telegramFailure.telegram, 0);

const telegram = renderPaidAppointmentTelegram(confirmation);
const html = renderPaidAppointmentEmailHtml(confirmation);
for (const value of [confirmation.date, confirmation.time, confirmation.format, confirmation.service]) {
  assert.match(telegram, new RegExp(value));
  assert.match(html, new RegExp(value));
}
assert.match(telegram, /В ближайшее время Александра свяжется/);
assert.doesNotMatch(telegram, /[0-9a-f]{8}-[0-9a-f]{4}-/i);
console.log("synthetic post-payment acceptance: PASS");
