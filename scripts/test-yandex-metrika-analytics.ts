import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

import { getMetrikaPageUrl, sanitizeGoalParams, trackGoal } from "../src/lib/client-analytics";

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
assert.match(metrika, /JSON\.stringify\(getMetrikaPageUrl/);
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

assert.equal(getMetrikaPageUrl('/rpp', '?utm_source=test&utm_campaign=metrika_validation_20261122&token=private&email=private&paymentId=private'), '/rpp?utm_source=test&utm_campaign=metrika_validation_20261122');
assert.equal(getMetrikaPageUrl('/rpp', '?token=private'), '/rpp');
assert.equal(getMetrikaPageUrl('/rpp', '?utm_source=%3Cscript%3E'), '/rpp?utm_source=script');

const oldEnv = { mode: process.env.NODE_ENV, id: process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID };
Object.assign(process.env, { NODE_ENV: 'production', NEXT_PUBLIC_YANDEX_METRIKA_ID: '113474556' });
const calls: unknown[][] = [];
window.ym = (...args) => { calls.push(args); };
window.__lunevaMetrikaActive = false;
trackGoal('view_service', {}, { once: true });
assert.equal(calls.length, 0);
window.__lunevaMetrikaActive = true;
trackGoal('view_service', {}, { once: true });
trackGoal('view_service', {}, { once: true });
assert.equal(calls.length, 1, 'a not-ready attempt must not suppress the first real goal');
assert.deepEqual(calls[0], [113474556, 'reachGoal', 'view_service', {}]);
storage.set('luneva_cookie_consent', 'rejected');
trackGoal('booking_started');
assert.equal(calls.length, 1, 'no goals without consent');
storage.set('luneva_cookie_consent', 'accepted');
for (const [key, value] of Object.entries({ NODE_ENV: oldEnv.mode, NEXT_PUBLIC_YANDEX_METRIKA_ID: oldEnv.id })) {
  if (value === undefined) delete process.env[key]; else process.env[key] = value;
}

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
