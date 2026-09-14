import assert from "node:assert/strict";

import {
  DEFAULT_PAYMENT_HOLD_MINUTES,
  getPaymentHoldMinutes,
  isPaymentHoldExpired,
  paymentHoldExpiresAt,
} from "../src/lib/booking-holds";

const now = new Date("2026-09-14T10:00:00.000Z");
assert.equal(getPaymentHoldMinutes(undefined), DEFAULT_PAYMENT_HOLD_MINUTES);
assert.equal(getPaymentHoldMinutes("30"), 30);
assert.equal(getPaymentHoldMinutes("60"), 60);
assert.equal(getPaymentHoldMinutes("15"), 60);
assert.equal(paymentHoldExpiresAt(now).toISOString(), "2026-09-14T11:00:00.000Z");
assert.equal(isPaymentHoldExpired({ status: "awaiting_payment", paymentStatus: "waiting", holdExpiresAt: new Date("2026-09-14T10:59:59Z") }, now), false);
assert.equal(isPaymentHoldExpired({ status: "awaiting_payment", paymentStatus: "waiting", holdExpiresAt: new Date("2026-09-14T09:59:59Z") }, now), true);
assert.equal(isPaymentHoldExpired({ status: "confirmed", paymentStatus: "paid", holdExpiresAt: new Date("2026-09-14T09:00:00Z") }, now), false);
console.log("booking hold tests: PASS");
