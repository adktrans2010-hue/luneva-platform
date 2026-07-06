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

  async function loadReviews() {
    const response = await fetch("/api/admin/reviews");
    const data = await response.json();

    setReviews(data);
    setLoading(false);
  }

  async function updateReview(review: Review) {
    await fetch(`/api/admin/reviews/${review.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
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

  useEffect(() => {
    loadReviews();
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

        <div className="mt-10 space-y-6">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="rounded-[2rem] border border-[#ead7d1] bg-white p-6 shadow-sm"
            >
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
                  className="rounded-2xl border border-[#ead7d1] px-4 py-3"
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
                  className="rounded-2xl border border-[#ead7d1] px-4 py-3"
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
                className="mt-4 w-full rounded-2xl border border-[#ead7d1] px-4 py-3"
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
                className="mt-4 w-full rounded-2xl border border-[#ead7d1] px-4 py-3"
                placeholder="Путь к аватарке, например /reviews/woman-1.png"
              />

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <button
                  onClick={() =>
                    updateReview({
                      ...review,
                      published: !review.published,
                    })
                  }
                  className="rounded-2xl bg-[#332725] px-5 py-3 text-white"
                >
                  {review.published ? "Скрыть" : "Опубликовать"}
                </button>

                <button
                  onClick={() => updateReview(review)}
                  className="rounded-2xl border border-[#332725] px-5 py-3 text-[#332725]"
                >
                  Сохранить изменения
                </button>

                <button
                  onClick={() => deleteReview(review.id)}
                  className="rounded-2xl border border-[#b94a48] px-5 py-3 text-[#b94a48]"
                >
                  Удалить
                </button>

                <span className="text-sm text-[#8a7a76]">
                  {review.published ? "Опубликован" : "На проверке"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}