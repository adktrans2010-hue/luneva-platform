"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";

export const COOKIE_CONSENT_KEY = "luneva_cookie_consent";
export const COOKIE_CONSENT_EVENT = "luneva:cookie-consent";

function subscribeToCookieConsent(callback: () => void) {
  window.addEventListener(COOKIE_CONSENT_EVENT, callback);
  window.addEventListener("storage", callback);

  return () => {
    window.removeEventListener(COOKIE_CONSENT_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

function getCookieConsentSnapshot() {
  return window.localStorage.getItem(COOKIE_CONSENT_KEY) === "accepted";
}

export default function CookieBanner() {
  const isAccepted = useSyncExternalStore(
    subscribeToCookieConsent,
    getCookieConsentSnapshot,
    () => true,
  );

  const acceptCookies = () => {
    window.localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
    window.dispatchEvent(new Event(COOKIE_CONSENT_EVENT));
  };

  if (isAccepted) return null;

  return (
    <aside
      className="fixed right-4 bottom-4 left-4 z-[100] mx-auto max-w-5xl rounded-[1.75rem] border border-[#dec4bd] bg-[#fff8f6]/95 p-5 shadow-[0_24px_80px_rgba(51,39,37,0.18)] backdrop-blur-xl sm:p-6"
      role="dialog"
      aria-label="Уведомление об использовании файлов Cookie"
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <p className="max-w-3xl text-sm leading-6 text-[#5f5552] sm:text-base sm:leading-7">
          Мы используем файлы Cookie для корректной работы сайта, обеспечения
          безопасности и анализа посещаемости. Продолжая пользоваться сайтом,
          вы соглашаетесь с использованием Cookie в соответствии с нашей{" "}
          <Link href="/cookies" className="text-[#9f665a] underline underline-offset-4">
            Политикой использования файлов Cookie
          </Link>
          .
        </p>

        <div className="flex shrink-0 flex-wrap gap-3">
          <Link
            href="/cookies"
            className="rounded-xl border border-[#c98778] px-5 py-3 text-sm text-[#332725]"
          >
            Настройки Cookie
          </Link>
          <button
            type="button"
            onClick={acceptCookies}
            className="rounded-xl bg-[#332725] px-6 py-3 text-sm text-white shadow-lg"
          >
            Принять
          </button>
        </div>
      </div>
    </aside>
  );
}
