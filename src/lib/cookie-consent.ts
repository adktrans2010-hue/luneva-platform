export const COOKIE_CONSENT_KEY = "luneva_cookie_consent";
export const COOKIE_CONSENT_EVENT = "luneva:cookie-consent";
export const COOKIE_SETTINGS_EVENT = "luneva:cookie-settings";

export type CookieConsentDecision = "accepted" | "rejected";

type ConsentStorage = Pick<Storage, "getItem" | "setItem">;
type ConsentEventTarget = Pick<EventTarget, "dispatchEvent">;

export function readCookieConsent(storage: ConsentStorage): CookieConsentDecision | null {
  const value = storage.getItem(COOKIE_CONSENT_KEY);
  return value === "accepted" || value === "rejected" ? value : null;
}

export function hasAnalyticsConsent(storage: ConsentStorage) {
  return readCookieConsent(storage) === "accepted";
}

export function saveCookieConsent(
  decision: CookieConsentDecision,
  storage: ConsentStorage,
  eventTarget: ConsentEventTarget,
) {
  storage.setItem(COOKIE_CONSENT_KEY, decision);
  eventTarget.dispatchEvent(new Event(COOKIE_CONSENT_EVENT));
}

export function openCookieSettings(eventTarget: ConsentEventTarget) {
  eventTarget.dispatchEvent(new Event(COOKIE_SETTINGS_EVENT));
}
