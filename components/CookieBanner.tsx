"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";

import {
  COOKIE_CONSENT_EVENT,
  COOKIE_SETTINGS_EVENT,
  readCookieConsent,
  saveCookieConsent,
  type CookieConsentDecision,
} from "@/src/lib/cookie-consent";

function subscribeToCookieConsent(callback: () => void) {
  window.addEventListener(COOKIE_CONSENT_EVENT, callback);
  window.addEventListener("storage", callback);

  return () => {
    window.removeEventListener(COOKIE_CONSENT_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

function getCookieConsentSnapshot() {
  return readCookieConsent(window.localStorage);
}

export default function CookieBanner() {
  const decision = useSyncExternalStore(
    subscribeToCookieConsent,
    getCookieConsentSnapshot,
    () => null,
  );
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    const openSettings = () => setSettingsOpen(true);
    window.addEventListener(COOKIE_SETTINGS_EVENT, openSettings);
    return () => window.removeEventListener(COOKIE_SETTINGS_EVENT, openSettings);
  }, []);

  const choose = (nextDecision: CookieConsentDecision) => {
    saveCookieConsent(nextDecision, window.localStorage, window);
    setSettingsOpen(false);
  };

  if (decision !== null && !settingsOpen) return null;

  return (
    <aside
      className="fixed right-4 bottom-4 left-4 z-[100] mx-auto max-w-5xl rounded-[1.75rem] border border-[#dec4bd] bg-[#fff8f6]/95 p-5 shadow-[0_24px_80px_rgba(51,39,37,0.18)] backdrop-blur-xl sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Настройки аналитических Cookie"
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <p className="max-w-3xl text-sm leading-6 text-[#5f5552] sm:text-base sm:leading-7">
          Обязательные Cookie обеспечивают работу сайта. С вашего согласия мы
          также используем Яндекс Метрику и Вебвизор для анализа посещений и
          эффективности рекламы. Содержимое полей форм маскируется.
        </p>

        <div className="flex shrink-0 flex-wrap gap-3">
          <Link
            href="/legal/cookies"
            className="rounded-xl border border-[#c98778] px-5 py-3 text-sm text-[#332725]"
          >
            Подробнее
          </Link>
          <button
            type="button"
            onClick={() => choose("rejected")}
            className="rounded-xl border border-[#332725] px-6 py-3 text-sm text-[#332725]"
          >
            Отклонить
          </button>
          <button
            type="button"
            onClick={() => choose("accepted")}
            className="rounded-xl bg-[#332725] px-6 py-3 text-sm text-white shadow-lg"
          >
            Принять
          </button>
        </div>
      </div>
    </aside>
  );
}
