"use client";

import { FormEvent, useEffect, useState } from "react";

type ClientPackage = {
  id: string;
  title: string;
  consultationFormat: "online" | "office";
  totalSessions: number;
  remainingSessions: number;
  status: string;
  paidAt: string | null;
  createdAt: string;
  userName: string | null;
  userEmail: string | null;
};

const formatLabels: Record<string, string> = {
  online: "Онлайн",
  office: "Очно в кабинете",
};

const statusLabels: Record<string, string> = {
  active: "Активен",
  used: "Использован",
  cancelled: "Отменен",
};

export default function AdminPackages() {
  const [packages, setPackages] = useState<ClientPackage[]>([]);
  const [email, setEmail] = useState("");
  const [title, setTitle] = useState("Пакет консультаций");
  const [consultationFormat, setConsultationFormat] = useState("online");
  const [totalSessions, setTotalSessions] = useState(7);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadPackages() {
    const response = await fetch("/api/admin/packages");
    const data = (await response.json()) as ClientPackage[];
    setPackages(data);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadPackages();
  }, []);

  async function submitPackage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const response = await fetch("/api/admin/packages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        title,
        consultationFormat,
        totalSessions,
      }),
    });

    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      setError(data.error ?? "Не удалось добавить пакет.");
      setSaving(false);
      return;
    }

    setEmail("");
    setTitle("Пакет консультаций");
    setTotalSessions(7);
    await loadPackages();
    setSaving(false);
  }

  return (
    <div className="grid gap-8">
      <form
        onSubmit={submitPackage}
        className="grid gap-4 rounded-[2rem] border border-[#ead7d1] bg-white p-6 shadow-sm md:grid-cols-2"
      >
        <div className="md:col-span-2">
          <h2 className="font-serif text-4xl text-[#332725]">
            Добавить оплаченный пакет
          </h2>
          <p className="mt-3 text-[#5f5552]">
            Клиент должен быть зарегистрирован в кабинете. Пакет появится у него
            сразу после сохранения.
          </p>
        </div>

        <input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="rounded-2xl border border-[#ead7d1] px-4 py-3"
          placeholder="Email клиента"
          required
        />

        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="rounded-2xl border border-[#ead7d1] px-4 py-3"
          placeholder="Название пакета"
          required
        />

        <select
          value={consultationFormat}
          onChange={(event) => setConsultationFormat(event.target.value)}
          className="rounded-2xl border border-[#ead7d1] bg-white px-4 py-3"
        >
          <option value="online">Онлайн</option>
          <option value="office">Очно в кабинете</option>
        </select>

        <input
          value={totalSessions}
          onChange={(event) => setTotalSessions(Number(event.target.value))}
          type="number"
          min={2}
          className="rounded-2xl border border-[#ead7d1] px-4 py-3"
          placeholder="Количество консультаций"
          required
        />

        {error && (
          <p className="rounded-2xl bg-[#fff3df] px-4 py-3 text-sm text-[#9a5a1f] md:col-span-2">
            {error}
          </p>
        )}

        <button
          disabled={saving}
          className="rounded-2xl bg-[#332725] px-6 py-3 text-white disabled:opacity-60 md:col-span-2"
        >
          {saving ? "Сохраняю..." : "Добавить пакет"}
        </button>
      </form>

      <div className="rounded-[2rem] border border-[#ead7d1] bg-white p-6 shadow-sm">
        <h2 className="font-serif text-4xl text-[#332725]">Пакеты клиентов</h2>

        <div className="mt-6 grid gap-4">
          {packages.length > 0 ? (
            packages.map((item) => (
              <article
                key={item.id}
                className="rounded-2xl border border-[#ead7d1] bg-[#fff8f6] p-5"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.18em] text-[#c98778]">
                      {formatLabels[item.consultationFormat]}
                    </p>
                    <h3 className="mt-2 text-2xl font-medium text-[#332725]">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-[#5f5552]">
                      {item.userName} · {item.userEmail}
                    </p>
                  </div>

                  <div className="text-[#5f5552] md:text-right">
                    <p className="text-lg text-[#332725]">
                      Осталось {item.remainingSessions} из {item.totalSessions}
                    </p>
                    <p className="mt-2">
                      {statusLabels[item.status] ?? item.status}
                    </p>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <p className="rounded-2xl bg-[#fff8f6] p-5 text-[#5f5552]">
              Пакетов пока нет.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
