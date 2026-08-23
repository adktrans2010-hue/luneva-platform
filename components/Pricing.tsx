import Link from "next/link";

import MobileCarousel from "@/components/MobileCarousel";
import {
  formatKopeks,
  getPublicConsultationProducts,
} from "@/src/lib/consultation-products";

export default async function Pricing() {
  const items = await getPublicConsultationProducts();

  if (items.length === 0) {
    return null;
  }

  return (
    <section className="bg-[#fff8f6] px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <p className="mb-4 text-sm uppercase tracking-[0.25em] text-[#c98778]">
          Стоимость
        </p>

        <h2 className="font-serif text-5xl leading-tight text-[#332725]">
          Форматы консультаций
        </h2>

        <MobileCarousel
          label="Форматы консультаций"
          className="mt-12"
          desktopGridClassName="md:grid-cols-2 md:gap-6 xl:grid-cols-4"
        >
          {items.map((item) => (
            <article
              key={item.id}
              className="group flex min-h-[420px] flex-col justify-between rounded-[2rem] border border-[#ead7d1] bg-white px-8 py-10 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div>
                {item.badge && (
                  <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#c98778]">
                    {item.badge}
                  </p>
                )}

                <h3 className="text-base font-semibold uppercase tracking-[0.12em] text-[#332725]">
                  {item.name}
                </h3>

                <div className="mx-auto mt-6 h-[2px] w-20 bg-[#c98778]" />

                <p className="mt-7 text-lg leading-8 text-[#5f5552]">
                  {`${item.sessionsCount} консультаций, ${item.durationMinutes} минут`}
                  , стоимость{" "}
                  <span className="font-semibold text-[#332725]">
                    {formatKopeks(item.priceKopeks)}
                  </span>{" "}
                  руб.
                </p>

                {item.oldPriceKopeks && (
                  <p className="mt-3 text-sm font-semibold text-[#8a7a76] line-through">
                    {formatKopeks(item.oldPriceKopeks)} руб.
                  </p>
                )}

                {item.savingsKopeks && (
                  <p className="mt-3 text-sm font-semibold text-[#c98778]">
                    Экономия {formatKopeks(item.savingsKopeks)} руб.
                  </p>
                )}
              </div>

              <Link
                href="/contacts#booking"
                className="mt-8 inline-flex min-w-44 justify-center rounded-2xl bg-[#332725] px-8 py-4 font-semibold text-white shadow-lg transition group-hover:bg-[#4a3935]"
              >
                Записаться
              </Link>
            </article>
          ))}
        </MobileCarousel>
      </div>
    </section>
  );
}
