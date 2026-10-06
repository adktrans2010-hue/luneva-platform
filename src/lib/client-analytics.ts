"use client";

import {
  hasAnalyticsConsent,
} from "@/src/lib/cookie-consent";
import {
  attributionKeys,
  type AttributionValues,
  type AttributionPayload,
} from "@/src/lib/attribution";

export const ATTRIBUTION_STORAGE_KEY = "luneva_attribution";
const SENT_GOALS_STORAGE_KEY = "luneva_sent_goals";
const VISITOR_ID_STORAGE_KEY = "luneva_visitor_id";
const SESSION_ID_STORAGE_KEY = "luneva_session_id";

export type StoredAttribution = AttributionPayload;

export type AnalyticsGoal =
  | "view_service"
  | "click_book"
  | "booking_started"
  | "booking_created"
  | "payment_started"
  | "help_bot_click"
  // Legacy call sites remain typed during the migration, but trackGoal only
  // transmits the conversion allowlist below to Yandex Metrika.
  | "booking_cta_click"
  | "booking_form_open"
  | "booking_submit"
  | "booking_success"
  | "booking_error"
  | "slot_selected"
  | "payment_click"
  | "payment_created"
  | "payment_success"
  | "payment_failed"
  | "phone_click"
  | "whatsapp_click"
  | "telegram_click"
  | "max_click"
  | "vk_click"
  | "youtube_click"
  | "tiktok_click"
  | "threads_click"
  | "instagram_click"
  | "email_click"
  | "certificate_card_click"
  | "certificate_modal_open"
  | "certificate_modal_close"
  | "contact_telegram_click"
  | "contact_whatsapp_click"
  | "contact_email_click"
  | "help_topic_click"
  | "review_filter_click"
  | "review_submit";

export type SafeGoalParams = Partial<
  Record<
    | "service_type"
    | "consultation_format"
    | "booking_channel"
    | "payment_status",
    string
  >
>;

const metrikaGoals = new Set<AnalyticsGoal>([
  "view_service",
  "click_book",
  "booking_started",
  "slot_selected",
  "booking_created",
  "payment_started",
  "payment_success",
  "telegram_click",
  "help_bot_click",
]);

const safeGoalParamKeys = new Set<keyof SafeGoalParams>([
  "service_type",
  "consultation_format",
  "booking_channel",
  "payment_status",
]);

declare global {
  interface Window {
    __lunevaMetrikaActive?: boolean;
    ym?: (
      counterId: number,
      method: "init" | "hit" | "reachGoal" | "destruct",
      targetOrOptions?: string | Record<string, unknown>,
      params?: Record<string, unknown>,
    ) => void;
  }
}

function canUseBrowserStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function hasCookieConsent() {
  return canUseBrowserStorage() && hasAnalyticsConsent(window.localStorage);
}

export function getStoredId(key: string) {
  if (!canUseBrowserStorage()) return "";

  const existing = window.localStorage.getItem(key);

  if (existing) return existing;

  const value = crypto.randomUUID();
  window.localStorage.setItem(key, value);

  return value;
}

export function getVisitorId() {
  return getStoredId(VISITOR_ID_STORAGE_KEY);
}

export function getSessionId() {
  return getStoredId(SESSION_ID_STORAGE_KEY);
}

function sanitizeAttributionValue(value: string) {
  return value
    .normalize("NFC")
    .replace(/[<>"'`\\]/g, "")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .trim()
    .slice(0, 160);
}

function readCurrentAttribution(searchParams: URLSearchParams): AttributionValues {
  return attributionKeys.reduce<AttributionValues>((result, key) => {
    const raw = searchParams.get(key);
    const value = raw ? sanitizeAttributionValue(raw) : "";

    if (value) {
      result[key] = value;
    }

    return result;
  }, {});
}

function readStoredAttribution(): StoredAttribution {
  if (!canUseBrowserStorage()) return {};

  try {
    const raw = window.localStorage.getItem(ATTRIBUTION_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredAttribution) : {};
  } catch {
    return {};
  }
}

export function captureAttribution(searchParams: URLSearchParams) {
  if (!hasCookieConsent()) return;

  const current = readCurrentAttribution(searchParams);

  if (Object.keys(current).length === 0) return;

  const stored = readStoredAttribution();
  const now = new Date().toISOString();
  const next: StoredAttribution = {
    first: stored.first ?? current,
    firstCapturedAt: stored.firstCapturedAt ?? now,
    last: current,
    lastCapturedAt: now,
  };

  window.localStorage.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify(next));
}

export function getAttribution() {
  return readStoredAttribution();
}

function getMetrikaCounterId() {
  const value = process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID;

  if (process.env.NODE_ENV !== "production" || !value) return null;

  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export function sanitizeGoalParams(params: Record<string, unknown>): SafeGoalParams {
  const safe: SafeGoalParams = {};

  for (const [key, rawValue] of Object.entries(params)) {
    if (!safeGoalParamKeys.has(key as keyof SafeGoalParams)) continue;
    if (typeof rawValue !== "string") continue;

    const value = rawValue
      .normalize("NFC")
      .replace(/[^a-zA-Z0-9_-]/g, "")
      .slice(0, 64);

    if (value) safe[key as keyof SafeGoalParams] = value;
  }

  return safe;
}

function sentGoalKey(goal: AnalyticsGoal, dedupeKey?: string) {
  return `${goal}:${dedupeKey ?? "default"}`;
}

function wasGoalSent(goal: AnalyticsGoal, dedupeKey?: string) {
  if (!canUseBrowserStorage()) return false;

  try {
    const raw = window.sessionStorage.getItem(SENT_GOALS_STORAGE_KEY);
    const sent = raw ? (JSON.parse(raw) as string[]) : [];
    return sent.includes(sentGoalKey(goal, dedupeKey));
  } catch {
    return false;
  }
}

function rememberGoal(goal: AnalyticsGoal, dedupeKey?: string) {
  if (!canUseBrowserStorage()) return;

  try {
    const raw = window.sessionStorage.getItem(SENT_GOALS_STORAGE_KEY);
    const sent = raw ? (JSON.parse(raw) as string[]) : [];
    const key = sentGoalKey(goal, dedupeKey);

    if (!sent.includes(key)) {
      window.sessionStorage.setItem(
        SENT_GOALS_STORAGE_KEY,
        JSON.stringify([...sent.slice(-100), key]),
      );
    }
  } catch {
  }
}

export function trackGoal(
  goal: AnalyticsGoal,
  params: Record<string, unknown> = {},
  options: { dedupeKey?: string; once?: boolean } = {},
) {
  if (!hasCookieConsent()) return;
  if (!metrikaGoals.has(goal)) return;

  if (options.once && wasGoalSent(goal, options.dedupeKey)) {
    return;
  }

  const payload = sanitizeGoalParams(params);
  const counterId = getMetrikaCounterId();

  if (counterId && typeof window.ym === "function") {
    window.ym(counterId, "reachGoal", goal, payload);
  }

  rememberGoal(goal, options.dedupeKey);
}

export function trackInternalEvent(
  eventType: string,
  params: Record<string, unknown> = {},
) {
  if (!hasCookieConsent()) return;

  void fetch("/api/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    keepalive: true,
    body: JSON.stringify({
      eventType,
      path: window.location.pathname + window.location.search,
      title: document.title,
      referrer: document.referrer,
      visitorId: getVisitorId(),
      sessionId: getSessionId(),
      attribution: getAttribution(),
      ...params,
    }),
  });
}
