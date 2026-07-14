"use client";

import { useEffect, useState } from "react";

type SitePage = {
  id: string;
  path: string;
  eyebrow: string | null;
  title: string;
  intro: string;
  content: string;
  published: boolean;
};
type PageDraft = Omit<SitePage, "id">;
const emptyDraft: PageDraft = { path: "", eyebrow: "", title: "", intro: "", content: "", published: false };

export default function AdminSitePages() {
  const [pages, setPages] = useState<SitePage[]>([]);
  const [draft, setDraft] = useState<PageDraft>(emptyDraft);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openedId, setOpenedId] = useState<string | null>(null);

  async function load() {
    const response = await fetch("/api/admin/pages");
    setPages((await response.json()) as SitePage[]);
    setLoading(false);
  }
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, []);

  async function save(url: string, method: "POST" | "PATCH", value: PageDraft) {
    setError(null);
    const response = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(value) });
    if (!response.ok) {
      const body = (await response.json()) as { error?: string };
      setError(body.error ?? "Не удалось сохранить страницу.");
      return false;
    }
    await load();
    return true;
  }

  if (loading) return <section className="px-6 py-16"><div className="mx-auto max-w-7xl">Загрузка...</div></section>;

  return (
    <section className="px-6 py-16">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-[2rem] border border-[#ead7d1] bg-white p-8 shadow-sm">
          <h2 className="font-serif text-4xl text-[#332725]">Новая страница</h2>
          <p className="mt-3 text-[#5f5552]">Создавайте отдельные информационные страницы. SEO для адреса настраивается в разделе «Редактор SEO».</p>
          <PageFields value={draft} onChange={(patch) => setDraft((current) => ({ ...current, ...patch }))} />
          {error && <p className="mt-4 rounded-2xl bg-[#fff3df] px-4 py-3 text-sm text-[#9a5a1f]">{error}</p>}
          <button onClick={async () => { if (await save("/api/admin/pages", "POST", draft)) setDraft(emptyDraft); }} className="mt-6 rounded-2xl bg-[#332725] px-6 py-3 text-white">Создать страницу</button>
        </div>

        <h2 className="mt-14 font-serif text-4xl text-[#332725]">Страницы сайта</h2>
        <div className="mt-8 grid gap-6">
          {pages.map((page) => {
            const opened = openedId === page.id;
            return (
              <article key={page.id} className="rounded-[2rem] border border-[#ead7d1] bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div><span className={page.published ? "rounded-full bg-[#edf7ed] px-3 py-1 text-sm text-[#5f8a5f]" : "rounded-full bg-[#ffe2c2] px-3 py-1 text-sm text-[#9a5a1f]"}>{page.published ? "Опубликована" : "Черновик"}</span><h3 className="mt-4 text-2xl font-medium text-[#332725]">{page.title}</h3><p className="mt-2 text-[#c98778]">{page.path}</p></div>
                  <div className="flex gap-3"><button onClick={() => setOpenedId(opened ? null : page.id)} className="rounded-xl border border-[#332725] px-4 py-2 text-sm">{opened ? "Свернуть" : "Редактировать"}</button><button onClick={async () => { if (!window.confirm("Удалить страницу?")) return; await fetch(`/api/admin/pages/${page.id}`, { method: "DELETE" }); await load(); }} className="rounded-xl border border-[#b94a48] px-4 py-2 text-sm text-[#b94a48]">Удалить</button></div>
                </div>
                {opened && <div className="mt-6 border-t border-[#ead7d1] pt-6"><PageFields value={page} onChange={(patch) => setPages((current) => current.map((entry) => entry.id === page.id ? { ...entry, ...patch } : entry))} /><button onClick={() => save(`/api/admin/pages/${page.id}`, "PATCH", page)} className="mt-5 rounded-2xl border border-[#332725] px-5 py-3">Сохранить изменения</button></div>}
              </article>
            );
          })}
          {pages.length === 0 && <p className="text-[#5f5552]">Дополнительных страниц пока нет.</p>}
        </div>
      </div>
    </section>
  );
}

function PageFields({ value, onChange }: { value: PageDraft; onChange: (patch: Partial<PageDraft>) => void }) {
  return <div className="mt-6 grid gap-4"><div className="grid gap-4 md:grid-cols-2"><input value={value.path} onChange={(event) => onChange({ path: event.target.value })} className="rounded-2xl border border-[#ead7d1] px-4 py-3" placeholder="Адрес, например /cooperation" /><input value={value.eyebrow ?? ""} onChange={(event) => onChange({ eyebrow: event.target.value })} className="rounded-2xl border border-[#ead7d1] px-4 py-3" placeholder="Надпись над заголовком" /></div><input value={value.title} onChange={(event) => onChange({ title: event.target.value })} className="rounded-2xl border border-[#ead7d1] px-4 py-3" placeholder="Заголовок страницы" /><textarea value={value.intro} onChange={(event) => onChange({ intro: event.target.value })} rows={3} className="rounded-2xl border border-[#ead7d1] px-4 py-3" placeholder="Краткое вступление" /><textarea value={value.content} onChange={(event) => onChange({ content: event.target.value })} rows={12} className="rounded-2xl border border-[#ead7d1] px-4 py-3" placeholder="Основной текст. Разделяйте абзацы пустой строкой." /><label className="flex items-center gap-3 rounded-2xl border border-[#ead7d1] px-4 py-3 text-[#5f5552]"><input type="checkbox" checked={value.published} onChange={(event) => onChange({ published: event.target.checked })} className="h-5 w-5" />Опубликовать страницу</label></div>;
}
