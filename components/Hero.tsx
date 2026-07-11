import Image from "next/image";
import Link from "next/link";

import DecorLeaf from "@/components/DecorLeaf";

export default function Hero() {
  return (
    <section className="bg-[#fff8f6] px-6 sm:px-10">
      <div className="relative mx-auto min-h-[760px] max-w-7xl overflow-hidden">
        <div className="absolute inset-y-0 right-0 w-[76%] overflow-hidden">
          <Image
            src="/sasha-hero.jpg"
            alt="Лунева Александра Александровна"
            fill
            priority
            sizes="(min-width: 1280px) 972px, 76vw"
            className="object-cover object-[55%_48%] contrast-[1.04] saturate-[1.08]"
          />
        </div>

        <div className="absolute inset-0 bg-[linear-gradient(90deg,#fff8f6_0%,rgba(255,248,246,0.98)_31%,rgba(255,248,246,0.78)_45%,rgba(255,248,246,0.24)_62%,rgba(255,248,246,0.03)_100%)]" />
        <div className="absolute inset-y-0 left-0 w-[54%] bg-[radial-gradient(circle_at_22%_52%,rgba(255,255,255,0.56),rgba(255,248,246,0)_66%)]" />

        <div className="relative z-10 flex min-h-[760px] items-center py-20">
          <div className="max-w-[540px]">
            <p className="mb-8 text-sm uppercase tracking-[0.35em] text-[#c98778]">
              Психолог · Гештальт-терапевт
            </p>

            <h1 className="font-serif text-5xl leading-[1.08] text-[#332725] md:text-6xl xl:text-7xl">
              Лунева <br />
              Александра <br />
              Александровна
            </h1>

            <div className="my-8 h-px w-16 bg-[#c98778]" />

            <p className="max-w-md text-lg leading-8 text-[#5f5552]">
              Бережная психологическая помощь подросткам и взрослым.
            </p>

            <div className="mt-8 flex max-w-[520px] gap-5 rounded-2xl border border-white/70 bg-white/62 p-5 shadow-[0_18px_55px_rgba(94,55,45,0.08)] backdrop-blur-sm">
              <DecorLeaf className="shrink-0 text-4xl text-[#c98778]" />

              <p className="font-serif text-xl leading-relaxed text-[#9f6a60]">
                Когда становится трудно, важно, чтобы рядом был человек!
              </p>
            </div>

            <div className="mt-9 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/contacts#booking"
                className="rounded-2xl bg-[#332725] px-8 py-4 text-center text-white shadow-lg shadow-[#332725]/15 transition hover:-translate-y-1"
              >
                Записаться на консультацию →
              </Link>

              <Link
                href="/about"
                className="rounded-2xl border border-[#c98778]/50 bg-white/72 px-8 py-4 text-center text-[#332725] shadow-sm backdrop-blur-sm transition hover:bg-white"
              >
                Узнать обо мне
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
