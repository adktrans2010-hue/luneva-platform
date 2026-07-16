"use client";

import { useEffect, useMemo, useState } from "react";

import StarRating from "@/components/StarRating";
import { adminFetch } from "@/src/lib/admin-fetch";

type Review = {
  id: string;
  name: string;
  age: string | null;
  text: string;
  image: string | null;
  rating: number;
  categoryId: string | null;
  published: boolean;
  createdAt: string;
};

type ReviewCategory = {
  id: string;
  name: string;
  active: boolean;
  sortOrder: number;
};

function formatDate(date: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Europe/Moscow",
  }).format(new Date(date));
}

function toDateInputValue(date: string) {
  const parts = new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Europe/Moscow",
  }).formatToParts(new Date(date));
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return `${values.year}-${values.month}-${values.day}`;
}

export default function AdminReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [categories, setCategories] = useState<ReviewCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [openedId, setOpenedId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [message, setMessage] = useState("");

  async function loadData() {
    const [reviewsResponse, categoriesResponse] = await Promise.all([
      adminFetch("/api/admin/reviews"),
      adminFetch("/api/admin/review-categories"),
    ]);
    const [reviewsData, categoriesData] = await Promise.all([
      reviewsResponse.json(),
      categoriesResponse.json(),
    ]);

    setReviews(reviewsData);
    setCategories(categoriesData);
    setLoading(false);
  }

  useEffect(() => {
    const controller = new AbortController();

    void Promise.all([
      adminFetch("/api/admin/reviews", { signal: controller.signal }),
      adminFetch("/api/admin/review-categories", { signal: controller.signal }),
    ])
      .then(async ([reviewsResponse, categoriesResponse]) => {
        const [reviewsData, categoriesData] = await Promise.all([
          reviewsResponse.json(),
          categoriesResponse.json(),
        ]);
        setReviews(reviewsData);
        setCategories(categoriesData);
        setLoading(false);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setLoading(false);
      });

    return () => controller.abort();
  }, []);

  const visibleReviews = useMemo(() => {
    if (categoryFilter === "all") return reviews;
    if (categoryFilter === "unassigned") {
      return reviews.filter((review) => !review.categoryId);
    }
    return reviews.filter((review) => review.categoryId === categoryFilter);
  }, [categoryFilter, reviews]);

  function changeReview(id: string, patch: Partial<Review>) {
    setReviews((items) =>
      items.map((item) => (item.id === id ? { ...item, ...patch } : item))
    );
  }

  async function updateReview(review: Review) {
    setMessage("");
    const response = await adminFetch(`/api/admin/reviews/${review.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(review),
    });

    if (!response.ok) {
      setMessage("Не удалось сохранить отзыв.");
      return;
    }

    setMessage("Изменения сохранены.");
    await loadData();
  }

  async function deleteReview(id: string) {
    if (!window.confirm("Удалить этот отзыв?")) return;

    await adminFetch(`/api/admin/reviews/${id}`, { method: "DELETE" });
    await loadData();
  }

  async function createCategory() {
    const name = newCategoryName.trim();
    if (!name) return;

    const response = await adminFetch("/api/admin/review-categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    if (!response.ok) {
      const data = await response.json();
      setMessage(data.error || "Не удалось добавить категорию.");
      return;
    }

    setNewCategoryName("");
    setMessage("Категория добавлена.");
    await loadData();
  }

  async function updateCategory(category: ReviewCategory) {
    const response = await adminFetch(
      `/api/admin/review-categories/${category.id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(category),
      }
    );

    setMessage(response.ok ? "Категория сохранена." : "Не удалось сохранить категорию.");
    if (response.ok) await loadData();
  }

  async function deleteCategory(category: ReviewCategory) {
    if (
      !window.confirm(
        `Удалить категорию «${category.name}»? У отзывов категория будет снята.`
      )
    ) {
      return;
    }

    await adminFetch(`/api/admin/review-categories/${category.id}`, {
      method: "DELETE",
    });
    setCategoryFilter("all");
    await loadData();
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
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <h2 className="font-serif text-4xl text-[#332725]">Управление отзывами</h2>
            <p className="mt-2 text-[#5f5552]">Дата в редакторе заполнена текущей датой каждого отзыва.</p>
          </div>

          <label className="grid gap-2 text-sm text-[#5f5552]">
            Фильтр по категории
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className="min-w-64 rounded-md border border-[#ead7d1] bg-white px-4 py-3 text-[#332725]"
            >
              <option value="all">Все отзывы</option>
              <option value="unassigned">Без категории</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        {message && (
          <div className="mt-5 border-l-4 border-[#c98778] bg-[#fff8f6] px-5 py-3 text-[#5f5552]">
            {message}
          </div>
        )}

        <div className="mt-8 border-y border-[#ead7d1] py-7">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="font-serif text-2xl text-[#332725]">Категории отзывов</h3>
              <p className="mt-1 text-sm text-[#8a7a76]">Неактивные категории скрыты на публичной странице.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <input
                value={newCategoryName}
                onChange={(event) => setNewCategoryName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") void createCategory();
                }}
                placeholder="Новая категория"
                className="rounded-md border border-[#ead7d1] bg-white px-4 py-3"
              />
              <button
                type="button"
                onClick={() => void createCategory()}
                className="rounded-md bg-[#332725] px-5 py-3 text-white"
              >
                Добавить
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {categories.map((category) => (
              <div key={category.id} className="flex flex-wrap items-center gap-3 border-b border-[#ead7d1] py-3">
                <input
                  value={category.name}
                  onChange={(event) =>
                    setCategories((items) =>
                      items.map((item) =>
                        item.id === category.id ? { ...item, name: event.target.value } : item
                      )
                    )
                  }
                  className="min-w-0 flex-1 rounded-md border border-[#ead7d1] px-3 py-2"
                />
                <label className="flex items-center gap-2 text-sm text-[#5f5552]">
                  <input
                    type="checkbox"
                    checked={category.active}
                    onChange={(event) =>
                      setCategories((items) =>
                        items.map((item) =>
                          item.id === category.id
                            ? { ...item, active: event.target.checked }
                            : item
                        )
                      )
                    }
                  />
                  Активна
                </label>
                <button type="button" onClick={() => void updateCategory(category)} className="px-3 py-2 text-sm text-[#332725]">
                  Сохранить
                </button>
                <button type="button" onClick={() => void deleteCategory(category)} className="px-3 py-2 text-sm text-[#b94a48]">
                  Удалить
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 overflow-hidden border border-[#ead7d1] bg-white shadow-sm">
          <div className="hidden grid-cols-[120px_1fr_120px_160px_140px] gap-4 bg-[#fff8f6] px-6 py-4 text-sm uppercase text-[#8a7a76] lg:grid">
            <div>Статус</div>
            <div>Клиент</div>
            <div>Дата</div>
            <div>Действие</div>
            <div>Подробнее</div>
          </div>

          {visibleReviews.map((review) => {
            const isOpen = openedId === review.id;

            return (
              <div key={review.id} className={review.published ? "border-t border-[#ead7d1]" : "border-t border-[#ead7d1] bg-[#fff3df]"}>
                <div className="grid gap-4 px-5 py-5 lg:grid-cols-[120px_1fr_120px_160px_140px] lg:items-center lg:px-6 lg:py-4">
                  <div className="text-sm">
                    <span className={review.published ? "bg-[#edf7ed] px-3 py-1 text-[#5f8a5f]" : "bg-[#ffe2c2] px-3 py-1 text-[#9a5a1f]"}>
                      {review.published ? "Опубликован" : "На проверке"}
                    </span>
                  </div>
                  <div>
                    <div className="text-[#332725]">{review.age ? `${review.name}, ${review.age}` : review.name}</div>
                    <div className="mt-1 line-clamp-1 text-sm text-[#8a7a76]">{review.text}</div>
                  </div>
                  <div className="text-sm text-[#8a7a76]">{formatDate(review.createdAt)}</div>
                  <button type="button" onClick={() => void updateReview({ ...review, published: !review.published })} className="rounded-md bg-[#332725] px-4 py-2 text-sm text-white">
                    {review.published ? "Скрыть" : "Опубликовать"}
                  </button>
                  <button type="button" onClick={() => setOpenedId(isOpen ? null : review.id)} className="rounded-md border border-[#332725] px-4 py-2 text-sm text-[#332725]">
                    {isOpen ? "Свернуть" : "Раскрыть"}
                  </button>
                </div>

                {isOpen && (
                  <div className="border-t border-[#ead7d1] bg-white px-5 py-6 lg:px-6">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                      <label className="grid gap-2 text-sm text-[#5f5552]">
                        Имя
                        <input value={review.name} onChange={(event) => changeReview(review.id, { name: event.target.value })} className="rounded-md border border-[#ead7d1] px-4 py-3 text-[#332725]" />
                      </label>
                      <label className="grid gap-2 text-sm text-[#5f5552]">
                        Возраст
                        <input value={review.age || ""} onChange={(event) => changeReview(review.id, { age: event.target.value })} className="rounded-md border border-[#ead7d1] px-4 py-3 text-[#332725]" />
                      </label>
                      <label className="grid gap-2 text-sm text-[#5f5552]">
                        Дата отзыва
                        <input type="date" value={toDateInputValue(review.createdAt)} onChange={(event) => changeReview(review.id, { createdAt: `${event.target.value}T12:00:00+03:00` })} className="rounded-md border border-[#ead7d1] px-4 py-3 text-[#332725]" />
                      </label>
                      <label className="grid gap-2 text-sm text-[#5f5552]">
                        Категория
                        <select value={review.categoryId || ""} onChange={(event) => changeReview(review.id, { categoryId: event.target.value || null })} className="rounded-md border border-[#ead7d1] bg-white px-4 py-3 text-[#332725]">
                          <option value="">Без категории</option>
                          {categories.map((category) => (
                            <option key={category.id} value={category.id}>{category.name}</option>
                          ))}
                        </select>
                      </label>
                    </div>

                    <div className="mt-4">
                      <div className="mb-1 text-sm text-[#5f5552]">Оценка клиента</div>
                      <StarRating value={review.rating} onChange={(rating) => changeReview(review.id, { rating })} />
                    </div>

                    <textarea value={review.text} onChange={(event) => changeReview(review.id, { text: event.target.value })} rows={5} className="mt-4 w-full rounded-md border border-[#ead7d1] px-4 py-3" placeholder="Текст отзыва" />
                    <input value={review.image || ""} onChange={(event) => changeReview(review.id, { image: event.target.value })} className="mt-4 w-full rounded-md border border-[#ead7d1] px-4 py-3" placeholder="Путь к аватарке" />

                    <div className="mt-5 flex flex-wrap gap-3">
                      <button type="button" onClick={() => void updateReview(review)} className="rounded-md border border-[#332725] px-5 py-3 text-[#332725]">Сохранить изменения</button>
                      <button type="button" onClick={() => void deleteReview(review.id)} className="rounded-md border border-[#b94a48] px-5 py-3 text-[#b94a48]">Удалить</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {visibleReviews.length === 0 && (
            <div className="border-t border-[#ead7d1] px-6 py-10 text-[#5f5552]">По выбранному фильтру отзывов нет.</div>
          )}
        </div>
      </div>
    </section>
  );
}
