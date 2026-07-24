"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

import StarRating from "@/components/StarRating";
import { formatReviewDate } from "@/src/lib/format-review-date";

type ReviewItem = {
  id: string;
  name: string;
  age: string | null;
  text: string;
  image: string | null;
  rating: number;
  categoryId: string | null;
  createdAt: string;
};

type ReviewCategory = {
  id: string;
  name: string;
};

type ReviewsCatalogProps = {
  reviews: ReviewItem[];
  categories: ReviewCategory[];
};

export default function ReviewsCatalog({
  reviews,
  categories,
}: ReviewsCatalogProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const visibleReviews = useMemo(
    () =>
      selectedCategoryId
        ? reviews.filter((review) => review.categoryId === selectedCategoryId)
        : reviews,
    [reviews, selectedCategoryId]
  );

  return (
    <>
      <div className="mt-9 flex flex-wrap gap-3" aria-label="Категории отзывов">
        <button
          type="button"
          onClick={() => setSelectedCategoryId(null)}
          aria-pressed={selectedCategoryId === null}
          className={
            selectedCategoryId === null
              ? "rounded-full bg-[#332725] px-6 py-3 text-white shadow-sm"
              : "rounded-full border border-[#ead7d1] bg-white px-6 py-3 text-[#332725] transition hover:border-[#c98778]"
          }
        >
          Все
        </button>

        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => setSelectedCategoryId(category.id)}
            aria-pressed={selectedCategoryId === category.id}
            className={
              selectedCategoryId === category.id
                ? "rounded-full bg-[#332725] px-6 py-3 text-white shadow-sm"
                : "rounded-full border border-[#ead7d1] bg-white px-6 py-3 text-[#332725] transition hover:border-[#c98778]"
            }
          >
            {category.name}
          </button>
        ))}
      </div>

      <div className="mt-7 columns-1 gap-5 md:columns-2 lg:columns-3">
        {visibleReviews.map((review, index) => (
          <article
            key={review.id}
            className="mb-5 break-inside-avoid rounded-[1.4rem] border border-[#ead7d1] bg-white/78 p-7 shadow-sm"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-[#ead7d1] bg-[#fff8f6] text-xl text-[#c29a90]">
                  {review.image ? (
                    <Image
                      src={review.image}
                      alt={review.name}
                      width={44}
                      height={44}
                      className="h-full w-full object-cover"
                    />
                  ) : index % 2 === 0 ? (
                    <span aria-label="Женщина">♀</span>
                  ) : (
                    <span aria-label="Мужчина">♂</span>
                  )}
                </div>

                <div>
                  <div className="text-sm text-[#332725]">
                    {review.name || "Клиент"}
                  </div>
                  {review.age && (
                    <div className="text-xs text-[#8a7a76]">{review.age}</div>
                  )}
                </div>
              </div>

              <StarRating value={review.rating} size="sm" />
            </div>

            <div className="mt-5 font-serif text-4xl leading-none text-[#c29a90]">
              “
            </div>

            <p className="mt-3 font-serif text-2xl leading-snug text-[#332725]">
              {review.text}
            </p>

            <div className="mt-6 h-px w-7 bg-[#c98778]" />

            <p className="mt-5 text-sm text-[#5f5552]">
              {formatReviewDate(review.createdAt)}
            </p>
          </article>
        ))}
      </div>

      {visibleReviews.length === 0 && (
        <div className="mt-8 rounded-[1.4rem] border border-[#ead7d1] bg-white p-8 text-[#5f5552]">
          В этой категории пока нет опубликованных отзывов.
        </div>
      )}
    </>
  );
}
