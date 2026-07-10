import Link from "next/link";

import { getPublishedPricingItems } from "@/src/lib/pricing";

function formatPrice(value: number) {
  return new Intl.NumberFormat("ru-RU").format(value);
}

export default async function Pricing() {
  const items = await getPublishedPricingItems();

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

        <div className="mt-12 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {items.map((item) => (
            <article
              key={item.id}
              className="flex min-h-[400px] flex-col items-center justify-between bg-[#f2d6cc] px-8 py-14 text-center shadow-sm"
            >
              <div>
                <h3 className="text-base font-semibold uppercase tracking-[0.12em] text-[#332725]">
                  {item.title}
                </h3>

                <div className="mx-auto mt-7 h-[2px] w-28 bg-[#332725]" />

                <p className="mt-7 text-xl leading-8 text-[#332725]">
                  {item.description}, стоимость{" "}
                  <span className="font-semibold">
                    {formatPrice(item.price)}
                  </span>{" "}
                  руб.
                </p>

                {item.oldPrice && (
                  <p className="mt-3 text-sm font-semibold text-[#1f1715] line-through">
                    {formatPrice(item.oldPrice)} руб
                  </p>
                )}
              </div>

              <Link
                href="/contacts#booking"
                className="mt-8 inline-flex min-w-44 justify-center rounded bg-white px-8 py-4 font-semibold text-[#1f1715] transition hover:-translate-y-1"
              >
                {item.buttonText}
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
