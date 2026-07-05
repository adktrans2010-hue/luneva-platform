import Image from "next/image";
import { reviews } from "@/data/reviews";

type ReviewsProps = {
  limit?: number;
};

function getRandomReviews(limit: number) {
  return [...reviews].sort(() => Math.random() - 0.5).slice(0, limit);
}

export default function Reviews({ limit }: ReviewsProps) {
  const visibleReviews = limit ? getRandomReviews(limit) : reviews;

  return (
    <section className="luneva-fade bg-[#fff8f6] px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <p className="mb-4 text-sm uppercase tracking-[0.25em] text-[#c98778]">
          Отзывы
        </p>

        <h2 className="font-serif text-5xl text-[#332725]">
          Истории людей, которые обратились за поддержкой
        </h2>

        <div className="mt-20 grid gap-10 md:grid-cols-2 lg:grid-cols-3">
          {visibleReviews.map((review) => (
            <div
              key={`${review.name}-${review.date}`}
              className="luneva-card relative rounded-[2rem] border border-[#ead7d1] bg-white px-8 pb-8 pt-20 text-center shadow-sm"
            >
              <div className="absolute left-1/2 top-0 h-24 w-24 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full bg-white p-2 shadow-lg">
                <Image
                  src={review.image}
                  alt={review.name}
                  width={96}
                  height={96}
                  className="h-full w-full rounded-full object-cover"
                />
              </div>

              <h3 className="text-lg font-medium uppercase tracking-wide text-[#332725]">
                {review.name}, {review.age}
              </h3>

              <div className="mt-4 text-[#c98778]">★★★★★</div>

              <p className="mt-8 font-serif text-lg italic leading-8 text-[#332725]">
                {review.text}
              </p>

              <p className="mt-8 text-sm text-[#8a7a76]">{review.date}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}