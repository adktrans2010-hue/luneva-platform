"use client";

import { FormEvent, useState } from "react";
import { adminFetch } from "@/src/lib/admin-fetch";

export default function AdminPasswordPage() {
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const response = await adminFetch("/api/admin/password", { method: "POST", body: new FormData(event.currentTarget) });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      setError("Не удалось изменить пароль. Проверьте введённые данные.");
      return;
    }
    window.location.assign(payload?.next ?? "/admin/mfa-enroll");
  }
  return (
    <main className="mx-auto min-h-screen max-w-xl px-4 py-16">
      <div className="rounded-[2rem] border border-[#ead7d1] bg-white p-8 shadow-sm">
        <p className="text-sm uppercase tracking-[0.2em] text-[#9a5d50]">Luneva Admin</p>
        <h1 className="mt-3 text-3xl text-[#332725]">Установите новый пароль</h1>
        <p className="mt-4 text-[#5f5552]">Временный пароль необходимо заменить перед доступом к админке.</p>
        {error && <p role="alert" className="mt-4 text-[#8b3f32]">{error}</p>}
        <form onSubmit={submit} className="mt-8 grid gap-5">
          <label className="grid gap-2 text-[#5f5552]">Текущий пароль<input name="currentPassword" type="password" required autoComplete="current-password" className="rounded-xl border border-[#ead7d1] px-4 py-3" /></label>
          <label className="grid gap-2 text-[#5f5552]">Новый пароль<input name="newPassword" type="password" required minLength={12} autoComplete="new-password" className="rounded-xl border border-[#ead7d1] px-4 py-3" /></label>
          <button className="rounded-xl bg-[#c98778] px-6 py-3 text-white">Сохранить пароль</button>
        </form>
      </div>
    </main>
  );
}
