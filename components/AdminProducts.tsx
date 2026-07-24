"use client";

import { useEffect, useState } from "react";

import { adminFetch } from "@/src/lib/admin-fetch";
import { formatKopeks } from "@/src/lib/consultation-product-shared";

type ProductItem = {
  id: string;
  code: string;
  name: string;
  shortDescription: string | null;
  fullDescription: string | null;
  sessionsCount: number;
  priceKopeks: number;
  durationMinutes: number;
  isActive: boolean;
  isPublic: boolean;
  sortOrder: number;
  badge: string | null;
  oldPriceKopeks: number | null;
  receiptDescription: string | null;
  paymentSubject: string | null;
  paymentMode: string | null;
  vatCode: number | null;
  archivedAt: string | null;
  purchasesCount: number;
};

type ProductDraft = {
  code: string;
  name: string;
  shortDescription: string;
  fullDescription: string;
  sessionsCount: number;
  priceRub: number;
  durationMinutes: number;
  isActive: boolean;
  isPublic: boolean;
  sortOrder: number;
  badge: string;
  oldPriceRub: number | "";
  receiptDescription: string;
  paymentSubject: string;
  paymentMode: string;
  vatCode: number | "";
};

const emptyDraft: ProductDraft = {
  code: "",
  name: "",
  shortDescription: "",
  fullDescription: "",
  sessionsCount: 1,
  priceRub: 7000,
  durationMinutes: 50,
  isActive: true,
  isPublic: true,
  sortOrder: 0,
  badge: "",
  oldPriceRub: "",
  receiptDescription: "",
  paymentSubject: "",
  paymentMode: "",
  vatCode: "",
};

function fromProduct(product: ProductItem): ProductDraft {
  return {
    code: product.code,
    name: product.name,
    shortDescription: product.shortDescription ?? "",
    fullDescription: product.fullDescription ?? "",
    sessionsCount: product.sessionsCount,
    priceRub: product.priceKopeks / 100,
    durationMinutes: product.durationMinutes,
    isActive: product.isActive,
    isPublic: product.isPublic,
    sortOrder: product.sortOrder,
    badge: product.badge ?? "",
    oldPriceRub: product.oldPriceKopeks ? product.oldPriceKopeks / 100 : "",
    receiptDescription: product.receiptDescription ?? "",
    paymentSubject: product.paymentSubject ?? "",
    paymentMode: product.paymentMode ?? "",
    vatCode: product.vatCode ?? "",
  };
}

