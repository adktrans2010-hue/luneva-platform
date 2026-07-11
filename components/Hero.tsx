import Image from "next/image";
import Link from "next/link";

import DecorLeaf from "@/components/DecorLeaf";

export default function Hero() {
  return (
    <section className="bg-[#fff8f6] px-6 sm:px-10">
      <div className="relative mx-auto max-w-7xl overflow-hidden md:min-h-[760px]">
        <div className="relative z-10 flex flex-col py-12 md:min-h-[760px] md:justify-center md:py-20">
          <div className="max-w-[540px]">
            <p className="mb-6 text-xs uppercase tracking-[0.32em] text-[#c98778] sm:text-sm md:mb-8">
              Психолог · Гештальт-терапевт
            </p>

            <h1 className="font-serif text-4xl leading-[1.08] text-[#332725] sm:text-5xl md:text-6xl xl:text-7xl">
              Лунева <br />
              Александра <br />
              Александровна
            </h1>

            <div className="my-7 h-px w-16 bg-[#c98778] md:my-8" />

            <p className="max-w-md text-base leading-7 text-[#5f5552] md:text-lg md:leading-8">
              Бережная психологическая помощь подросткам и взрослым.
            </p>

            <div className="mt-7 flex max-w-[520px] gap-4 rounded-2xl border border-white/70 bg-white/68 p-4 shadow-[0_18px_55px_rgba(94,55,45,0.08)] backdrop-blur-sm md:mt-8 md:gap-5 md:p-5">
              <DecorLeaf className="shrink-0 text-3xl text-[#c98778] md:text-4xl" />

              <p className="font-serif text-lg leading-relaxed text-[#9f6a60] md:text-xl">
                Когда становится трудно, важно, чтобы рядом был человек!
              </p>
            </div>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row md:mt-9">
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

        <div className="relative h-[430px] overflow-hidden rounded-[2rem] sm:h-[520px] md:absolute md:inset-y-0 md:right-0 md:h-auto md:w-[76%] md:rounded-none">
          <Image
            src="/sasha-hero.jpg"
            alt="Лунева Александра Александровна"
            fill
            priority
            sizes="(min-width: 1280px) 972px, (min-width: 768px) 76vw, 100vw"
            className="object-cover object-[64%_50%] contrast-[1.04] saturate-[1.08] md:object-[55%_48%]"
          />
        </div>

        <div className="pointer-events-none absolute inset-0 hidden bg-[linear-gradient(90deg,#fff8f6_0%,rgba(255,248,246,0.98)_31%,rgba(255,248,246,0.78)_45%,rgba(255,248,246,0.24)_62%,rgba(255,248,246,0.03)_100%)] md:block" />
        <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-[54%] bg-[radial-gradient(circle_at_22%_52%,rgba(255,255,255,0.56),rgba(255,248,246,0)_66%)] md:block" />
      </div>
    </section>
  );
}
