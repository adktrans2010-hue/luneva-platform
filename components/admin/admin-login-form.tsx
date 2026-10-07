"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";

type LoginValues = {
  email: string;
  password: string;
  totpCode: string;
};

const emptyValues: LoginValues = { email: "", password: "", totpCode: "" };
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;
const totpPattern = /^\d{6}$/u;

export function AdminLoginForm({ nextPath }: { nextPath: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [values, setValues] = useState<LoginValues>(emptyValues);

  const syncFromDom = useCallback(() => {
    const form = formRef.current;
    if (!form) return;

    const formData = new FormData(form);
    setValues({
      email: String(formData.get("email") ?? "").trim(),
      password: String(formData.get("password") ?? ""),
      totpCode: String(formData.get("totpCode") ?? ""),
    });
  }, []);

  useEffect(() => {
    // Password managers can populate fields after hydration without a React change event.
    // Re-read the native form briefly so that the submit state reflects those values too.
    const timers = [0, 100, 400].map((delay) => window.setTimeout(syncFromDom, delay));
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [syncFromDom]);

  const emailValid = emailPattern.test(values.email);
  const passwordPresent = values.password.length > 0;
  const totpValid = totpPattern.test(values.totpCode);
  const canSubmit = emailValid && passwordPresent && totpValid;

  function normalizeTotp(event: FormEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const normalized = input.value.replace(/\D/gu, "").slice(0, 6);
    if (input.value !== normalized) input.value = normalized;
    syncFromDom();
  }

  function validateBeforeSubmit(event: FormEvent<HTMLFormElement>) {
    syncFromDom();
    const form = event.currentTarget;
    const email = String(new FormData(form).get("email") ?? "").trim();
    const password = String(new FormData(form).get("password") ?? "");
    const totpCode = String(new FormData(form).get("totpCode") ?? "");
    if (emailPattern.test(email) && password.length > 0 && totpPattern.test(totpCode)) return;

    event.preventDefault();
    const invalidField = !emailPattern.test(email)
      ? form.elements.namedItem("email")
      : password.length === 0
        ? form.elements.namedItem("password")
        : form.elements.namedItem("totpCode");
    if (invalidField instanceof HTMLElement) invalidField.focus();
  }

  return (
    <form
      ref={formRef}
      action="/api/admin/login"
      method="post"
      className="rounded-[2rem] border border-[#ead7d1] bg-white p-8 shadow-sm"
      onInput={syncFromDom}
      onChange={syncFromDom}
      onBlur={syncFromDom}
      onSubmit={validateBeforeSubmit}
    >
      <input type="hidden" name="next" value={nextPath} />

      <label htmlFor="admin-email" className="block text-sm uppercase tracking-[0.18em] text-[#8a7a76]">
        Email администратора
      </label>
      <input
        id="admin-email"
        name="email"
        type="email"
        autoComplete="email"
        className="mt-3 w-full rounded-2xl border border-[#ead7d1] px-4 py-3 text-[#332725] outline-none transition focus:border-[#c98778]"
        required
      />

      <label htmlFor="admin-password" className="mt-5 block text-sm uppercase tracking-[0.18em] text-[#8a7a76]">
        Пароль
      </label>
      <input
        id="admin-password"
        name="password"
        type="password"
        autoComplete="current-password"
        className="mt-3 w-full rounded-2xl border border-[#ead7d1] px-4 py-3 text-[#332725] outline-none transition focus:border-[#c98778]"
        required
      />

      <label htmlFor="admin-totp" className="mt-5 block text-sm uppercase tracking-[0.18em] text-[#8a7a76]">
        Код Google Authenticator
      </label>
      <input
        id="admin-totp"
        name="totpCode"
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9]{6}"
        maxLength={6}
        aria-describedby={values.totpCode.length > 0 && !totpValid ? "admin-totp-error" : undefined}
        placeholder="6 цифр"
        className="mt-3 w-full rounded-2xl border border-[#ead7d1] px-4 py-3 text-[#332725] outline-none transition focus:border-[#c98778]"
        required
        onInput={normalizeTotp}
      />
      {values.totpCode.length > 0 && !totpValid ? (
        <p id="admin-totp-error" role="alert" className="mt-2 text-sm text-[#9a5a1f]">
          Введите шестизначный код из приложения-аутентификатора.
        </p>
      ) : null}

      <button
        type="submit"
        disabled={!canSubmit}
        className="mt-6 w-full rounded-2xl bg-[#332725] px-5 py-3 text-white transition hover:bg-[#4a3935] disabled:cursor-not-allowed disabled:opacity-50"
      >
        Войти
      </button>
    </form>
  );
}
