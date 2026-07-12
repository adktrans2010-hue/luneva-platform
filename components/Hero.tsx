import Image from "next/image";
import Link from "next/link";

import Container from "@/components/Container";

function BranchIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 52 52"
      className="h-14 w-14 shrink-0 text-[#d88e84]"
      fill="none"
    >
      <path
        d="M16 43c8-11 11-23 10-35"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M25 22c-6-3-10-7-12-13M24 28c7-3 12-8 15-15M21 34c-6-1-11-4-15-9M20 38c8 1 15-1 21-6"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      {[13, 18, 24, 31, 36, 41].map((x, index) => (
        <circle
          key={x}
          cx={x}
          cy={[9, 22, 16, 30, 14, 32][index]}
          r="2.3"
          fill="currentColor"
          opacity="0.7"
        />
      ))}
    </svg>
  );
}

export default function Hero() {
  return (
    <section className="bg-[#fff8f6] py-8 md:py-10">
      <Container>
        <div className="relative min-h-[720px] overflow-hidden rounded-[32px] border border-[#f0ddd6] bg-[#fbf5f2] shadow-[0_18px_70px_rgba(94,55,45,0.05)] md:h-[720px] md:min-h-0">
          <div className="absolute inset-y-0 right-0 hidden w-[62%] md:block">
            <Image
              src="/sasha-hero.jpg"
              alt="Лунева Александра Александровна"
              fill
              priority
              sizes="(min-width: 1280px) 794px, 62vw"
              className="object-cover object-[36%_50%]"
            />
          </div>

          <div className="pointer-events-none absolute inset-y-0 left-0 right-[20%] hidden bg-[linear-gradient(90deg,#fbf5f2_0%,#fbf5f2_39%,rgba(251,245,242,0.96)_49%,rgba(251,245,242,0.72)_61%,rgba(251,245,242,0.34)_75%,rgba(251,245,242,0.08)_91%,rgba(251,245,242,0)_100%)] md:block" />

          <div className="relative z-10 flex min-h-[720px] w-full flex-col md:h-full md:min-h-0 md:w-[46%]">
            <div className="flex flex-1 flex-col justify-center px-8 py-12 sm:px-12 md:px-16 lg:px-[72px]">
              <p className="mb-8 text-[13px] uppercase tracking-[0.42em] text-[#cf7f78]">
                ПСИХОЛОГ · ГЕШТАЛЬТ-ТЕРАПЕВТ
              </p>

              <h1 className="font-serif text-[43px] font-normal leading-[1.12] text-[#332725] sm:text-[61px] lg:text-[66px]">
                Лунева
                <br />
                Александра
                <br />
                Александровна
              </h1>

              <div className="mt-7 h-px w-[58px] bg-[#c98778]" />

              <p className="mt-6 max-w-[440px] text-[22px] leading-[1.55] text-[#4f4642]">
                Бережная психологическая помощь
                <br />
                подросткам и взрослым.
              </p>

              <div className="mt-8 flex max-w-[455px] items-center gap-6 rounded-[22px] border border-white/70 bg-white/54 px-5 py-4 shadow-[0_20px_60px_rgba(94,55,45,0.06)] backdrop-blur-sm">
                <BranchIcon />
                <p className="font-serif text-[20px] leading-[1.62] text-[#c87970]">
                  Когда становится трудно, важно,
                  <br />
                  чтобы рядом был человек!
                </p>
              </div>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:gap-6">
                <Link
                  href="/contacts#booking"
                  className="inline-flex h-[58px] w-full items-center justify-center rounded-2xl bg-[#332725] text-[16px] font-medium text-white shadow-[0_18px_42px_rgba(51,39,37,0.16)] transition duration-300 hover:translate-y-[-2px] sm:w-[294px]"
                >
                  Записаться на консультацию →
                </Link>

                <Link
                  href="/about"
                  className="inline-flex h-[58px] w-full items-center justify-center rounded-2xl border border-[#d7958c] bg-white/28 text-[16px] font-medium text-[#8d443e] transition duration-300 hover:translate-y-[-2px] sm:w-[178px]"
                >
                  Узнать обо мне
                </Link>
              </div>
            </div>

            <div className="relative h-[390px] overflow-hidden md:hidden">
              <Image
                src="/sasha-hero.jpg"
                alt="Лунева Александра Александровна"
                fill
                priority
                sizes="100vw"
                className="object-cover object-[69%_50%]"
              />
              <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#fbf5f2] to-transparent" />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
