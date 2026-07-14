import Link from "next/link";

import MobileCarousel from "@/components/MobileCarousel";
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
                <h3 className="text-base font-semibold uppercase tracking-[0.12em] text-[#332725]">
                  {item.title}
                </h3>

                <div className="mx-auto mt-6 h-[2px] w-20 bg-[#c98778]" />

                <p className="mt-7 text-lg leading-8 text-[#5f5552]">
                  {item.description}, стоимость{" "}
                  <span className="font-semibold text-[#332725]">
                    {formatPrice(item.price)}
                  </span>{" "}
                  руб.
                </p>

                {item.oldPrice && (
                  <p className="mt-3 text-sm font-semibold text-[#8a7a76] line-through">
                    {formatPrice(item.oldPrice)} руб
                  </p>
                )}
              </div>

              <Link
                href="/contacts#booking"
                className="mt-8 inline-flex min-w-44 justify-center rounded-2xl bg-[#332725] px-8 py-4 font-semibold text-white shadow-lg transition group-hover:bg-[#4a3935]"
              >
                {item.buttonText}
              </Link>
            </article>
          ))}
        </MobileCarousel>
      </div>
    </section>
  );
}
