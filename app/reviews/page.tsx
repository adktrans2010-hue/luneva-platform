import Link from "next/link";
import Reviews from "@/components/Reviews";
import ReviewForm from "@/components/ReviewForm";

export default async function ReviewsPage() {
  return (
    <>
      <section className="bg-[#fff8f6] px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <p className="mb-4 text-sm uppercase tracking-[0.25em] text-[#c98778]">
            Отзывы
          </p>

          <h1 className="max-w-4xl font-serif text-6xl leading-tight text-[#332725]">
            Опыт людей, которые обратились за поддержкой
          </h1>

          <p className="mt-8 max-w-3xl text-lg leading-8 text-[#5f5552]">
            Каждый путь в терапии индивидуален. Здесь собраны спокойные истории
            о том, как люди приходили к большему пониманию себя и внутренней
            опоре.
          </p>

          <div className="mt-10">
            <Link
              href="/contacts"
              className="inline-flex rounded-2xl bg-[#332725] px-8 py-4 text-white shadow-lg"
            >
              Записаться на консультацию
            </Link>
          </div>
        </div>
      </section>

      <ReviewForm />
      <Reviews />
    </>
  );
}