export default function AdminProducts() {
  const [items, setItems] = useState<ProductItem[]>([]);
  const [draft, setDraft] = useState<ProductDraft>(emptyDraft);
  const [edits, setEdits] = useState<Record<string, ProductDraft>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadProducts() {
    const response = await adminFetch("/api/admin/products");
    const data = (await response.json()) as ProductItem[];
    setItems(data);
    setEdits(Object.fromEntries(data.map((item) => [item.id, fromProduct(item)])));
    setLoading(false);
  }

  useEffect(() => {
    const controller = new AbortController();

    void adminFetch("/api/admin/products", { signal: controller.signal })
      .then((response) => response.json())
      .then((data: ProductItem[]) => {
        setItems(data);
        setEdits(Object.fromEntries(data.map((item) => [item.id, fromProduct(item)])));
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

  async function createProduct() {
    setSaving(true);
    setError(null);

    const response = await adminFetch("/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });

    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      setError(data.error ?? "Не удалось создать продукт.");
      setSaving(false);
      return;
    }

    setDraft(emptyDraft);
    setSaving(false);
    await loadProducts();
  }

  async function updateProduct(id: string) {
    const response = await adminFetch(`/api/admin/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(edits[id]),
    });

    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      setError(data.error ?? "Не удалось сохранить продукт.");
      return;
    }

    await loadProducts();
  }

  async function archiveProduct(id: string) {
    if (!window.confirm("Архивировать продукт? Старые платежи сохранят историю.")) {
      return;
    }

    await adminFetch(`/api/admin/products/${id}`, { method: "DELETE" });
    await loadProducts();
  }

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
          <h2 className="font-serif text-4xl text-[#332725]">Новый продукт</h2>
          <ProductFields
            value={draft}
            onChange={(patch) => setDraft((current) => ({ ...current, ...patch }))}
          />
          {error && (
            <p className="mt-4 rounded-2xl bg-[#fff3df] px-4 py-3 text-sm text-[#9a5a1f]">
              {error}
            </p>
          )}
          <button
            onClick={createProduct}
            disabled={saving}
            className="mt-6 rounded-2xl bg-[#332725] px-6 py-3 text-white disabled:opacity-60"
          >
            {saving ? "Сохраняю..." : "Добавить продукт"}
          </button>
        </div>

        <div className="mt-10 grid gap-6">
          {items.map((item) => (
            <article
              key={item.id}
              className="rounded-[2rem] border border-[#ead7d1] bg-white p-6 shadow-sm"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.18em] text-[#c98778]">
                    {item.code}
                  </p>
                  <h3 className="mt-2 text-2xl font-medium text-[#332725]">
                    {item.name}
                  </h3>
                  <p className="mt-2 text-[#5f5552]">
                    {item.sessionsCount} консультаций · {item.durationMinutes} мин ·{" "}
                    {formatKopeks(item.priceKopeks)} руб.
                  </p>
                  <p className="mt-2 text-sm text-[#8a7a76]">
                    Платежей: {item.purchasesCount}.{" "}
                    {item.archivedAt ? "В архиве." : "Активен в каталоге."}
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => updateProduct(item.id)}
                    className="rounded-2xl bg-[#332725] px-5 py-3 text-white"
                  >
                    Сохранить
                  </button>
                  <button
                    onClick={() => archiveProduct(item.id)}
                    className="rounded-2xl border border-[#c98778] px-5 py-3 text-[#c98778]"
                  >
                    Архив
                  </button>
                </div>
              </div>

              <ProductFields
                value={edits[item.id] ?? fromProduct(item)}
                onChange={(patch) =>
                  setEdits((current) => ({
                    ...current,
                    [item.id]: { ...(current[item.id] ?? fromProduct(item)), ...patch },
                  }))
                }
              />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProductFields({
  value,
  onChange,
}: {
  value: ProductDraft;
  onChange: (patch: Partial<ProductDraft>) => void;
}) {
  return (
    <div className="mt-6 grid gap-4 md:grid-cols-2">
      <input
        value={value.code}
        onChange={(event) => onChange({ code: event.target.value })}
        className="rounded-2xl border border-[#ead7d1] px-4 py-3"
        placeholder="Код, например single-session"
      />
      <input
        value={value.name}
        onChange={(event) => onChange({ name: event.target.value })}
        className="rounded-2xl border border-[#ead7d1] px-4 py-3"
        placeholder="Название"
      />
      <input
        value={value.shortDescription}
        onChange={(event) => onChange({ shortDescription: event.target.value })}
        className="rounded-2xl border border-[#ead7d1] px-4 py-3"
        placeholder="Короткое описание"
      />
      <input
        value={value.badge}
        onChange={(event) => onChange({ badge: event.target.value })}
        className="rounded-2xl border border-[#ead7d1] px-4 py-3"
        placeholder="Бейдж, если нужен"
      />
      <input
        value={value.sessionsCount}
        onChange={(event) => onChange({ sessionsCount: Number(event.target.value) })}
        type="number"
        min={1}
        className="rounded-2xl border border-[#ead7d1] px-4 py-3"
        placeholder="Количество консультаций"
      />
      <input
        value={value.durationMinutes}
        onChange={(event) => onChange({ durationMinutes: Number(event.target.value) })}
        type="number"
        min={1}
        className="rounded-2xl border border-[#ead7d1] px-4 py-3"
        placeholder="Длительность, минут"
      />
      <input
        value={value.priceRub}
        onChange={(event) => onChange({ priceRub: Number(event.target.value) })}
        type="number"
        min={1}
        className="rounded-2xl border border-[#ead7d1] px-4 py-3"
        placeholder="Цена, руб."
      />
      <input
        value={value.oldPriceRub}
        onChange={(event) =>
          onChange({
            oldPriceRub: event.target.value ? Number(event.target.value) : "",
          })
        }
        type="number"
        min={1}
        className="rounded-2xl border border-[#ead7d1] px-4 py-3"
        placeholder="Старая цена, руб."
      />
      <input
        value={value.sortOrder}
        onChange={(event) => onChange({ sortOrder: Number(event.target.value) })}
        type="number"
        className="rounded-2xl border border-[#ead7d1] px-4 py-3"
        placeholder="Порядок"
      />
      <input
        value={value.receiptDescription}
        onChange={(event) => onChange({ receiptDescription: event.target.value })}
        className="rounded-2xl border border-[#ead7d1] px-4 py-3"
        placeholder="Описание для чека"
      />
      <textarea
        value={value.fullDescription}
        onChange={(event) => onChange({ fullDescription: event.target.value })}
        className="rounded-2xl border border-[#ead7d1] px-4 py-3 md:col-span-2"
        placeholder="Полное описание"
        rows={3}
      />
      <label className="flex items-center gap-3 text-[#5f5552]">
        <input
          checked={value.isActive}
          onChange={(event) => onChange({ isActive: event.target.checked })}
          type="checkbox"
        />
        Активен
      </label>
      <label className="flex items-center gap-3 text-[#5f5552]">
        <input
          checked={value.isPublic}
          onChange={(event) => onChange({ isPublic: event.target.checked })}
          type="checkbox"
        />
        Показывать на сайте
      </label>
    </div>
  );
}
