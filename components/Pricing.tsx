import Link from "next/link";

import ServiceViewTracker from "@/components/ServiceViewTracker";
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

        <h2 className="font-serif text-4xl leading-tight md:text-5xl text-[#332725]">
          Форматы консультаций
        </h2>

        <div aria-label="Форматы консультаций" className="mx-auto mt-8 grid max-w-5xl grid-cols-1 gap-5 md:grid-cols-2 md:gap-6">
          {items.map((item) => (
            <article
              key={item.id}
              className="group flex h-full flex-col rounded-[2rem] border border-[#ead7d1] bg-white px-6 py-7 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-xl md:px-8"
            >
              <ServiceViewTracker serviceType={item.code} />
              <div>
                {item.badge && (
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#c98778]">
                    {item.badge}
                  </p>
                )}

                <h3 className="text-base font-semibold uppercase tracking-[0.12em] text-[#332725]">
                  {item.name}
                </h3>

                <div className="mx-auto mt-4 h-[2px] w-20 bg-[#c98778]" />

                <p className="mt-4 text-base leading-7 text-[#5f5552]">
                  {item.sessionsCount === 1 ? "1 консультация" : `${item.sessionsCount} консультаций`}
                  <span className="block">{item.durationMinutes} минут{item.sessionsCount > 1 ? " каждая" : ""}</span>
                  <span className="mt-3 block text-2xl">
                  <span className="font-semibold text-[#332725]">
                    {formatKopeks(item.priceKopeks)}
                  </span>{" "}
                  руб.
                  </span>
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

              <div className="mt-auto pt-5">
              <Link
                href="/contacts#booking"
                className="inline-flex w-full min-w-44 justify-center rounded-2xl bg-[#332725] px-8 py-3 font-semibold text-white shadow-lg transition group-hover:bg-[#4a3935]"
              >
                Записаться
              </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
