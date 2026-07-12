"use client";

import { useEffect, useState } from "react";

type SeoPage = {
  id: string;
  path: string;
  title: string;
  description: string;
  canonical: string | null;
  structuredData: string | null;
  includeInSitemap: boolean;
  noindex: boolean;
  priority: string;
  changeFrequency: string;
  createdAt: string;
  updatedAt: string;
};

type SeoDraft = Omit<SeoPage, "id" | "createdAt" | "updatedAt">;

const emptyDraft: SeoDraft = {
  path: "",
  title: "",
  description: "",
  canonical: "",
  structuredData: "",
  includeInSitemap: true,
  noindex: false,
  priority: "0.7",
  changeFrequency: "monthly",
};

const frequencyOptions = [
  { value: "weekly", label: "Еженедельно" },
  { value: "monthly", label: "Ежемесячно" },
  { value: "yearly", label: "Ежегодно" },
];

export default function AdminSeo() {
  const [pages, setPages] = useState<SeoPage[]>([]);
  const [draft, setDraft] = useState<SeoDraft>(emptyDraft);
  const [openedId, setOpenedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadPages() {
    const response = await fetch("/api/admin/seo");
    const data = (await response.json()) as SeoPage[];

    setPages(data);
    setLoading(false);
  }

  async function createPage() {
    setSaving(true);
    setError(null);

    const response = await fetch("/api/admin/seo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });

    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      setError(data.error ?? "Не удалось сохранить SEO-настройки.");
      setSaving(false);
      return;
    }

    setDraft(emptyDraft);
    setSaving(false);
    await loadPages();
  }

  async function updatePage(page: SeoPage) {
    setError(null);

    const response = await fetch(`/api/admin/seo/${page.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(page),
    });

    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      setError(data.error ?? "Не удалось сохранить изменения.");
      return;
    }

    await loadPages();
  }

  async function deletePage(id: string) {
    const confirmed = window.confirm("Удалить SEO-настройки этой страницы?");
    if (!confirmed) return;

    await fetch(`/api/admin/seo/${id}`, { method: "DELETE" });
    await loadPages();
  }

  function updateLocalPage(id: string, patch: Partial<SeoPage>) {
    setPages((current) =>
      current.map((page) => (page.id === id ? { ...page, ...patch } : page))
    );
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadPages();
  }, []);

  if (loading) {
    return (
      <section className="px-6 py-16">
        <div className="mx-auto max-w-7xl text-[#332725]">Загрузка...</div>
      </section>
    );
  }

  return (
    <section className="px-6 py-16">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-[2rem] border border-[#ead7d1] bg-white p-8 shadow-sm">
          <h2 className="font-serif text-4xl text-[#332725]">
            Новая SEO-страница
          </h2>

          <SeoFields
            value={draft}
            onChange={(patch) =>
              setDraft((current) => ({ ...current, ...patch }))
            }
          />

          {error && (
            <p className="mt-4 rounded-2xl bg-[#fff3df] px-4 py-3 text-sm text-[#9a5a1f]">
              {error}
            </p>
          )}

          <button
            onClick={createPage}
            disabled={saving}
            className="mt-6 rounded-2xl bg-[#332725] px-6 py-3 text-white disabled:opacity-60"
          >
            {saving ? "Сохраняю..." : "Добавить страницу"}
          </button>
        </div>

        <h2 className="mt-14 font-serif text-4xl text-[#332725]">
          SEO-настройки страниц
        </h2>

        <div className="mt-8 grid gap-6">
          {pages.map((page) => {
            const isOpen = openedId === page.id;

            return (
              <article
                key={page.id}
                className="rounded-[2rem] border border-[#ead7d1] bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-[#fff8f6] px-3 py-1 text-sm text-[#c98778]">
                        {page.path}
                      </span>
                      <span
                        className={
                          page.noindex
                            ? "rounded-full bg-[#ffe2c2] px-3 py-1 text-sm text-[#9a5a1f]"
                            : "rounded-full bg-[#edf7ed] px-3 py-1 text-sm text-[#5f8a5f]"
                        }
                      >
                        {page.noindex ? "Не индексировать" : "Индексировать"}
                      </span>
                      {page.includeInSitemap && !page.noindex && (
                        <span className="rounded-full bg-[#edf7ed] px-3 py-1 text-sm text-[#5f8a5f]">
                          В карте сайта
                        </span>
                      )}
                    </div>

                    <h3 className="mt-4 text-2xl font-medium text-[#332725]">
                      {page.title}
                    </h3>

                    <p className="mt-2 max-w-3xl text-[#5f5552]">
                      {page.description}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => setOpenedId(isOpen ? null : page.id)}
                      className="rounded-xl border border-[#332725] px-4 py-2 text-sm text-[#332725]"
                    >
                      {isOpen ? "Свернуть" : "Открыть"}
                    </button>

                    <button
                      onClick={() => deletePage(page.id)}
                      className="rounded-xl border border-[#b94a48] px-4 py-2 text-sm text-[#b94a48]"
                    >
                      Удалить
                    </button>
                  </div>
                </div>

                {isOpen && (
                  <div className="mt-6 border-t border-[#ead7d1] pt-6">
                    <SeoFields
                      value={page}
                      onChange={(patch) => updateLocalPage(page.id, patch)}
                    />

                    <button
                      onClick={() => updatePage(page)}
                      className="mt-5 rounded-2xl border border-[#332725] px-5 py-3 text-[#332725]"
                    >
                      Сохранить изменения
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function SeoFields({
  value,
  onChange,
}: {
  value: SeoDraft;
  onChange: (patch: Partial<SeoDraft>) => void;
}) {
  return (
    <>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <input
          value={value.path}
          onChange={(event) => onChange({ path: event.target.value })}
          className="rounded-2xl border border-[#ead7d1] px-4 py-3"
          placeholder="Адрес страницы, например /contacts"
        />

        <input
          value={value.canonical ?? ""}
          onChange={(event) => onChange({ canonical: event.target.value })}
          className="rounded-2xl border border-[#ead7d1] px-4 py-3"
          placeholder="Канонический адрес, если отличается"
        />
      </div>

      <input
        value={value.title}
        onChange={(event) => onChange({ title: event.target.value })}
        className="mt-4 w-full rounded-2xl border border-[#ead7d1] px-4 py-3"
        placeholder="SEO-заголовок"
      />

      <textarea
        value={value.description}
        onChange={(event) => onChange({ description: event.target.value })}
        rows={3}
        className="mt-4 w-full rounded-2xl border border-[#ead7d1] px-4 py-3"
        placeholder="SEO-описание"
      />

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <select
          value={value.changeFrequency}
          onChange={(event) => onChange({ changeFrequency: event.target.value })}
          className="rounded-2xl border border-[#ead7d1] bg-white px-4 py-3"
        >
          {frequencyOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <input
          value={value.priority}
          onChange={(event) => onChange({ priority: event.target.value })}
          className="rounded-2xl border border-[#ead7d1] px-4 py-3"
          placeholder="Приоритет sitemap, 0.7"
        />

        <label className="flex items-center gap-3 rounded-2xl border border-[#ead7d1] px-4 py-3 text-[#5f5552]">
          <input
            type="checkbox"
            checked={value.includeInSitemap}
            onChange={(event) =>
              onChange({ includeInSitemap: event.target.checked })
            }
            className="h-5 w-5"
          />
          Добавить в карту сайта
        </label>
      </div>

      <label className="mt-4 flex items-center gap-3 rounded-2xl border border-[#ead7d1] px-4 py-3 text-[#5f5552]">
        <input
          type="checkbox"
          checked={value.noindex}
          onChange={(event) => onChange({ noindex: event.target.checked })}
          className="h-5 w-5"
        />
        Не индексировать эту страницу
      </label>

      <textarea
        value={value.structuredData ?? ""}
        onChange={(event) => onChange({ structuredData: event.target.value })}
        rows={8}
        className="mt-4 w-full rounded-2xl border border-[#ead7d1] px-4 py-3 font-mono text-sm"
        placeholder="Микроразметка JSON-LD"
      />
    </>
  );
}
