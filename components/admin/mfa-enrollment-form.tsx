"use client";

import { FormEvent, useState } from "react";
import { adminFetch } from "@/src/lib/admin-fetch";

export function MfaEnrollmentForm() {
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("");
    const response = await adminFetch("/api/admin/mfa-enroll", { method: "POST", body: new FormData(event.currentTarget) });
    const payload = await response.json().catch(() => null);
    if (!response.ok) { setError("Код не подтверждён. Дождитесь нового кода и попробуйте снова."); return; }
    window.location.assign(payload?.next ?? "/admin/ai/knowledge");
  }
  return (
    <form onSubmit={submit} className="mt-6 grid gap-4 text-left">
      {error && <p role="alert" className="text-[#8b3f32]">{error}</p>}
      <label className="grid gap-2 text-[#5f5552]">Первый шестизначный код<input name="totpCode" inputMode="numeric" pattern="[0-9]{6}" required autoComplete="one-time-code" className="rounded-xl border border-[#ead7d1] px-4 py-3" /></label>
      <button className="rounded-xl bg-[#c98778] px-6 py-3 text-white">Подтвердить и войти</button>
    </form>
  );
}
