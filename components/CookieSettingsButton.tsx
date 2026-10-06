"use client";

import { openCookieSettings } from "@/src/lib/cookie-consent";

export default function CookieSettingsButton() {
  return (
    <button
      type="button"
      onClick={() => openCookieSettings(window)}
      className="text-left hover:text-[#332725]"
    >
      Настройки Cookie
    </button>
  );
}
