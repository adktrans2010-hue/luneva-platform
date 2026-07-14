"use client";

import { useEffect, useState } from "react";

import { adminFetch } from "@/src/lib/admin-fetch";

type FaqItem = {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  published: boolean;
  sortOrder: number;
};

type FaqDraft = Omit<FaqItem, "id">;
const emptyDraft: FaqDraft = {
  question: "",
  answer: "",
  category: "",
  published: true,
  sortOrder: 0,
};

export default function AdminFaq() {
  const [items, setItems] = useState<FaqItem[]>([]);
  const [draft, setDraft] = useState<FaqDraft>(emptyDraft);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const response = await adminFetch("/api/admin/faq");
    setItems((await response.json()) as FaqItem[]);
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, []);

  async function save(url: string, method: "POST" | "PATCH", value: FaqDraft) {
    setError(null);
    const response = await adminFetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(value),
    });
    if (!response.ok) {
      const body = (await response.json()) as { error?: string };
      setError(body.error ?? "Не удалось сохранить FAQ.");
      return false;
    }
    await load();
    return true;
  }

  if (loading) return <AdminLoading />;

  return (
    <section className="px-6 py-16">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-[2rem] border border-[#ead7d1] bg-white p-8 shadow-sm">
          <h2 className="font-serif text-4xl text-[#332725]">Новый вопрос</h2>
          <FaqFields value={draft} onChange={(patch) => setDraft((current) => ({ ...current, ...patch }))} />
          <ErrorMessage error={error} />
          <button
            onClick={async () => {
              if (await save("/api/admin/faq", "POST", draft)) setDraft(emptyDraft);
            }}
            className="mt-6 rounded-2xl bg-[#332725] px-6 py-3 text-white"
          >
            Добавить вопрос
          </button>
        </div>

        <h2 className="mt-14 font-serif text-4xl text-[#332725]">Вопросы на сайте</h2>
        <div className="mt-8 grid gap-6">
          {items.map((item) => (
            <article key={item.id} className="rounded-[2rem] border border-[#ead7d1] bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <span className={item.published ? "rounded-full bg-[#edf7ed] px-3 py-1 text-sm text-[#5f8a5f]" : "rounded-full bg-[#ffe2c2] px-3 py-1 text-sm text-[#9a5a1f]"}>
                  {item.published ? "На сайте" : "Скрыт"}
                </span>
                <button
                  onClick={async () => {
                    if (!window.confirm("Удалить этот вопрос?")) return;
                    await adminFetch(`/api/admin/faq/${item.id}`, { method: "DELETE" });
                    await load();
                  }}
                  className="rounded-xl border border-[#b94a48] px-4 py-2 text-sm text-[#b94a48]"
                >Удалить</button>
              </div>
              <FaqFields
                value={item}
                onChange={(patch) => setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, ...patch } : entry))}
              />
              <button onClick={() => save(`/api/admin/faq/${item.id}`, "PATCH", item)} className="mt-5 rounded-2xl border border-[#332725] px-5 py-3 text-[#332725]">
                Сохранить изменения
              </button>
            </article>
          ))}
          {items.length === 0 && <p className="text-[#5f5552]">Вопросов пока нет.</p>}
        </div>
      </div>
    </section>
  );
}

function FaqFields({ value, onChange }: { value: FaqDraft; onChange: (patch: Partial<FaqDraft>) => void }) {
  return (
    <div className="mt-6 grid gap-4">
      <input value={value.question} onChange={(event) => onChange({ question: event.target.value })} className="rounded-2xl border border-[#ead7d1] px-4 py-3" placeholder="Вопрос" />
      <textarea value={value.answer} onChange={(event) => onChange({ answer: event.target.value })} rows={4} className="rounded-2xl border border-[#ead7d1] px-4 py-3" placeholder="Ответ" />
      <div className="grid gap-4 md:grid-cols-3">
        <input value={value.category ?? ""} onChange={(event) => onChange({ category: event.target.value })} className="rounded-2xl border border-[#ead7d1] px-4 py-3" placeholder="Категория (необязательно)" />
        <input type="number" value={value.sortOrder} onChange={(event) => onChange({ sortOrder: Number(event.target.value) || 0 })} className="rounded-2xl border border-[#ead7d1] px-4 py-3" placeholder="Порядок" />
        <label className="flex items-center gap-3 rounded-2xl border border-[#ead7d1] px-4 py-3 text-[#5f5552]"><input type="checkbox" checked={value.published} onChange={(event) => onChange({ published: event.target.checked })} className="h-5 w-5" />Показывать на сайте</label>
      </div>
    </div>
  );
}

function AdminLoading() {
  return <section className="px-6 py-16"><div className="mx-auto max-w-7xl">Загрузка...</div></section>;
}

function ErrorMessage({ error }: { error: string | null }) {
  return error ? <p className="mt-4 rounded-2xl bg-[#fff3df] px-4 py-3 text-sm text-[#9a5a1f]">{error}</p> : null;
}
