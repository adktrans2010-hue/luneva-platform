import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

import { sanitizeGoalParams, trackGoal } from "../src/lib/client-analytics";

const root = process.cwd();
const read = (file: string) => readFileSync(path.join(root, file), "utf8");

const metrika = read("components/YandexMetrika.tsx");
const tracker = read("components/AnalyticsTracker.tsx");
const publicBooking = read("components/AppointmentForm.tsx");
const accountBooking = read("components/AccountBookingForm.tsx");
const paymentStatus = read("components/PaymentStatusAnalytics.tsx");

assert.match(metrika, /!counterId/);
assert.match(metrika, /!hasConsent/);
assert.match(metrika, /!window\.__lunevaMetrikaActive/);
assert.match(metrika, /webvisor: true/);
assert.match(metrika, /clickmap: true/);
assert.match(metrika, /defer: true/);
assert.match(metrika, /privateRoutePrefixes/);
assert.match(metrika, /JSON\.stringify\(pathname\)/);
assert.match(metrika, /"destruct"/);

const storage = new Map<string, string>([["luneva_cookie_consent", "accepted"]]);
Object.defineProperty(globalThis, "window", {
  configurable: true,
  value: {
    localStorage: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
    },
    sessionStorage: {
      getItem: (key: string) => storage.get(`session:${key}`) ?? null,
      setItem: (key: string, value: string) => storage.set(`session:${key}`, value),
    },
  },
});

assert.doesNotThrow(() => trackGoal("click_book"));

assert.deepEqual(
  sanitizeGoalParams({
    service_type: "online-consultation",
    consultation_format: "online",
    booking_channel: "website",
    payment_status: "paid",
    name: "Sensitive Name",
    phone: "+79991234567",
    email: "person@example.test",
    client_uuid: "not-allowed",
  }),
  {
    service_type: "online-consultation",
    consultation_format: "online",
    booking_channel: "website",
    payment_status: "paid",
  },
);

assert.match(tracker, /"click_book"[\s\S]*\{ once: true \}/);
assert.match(publicBooking, /if \(!response\.ok \|\| !data\.paymentUrl\)[\s\S]*trackGoal\("booking_created"/);
assert.match(accountBooking, /if \(!response\.ok\)[\s\S]*trackGoal\("booking_created"/);
assert.match(publicBooking, /trackGoal\("payment_started"[\s\S]*window\.location\.assign/);
assert.match(accountBooking, /if \(data\.paymentUrl\)[\s\S]*trackGoal\("payment_started"/);
assert.match(paymentStatus, /if \(status === "paid"\)[\s\S]*"payment_success"/);
assert.match(paymentStatus, /once: true, dedupeKey: paymentId/);
assert.doesNotMatch(paymentStatus, /payment_success[\s\S]*paymentUrl/);
assert.match(publicBooking, /ym-hide-content/);
assert.match(accountBooking, /ym-hide-content/);
assert.doesNotMatch(tracker, /`\$\{pathname\}\?\$\{query\}`/);

console.log("yandex_metrika_targeted_tests=PASS");
