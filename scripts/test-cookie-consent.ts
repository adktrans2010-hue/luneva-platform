import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  COOKIE_CONSENT_EVENT,
  COOKIE_CONSENT_KEY,
  hasAnalyticsConsent,
  readCookieConsent,
  saveCookieConsent,
} from "../src/lib/cookie-consent";

class MemoryStorage {
  private values = new Map<string, string>();

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }

  entries() {
    return [...this.values.entries()];
  }
}

const storage = new MemoryStorage();
const events: string[] = [];
const eventTarget = { dispatchEvent: (event: Event) => events.push(event.type) > 0 };

// First visit: absence is an explicit analytics OFF state.
assert.equal(readCookieConsent(storage), null);
assert.equal(hasAnalyticsConsent(storage), false);

saveCookieConsent("accepted", storage, eventTarget);
assert.equal(readCookieConsent(storage), "accepted");
assert.equal(hasAnalyticsConsent(storage), true);
assert.deepEqual(events, [COOKIE_CONSENT_EVENT]);

// A reload reads the same persisted decision.
assert.equal(readCookieConsent(storage), "accepted");

saveCookieConsent("rejected", storage, eventTarget);
assert.equal(readCookieConsent(storage), "rejected");
assert.equal(hasAnalyticsConsent(storage), false);
assert.equal(readCookieConsent(storage), "rejected");

// Reject/withdraw is persisted and changes only the analytics consent key.
assert.deepEqual(storage.entries(), [[COOKIE_CONSENT_KEY, "rejected"]]);
assert.equal(JSON.stringify(storage.entries()).match(/email|phone|account|message/gi), null);

const root = process.cwd();
const metrika = readFileSync(path.join(root, "components/YandexMetrika.tsx"), "utf8");
const banner = readFileSync(path.join(root, "components/CookieBanner.tsx"), "utf8");
const footer = readFileSync(path.join(root, "components/Footer.tsx"), "utf8");

assert.match(banner, /Отклонить/);
assert.match(banner, /Принять/);
assert.match(footer, /CookieSettingsButton/);
assert.match(metrika, /"destruct"/);
assert.match(metrika, /"\/admin"/);
assert.match(metrika, /"\/account"/);
assert.match(metrika, /"\/login"/);
assert.match(metrika, /!hasConsent/);

console.log("cookie_consent_targeted_tests=PASS");
