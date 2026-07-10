"use client";

import { useEffect, useState } from "react";

type Review = {
  id: string;
  name: string;
  age: string | null;
  text: string;
  image: string | null;
  published: boolean;
  createdAt: string;
};

export default function AdminReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [openedId, setOpenedId] = useState<string | null>(null);

  async function loadReviews() {
    const response = await fetch("/api/admin/reviews");
    const data = await response.json();

    setReviews(data);
    setLoading(false);
  }

  async function updateReview(review: Review) {
    await fetch(`/api/admin/reviews/${review.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(review),
    });

    await loadReviews();
  }

  async function deleteReview(id: string) {
    const confirmed = window.confirm("Удалить этот отзыв?");
    if (!confirmed) return;

    await fetch(`/api/admin/reviews/${id}`, {
      method: "DELETE",
    });

    await loadReviews();
  }

  function formatDate(date: string) {
    return new Intl.DateTimeFormat("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(date));
  }

  useEffect(() => {
    const controller = new AbortController();

    void fetch("/api/admin/reviews", { signal: controller.signal })
      .then((response) => response.json())
      .then((data: Review[]) => {
        setReviews(data);
        setLoading(false);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") {
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
        <h2 className="font-serif text-4xl text-[#332725]">
          Управление отзывами
        </h2>

        <div className="mt-10 overflow-hidden rounded-[2rem] border border-[#ead7d1] bg-white shadow-sm">
          <div className="grid grid-cols-[120px_1fr_120px_160px_140px] gap-4 bg-[#fff8f6] px-6 py-4 text-sm uppercase tracking-[0.18em] text-[#8a7a76]">
            <div>Статус</div>
            <div>Клиент</div>
            <div>Дата</div>
            <div>Действие</div>
            <div>Подробнее</div>
          </div>

          {reviews.map((review) => {
            const isOpen = openedId === review.id;

            return (
              <div
                key={review.id}
                className={
                  review.published
                    ? "border-t border-[#ead7d1]"
                    : "border-t border-[#ead7d1] bg-[#fff3df] font-semibold"
                }
              >
                <div className="grid grid-cols-[120px_1fr_120px_160px_140px] items-center gap-4 px-6 py-4">
                  <div className="text-sm">
                    {review.published ? (
                      <span className="rounded-full bg-[#edf7ed] px-3 py-1 text-[#5f8a5f]">
                        Опубликован
                      </span>
                    ) : (
                      <span className="rounded-full bg-[#ffe2c2] px-3 py-1 text-[#9a5a1f]">
                        На проверке
                      </span>
                    )}
                  </div>

                  <div>
                    <div className="text-[#332725]">
                      {review.age
                        ? `${review.name}, ${review.age}`
                        : review.name}
                    </div>

                    <div className="mt-1 line-clamp-1 text-sm font-normal text-[#8a7a76]">
                      {review.text}
                    </div>
                  </div>

                  <div className="text-sm font-normal text-[#8a7a76]">
                    {formatDate(review.createdAt)}
                  </div>

                  <button
                    onClick={() =>
                      updateReview({
                        ...review,
                        published: !review.published,
                      })
                    }
                    className="rounded-xl bg-[#332725] px-4 py-2 text-sm font-normal text-white"
                  >
                    {review.published ? "Скрыть" : "Опубликовать"}
                  </button>

                  <button
                    onClick={() => setOpenedId(isOpen ? null : review.id)}
                    className="rounded-xl border border-[#332725] px-4 py-2 text-sm font-normal text-[#332725]"
                  >
                    {isOpen ? "Свернуть" : "Раскрыть"}
                  </button>
                </div>

                {isOpen && (
                  <div className="border-t border-[#ead7d1] bg-white px-6 py-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      <input
                        value={review.name}
                        onChange={(event) =>
                          setReviews((items) =>
                            items.map((item) =>
                              item.id === review.id
                                ? { ...item, name: event.target.value }
                                : item
                            )
                          )
                        }
                        className="rounded-2xl border border-[#ead7d1] px-4 py-3 font-normal"
                        placeholder="Имя"
                      />

                      <input
                        value={review.age || ""}
                        onChange={(event) =>
                          setReviews((items) =>
                            items.map((item) =>
                              item.id === review.id
                                ? { ...item, age: event.target.value }
                                : item
                            )
                          )
                        }
                        className="rounded-2xl border border-[#ead7d1] px-4 py-3 font-normal"
                        placeholder="Возраст"
                      />
                    </div>

                    <textarea
                      value={review.text}
                      onChange={(event) =>
                        setReviews((items) =>
                          items.map((item) =>
                            item.id === review.id
                              ? { ...item, text: event.target.value }
                              : item
                          )
                        )
                      }
                      rows={5}
                      className="mt-4 w-full rounded-2xl border border-[#ead7d1] px-4 py-3 font-normal"
                      placeholder="Текст отзыва"
                    />

                    <input
                      value={review.image || ""}
                      onChange={(event) =>
                        setReviews((items) =>
                          items.map((item) =>
                            item.id === review.id
                              ? { ...item, image: event.target.value }
                              : item
                          )
                        )
                      }
                      className="mt-4 w-full rounded-2xl border border-[#ead7d1] px-4 py-3 font-normal"
                      placeholder="Путь к аватарке, например /reviews/woman-1.png"
                    />

                    <div className="mt-5 flex flex-wrap gap-3">
                      <button
                        onClick={() => updateReview(review)}
                        className="rounded-2xl border border-[#332725] px-5 py-3 font-normal text-[#332725]"
                      >
                        Сохранить изменения
                      </button>

                      <button
                        onClick={() => deleteReview(review.id)}
                        className="rounded-2xl border border-[#b94a48] px-5 py-3 font-normal text-[#b94a48]"
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
