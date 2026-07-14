"use client";

import { useEffect, useState } from "react";

import { adminFetch } from "@/src/lib/admin-fetch";

type PricingItem = {
  id: string;
  title: string;
  consultationType: string;
  format: string;
  duration: string;
  price: number;
  oldPrice: number | null;
  description: string;
  buttonText: string;
  published: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

type PricingDraft = Omit<PricingItem, "id" | "createdAt" | "updatedAt">;

const emptyDraft: PricingDraft = {
  title: "",
  consultationType: "",
  format: "Онлайн",
  duration: "50 минут",
  price: 0,
  oldPrice: null,
  description: "",
  buttonText: "Записаться",
  published: true,
  sortOrder: 0,
};

export default function AdminPricing() {
  const [items, setItems] = useState<PricingItem[]>([]);
  const [draft, setDraft] = useState<PricingDraft>(emptyDraft);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [openedId, setOpenedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadItems() {
    const response = await adminFetch("/api/admin/pricing");
    const data = (await response.json()) as PricingItem[];

    setItems(data);
    setLoading(false);
  }

  async function createItem() {
    setSaving(true);
    setError(null);

    const response = await adminFetch("/api/admin/pricing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });

    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      setError(data.error ?? "Не удалось сохранить стоимость.");
      setSaving(false);
      return;
    }

    setDraft(emptyDraft);
    setSaving(false);
    await loadItems();
  }

  async function updateItem(item: PricingItem) {
    setError(null);

    const response = await adminFetch(`/api/admin/pricing/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    });

    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      setError(data.error ?? "Не удалось сохранить изменения.");
      return;
    }

    await loadItems();
  }

  async function deleteItem(id: string) {
    const confirmed = window.confirm("Удалить эту карточку стоимости?");
    if (!confirmed) return;

    await adminFetch(`/api/admin/pricing/${id}`, { method: "DELETE" });
    await loadItems();
  }

  function updateLocalItem(id: string, patch: Partial<PricingItem>) {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item))
    );
  }

  useEffect(() => {
    const controller = new AbortController();

    void adminFetch("/api/admin/pricing", { signal: controller.signal })
      .then((response) => response.json())
      .then((data: PricingItem[]) => {
        setItems(data);
        setLoading(false);
      })
      .catch((fetchError: unknown) => {
        if (fetchError instanceof DOMException && fetchError.name === "AbortError") {
          return;
        }

        setLoading(false);
      });

    return () => controller.abort();
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
            Новая услуга
          </h2>

          <PricingFields
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
            onClick={createItem}
            disabled={saving}
            className="mt-6 rounded-2xl bg-[#332725] px-6 py-3 text-white disabled:opacity-60"
          >
            {saving ? "Сохраняю..." : "Добавить услугу"}
          </button>
        </div>

        <h2 className="mt-14 font-serif text-4xl text-[#332725]">
          Управление услугами
        </h2>

        <div className="mt-8 grid gap-6">
          {items.map((item) => {
            const isOpen = openedId === item.id;

            return (
              <article
                key={item.id}
                className="rounded-[2rem] border border-[#ead7d1] bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                  <div>
                    <span
                      className={
                        item.published
                          ? "rounded-full bg-[#edf7ed] px-3 py-1 text-sm text-[#5f8a5f]"
                          : "rounded-full bg-[#ffe2c2] px-3 py-1 text-sm text-[#9a5a1f]"
                      }
                    >
                      {item.published ? "На сайте" : "Скрыта"}
                    </span>

                    <h3 className="mt-4 text-2xl font-medium text-[#332725]">
                      {item.title}
                    </h3>

                    <p className="mt-2 text-[#5f5552]">
                      {item.format} · {item.duration} · {item.price} руб.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() =>
                        updateItem({ ...item, published: !item.published })
                      }
                      className="rounded-xl bg-[#332725] px-4 py-2 text-sm text-white"
                    >
                      {item.published ? "Скрыть" : "Показать"}
                    </button>

                    <button
                      onClick={() => setOpenedId(isOpen ? null : item.id)}
                      className="rounded-xl border border-[#332725] px-4 py-2 text-sm text-[#332725]"
                    >
                      {isOpen ? "Свернуть" : "Открыть"}
                    </button>

                    <button
                      onClick={() => deleteItem(item.id)}
                      className="rounded-xl border border-[#b94a48] px-4 py-2 text-sm text-[#b94a48]"
                    >
                      Удалить
                    </button>
                  </div>
                </div>

                {isOpen && (
                  <div className="mt-6 border-t border-[#ead7d1] pt-6">
                    <PricingFields
                      value={item}
                      onChange={(patch) => updateLocalItem(item.id, patch)}
                    />

                    <button
                      onClick={() => updateItem(item)}
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

function PricingFields({
  value,
  onChange,
}: {
  value: PricingDraft;
  onChange: (patch: Partial<PricingDraft>) => void;
}) {
  return (
    <>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <input
          value={value.title}
          onChange={(event) => onChange({ title: event.target.value })}
          className="rounded-2xl border border-[#ead7d1] px-4 py-3"
          placeholder="Название"
        />

        <input
          value={value.consultationType}
          onChange={(event) =>
            onChange({ consultationType: event.target.value })
          }
          className="rounded-2xl border border-[#ead7d1] px-4 py-3"
          placeholder="Вид консультации"
        />
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-4">
        <input
          value={value.format}
          onChange={(event) => onChange({ format: event.target.value })}
          className="rounded-2xl border border-[#ead7d1] px-4 py-3"
          placeholder="Формат"
        />

        <input
          value={value.duration}
          onChange={(event) => onChange({ duration: event.target.value })}
          className="rounded-2xl border border-[#ead7d1] px-4 py-3"
          placeholder="Длительность"
        />

        <input
          value={value.price || ""}
          onChange={(event) => onChange({ price: Number(event.target.value) })}
          type="number"
          className="rounded-2xl border border-[#ead7d1] px-4 py-3"
          placeholder="Цена"
        />

        <input
          value={value.oldPrice ?? ""}
          onChange={(event) =>
            onChange({
              oldPrice: event.target.value ? Number(event.target.value) : null,
            })
          }
          type="number"
          className="rounded-2xl border border-[#ead7d1] px-4 py-3"
          placeholder="Старая цена"
        />
      </div>

      <textarea
        value={value.description}
        onChange={(event) => onChange({ description: event.target.value })}
        rows={3}
        className="mt-4 w-full rounded-2xl border border-[#ead7d1] px-4 py-3"
        placeholder="Описание"
      />

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <input
          value={value.buttonText}
          onChange={(event) => onChange({ buttonText: event.target.value })}
          className="rounded-2xl border border-[#ead7d1] px-4 py-3"
          placeholder="Текст кнопки"
        />

        <input
          value={value.sortOrder}
          onChange={(event) =>
            onChange({ sortOrder: Number(event.target.value) || 0 })
          }
          type="number"
          className="rounded-2xl border border-[#ead7d1] px-4 py-3"
          placeholder="Порядок"
        />

        <label className="flex items-center gap-3 rounded-2xl border border-[#ead7d1] px-4 py-3 text-[#5f5552]">
          <input
            type="checkbox"
            checked={value.published}
            onChange={(event) => onChange({ published: event.target.checked })}
            className="h-5 w-5"
          />
          Показывать на сайте
        </label>
      </div>
    </>
  );
}
