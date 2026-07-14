import Link from "next/link";

import { getRecentLoginAudit } from "@/src/lib/login-audit";

export const dynamic = "force-dynamic";

const reasonLabels: Record<string, string> = {
  password: "Пароль",
  google_oauth: "Google OAuth",
  invalid_credentials: "Неверные данные",
  invalid_2fa: "Неверный код 2FA",
  rate_limited: "Временная блокировка",
  google_email_denied: "Google-аккаунт без доступа",
  google_state_or_code: "Ошибка проверки Google OAuth",
  google_error: "Ошибка Google OAuth",
};

export default async function AdminLoginHistoryPage() {
  const logs = await getRecentLoginAudit(100);

  return (
    <section className="bg-[#fff8f6] px-6 py-20">
      <div className="mx-auto max-w-7xl">
        <Link href="/admin" className="text-[#c98778]">← Назад в админку</Link>
        <p className="mt-8 mb-4 text-sm uppercase tracking-[0.25em] text-[#c98778]">Безопасность</p>
        <h1 className="font-serif text-5xl text-[#332725]">Журнал входов</h1>
        <p className="mt-6 max-w-3xl text-lg leading-8 text-[#5f5552]">Последние 100 успешных и неуспешных входов. Записи автоматически удаляются через 90 дней.</p>

        <div className="mt-10 overflow-x-auto rounded-[2rem] border border-[#ead7d1] bg-white shadow-sm">
          <table className="w-full min-w-[900px] text-left">
            <thead className="border-b border-[#ead7d1] bg-[#fff8f6] text-sm uppercase tracking-[0.12em] text-[#8a7a76]">
              <tr><th className="px-5 py-4">Дата</th><th className="px-5 py-4">Раздел</th><th className="px-5 py-4">Email</th><th className="px-5 py-4">IP</th><th className="px-5 py-4">Результат</th><th className="px-5 py-4">Способ / причина</th></tr>
            </thead>
            <tbody className="divide-y divide-[#ead7d1] text-[#5f5552]">
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="whitespace-nowrap px-5 py-4">{log.createdAt.toLocaleString("ru-RU", { timeZone: "Europe/Moscow" })}</td>
                  <td className="px-5 py-4">{log.actorType === "admin" ? "Админка" : "Кабинет"}</td>
                  <td className="px-5 py-4">{log.email}</td>
                  <td className="px-5 py-4 font-mono text-sm">{log.ipAddress}</td>
                  <td className="px-5 py-4"><span className={log.success ? "rounded-full bg-[#edf7ed] px-3 py-1 text-sm text-[#5f8a5f]" : "rounded-full bg-[#ffe2c2] px-3 py-1 text-sm text-[#9a5a1f]"}>{log.success ? "Успешно" : "Отклонено"}</span></td>
                  <td className="px-5 py-4">{reasonLabels[log.reason] ?? log.reason}</td>
                </tr>
              ))}
              {logs.length === 0 && <tr><td colSpan={6} className="px-5 py-10 text-center text-[#8a7a76]">Записей пока нет.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
