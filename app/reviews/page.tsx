import Image from "next/image";
import Link from "next/link";

import ReviewForm from "@/components/ReviewForm";
import { getPublishedReviews } from "@/src/lib/reviews";
import { getSeoPage, seoToMetadata } from "@/src/lib/seo";

export async function generateMetadata() {
  return seoToMetadata(await getSeoPage("/reviews"));
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("ru-RU", {
    month: "long",
    year: "numeric",
  }).format(date);
}

const topics = [
  "Все",
  "Подростки",
  "Тревога",
  "РПП",
  "Отношения",
  "Самооценка",
  "Кризисы",
  "Границы",
];

export default async function ReviewsPage() {
  const reviews = await getPublishedReviews();

  return (
    <main className="bg-[#fffaf8]">
      <section className="relative overflow-hidden border-b border-[#ead7d1] bg-[#fffaf8] px-6 py-24">
        <div className="absolute inset-y-0 right-0 hidden w-[52%] overflow-hidden bg-[#f4ebe6] lg:block">
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,250,248,0.9),rgba(255,250,248,0.22)_42%,rgba(255,250,248,0))]" />
          <div className="absolute inset-y-0 right-0 w-24 bg-[linear-gradient(90deg,rgba(255,255,255,0),rgba(255,255,255,0.76))]" />
          <div className="absolute right-28 top-0 h-full w-56 bg-[repeating-linear-gradient(90deg,rgba(255,255,255,0.34)_0,rgba(255,255,255,0.34)_18px,rgba(222,202,190,0.22)_19px,rgba(222,202,190,0.22)_22px)]" />
          <div className="absolute bottom-12 right-44 h-72 w-72 rounded-full bg-[#d7b59d]/18 blur-3xl" />
          <div className="absolute bottom-8 right-64 h-32 w-20 rounded-b-[2rem] rounded-t-[4rem] bg-[#efe1d8] shadow-[0_18px_45px_rgba(94,55,45,0.12)]" />
          <div className="absolute bottom-36 right-56 h-72 w-56 border-l border-[#cda982] opacity-80 rotate-[-18deg]" />
          <div className="absolute bottom-36 right-52 h-64 w-48 border-l border-[#cda982] opacity-70 rotate-[16deg]" />
          <div className="absolute bottom-40 right-48 h-56 w-44 border-l border-[#d6b795] opacity-70 rotate-[34deg]" />
          <div className="absolute bottom-48 right-60 h-44 w-40 border-l border-[#d6b795] opacity-70 rotate-[-42deg]" />
        </div>

        <div className="relative mx-auto max-w-7xl">
          <p className="mb-7 text-sm uppercase tracking-[0.35em] text-[#c98778]">
            Отзывы
          </p>

          <h1 className="max-w-2xl font-serif text-5xl leading-tight text-[#332725] md:text-6xl">
            Опыт людей, которые обратились за поддержкой
          </h1>

          <p className="mt-7 max-w-xl text-lg leading-8 text-[#5f5552]">
            Каждая история уникальна. Здесь собраны отзывы людей, которые решили
            поделиться своим опытом терапии.
          </p>

          <Link
            href="/contacts#booking"
            className="mt-9 inline-flex items-center gap-5 rounded-2xl bg-[#332725] px-8 py-4 text-white shadow-lg shadow-[#332725]/15 transition hover:-translate-y-1"
          >
            Записаться на консультацию
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>

      <section className="px-6 py-10">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-6 rounded-[1.6rem] border border-[#ead7d1] bg-white/72 p-7 shadow-sm backdrop-blur md:grid-cols-3">
            <div className="flex items-center gap-5">
              <span className="text-4xl text-[#c9a59b]">♧</span>
              <div>
                <div className="font-serif text-3xl text-[#332725]">150+</div>
                <div className="text-[#5f5552]">консультаций</div>
              </div>
            </div>

            <div className="flex items-center gap-5">
              <span className="text-4xl text-[#c9a59b]">☆</span>
              <div>
                <div className="font-serif text-3xl text-[#332725]">5.0</div>
                <div className="text-[#5f5552]">средняя оценка</div>
              </div>
            </div>

            <div className="flex items-center gap-5">
              <span className="text-4xl text-[#c9a59b]">♢</span>
              <div className="leading-7 text-[#332725]">
                Все отзывы публикуются
                <br />
                только с согласия клиентов
              </div>
            </div>
          </div>

          <div className="mt-9 flex flex-wrap gap-4">
            {topics.map((topic) => (
              <button
                key={topic}
                type="button"
                className={
                  topic === "Все"
                    ? "rounded-full bg-[#332725] px-8 py-3 text-white shadow-sm"
                    : "rounded-full border border-[#ead7d1] bg-white px-8 py-3 text-[#332725] transition hover:border-[#c98778]"
                }
              >
                {topic}
              </button>
            ))}
          </div>

          <div className="mt-6">
            <ReviewForm />
          </div>

          <div className="mt-7 columns-1 gap-5 md:columns-2 lg:columns-3">
            {reviews.map((review, index) => (
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

                  <div
                    aria-label="Оценка 5 из 5"
                    className="text-lg tracking-[0.12em] text-[#c29a90]"
                  >
                    ★★★★★
                  </div>
                </div>

                <div className="mt-5 font-serif text-4xl leading-none text-[#c29a90]">
                  “
                </div>

                <p className="mt-3 font-serif text-2xl leading-snug text-[#332725]">
                  {review.text}
                </p>

                <div className="mt-6 h-px w-7 bg-[#c98778]" />

                <p className="mt-5 text-sm text-[#5f5552]">
                  {formatDate(review.createdAt)}
                </p>
              </article>
            ))}
          </div>

          {reviews.length === 0 && (
            <div className="mt-8 rounded-[1.4rem] border border-[#ead7d1] bg-white p-8 text-[#5f5552]">
              Отзывы появятся здесь после публикации в админке.
            </div>
          )}
        </div>
      </section>

      <p className="px-6 pb-10 text-center text-sm text-[#8a7a76]">
        Все отзывы проходят модерацию и публикуются только с согласия клиента.
      </p>
    </main>
  );
}
