import Image from "next/image";
import MobileCarousel from "@/components/MobileCarousel";
import StarRating from "@/components/StarRating";
import { formatReviewDate } from "@/src/lib/format-review-date";
import { getPublishedReviews } from "@/src/lib/reviews";

type ReviewsProps = {
  limit?: number;
};

function stableReviewScore(id: string) {
  let hash = 0;

  for (const char of id) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }

  return hash;
}

function getFeaturedItems<T extends { id: string }>(items: T[], limit: number) {
  return [...items]
    .sort((first, second) => stableReviewScore(first.id) - stableReviewScore(second.id))
    .slice(0, limit);
}

export default async function Reviews({ limit }: ReviewsProps) {
  const reviews = await getPublishedReviews();

  const visibleReviews = limit ? getFeaturedItems(reviews, limit) : reviews;

  return (
    <section className="luneva-fade bg-[#fff8f6] px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <p className="mb-4 text-sm uppercase tracking-[0.25em] text-[#c98778]">
          Отзывы
        </p>

        <h2 className="font-serif text-5xl text-[#332725]">
          Истории людей, которые обратились за поддержкой
        </h2>

        <MobileCarousel
          label="Отзывы"
          className="mt-8 md:mt-20"
          desktopGridClassName="md:grid-cols-2 md:gap-10 lg:grid-cols-3"
        >
          {visibleReviews.map((review) => (
            <div
              key={review.id}
              className="luneva-card relative rounded-[2rem] border border-[#ead7d1] bg-white px-8 pt-32 pb-8 text-center shadow-sm md:pt-20"
            >
              {review.image && (
                <div className="absolute top-5 left-1/2 h-20 w-20 -translate-x-1/2 overflow-hidden rounded-full bg-white p-2 shadow-lg md:top-0 md:h-24 md:w-24 md:-translate-y-1/2">
                  <Image
                    src={review.image}
                    alt={review.name}
                    width={96}
                    height={96}
                    className="h-full w-full rounded-full object-cover"
                  />
                </div>
              )}

              <h3 className="text-lg font-medium uppercase tracking-wide text-[#332725]">
                {review.age ? `${review.name}, ${review.age}` : review.name}
              </h3>

              <div className="mt-4">
                <StarRating value={review.rating} size="sm" />
              </div>

              <p className="mt-8 font-serif text-lg italic leading-8 text-[#332725]">
                {review.text}
              </p>

              <p className="mt-8 text-sm text-[#8a7a76]">
                {formatReviewDate(review.createdAt)}
              </p>
            </div>
          ))}
        </MobileCarousel>
      </div>
    </section>
  );
}
