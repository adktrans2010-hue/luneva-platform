import Image from "next/image";
import Link from "next/link";

import Container from "@/components/Container";

const heroImageSrc = "/sasha-hero.jpg";
const heroImageSizes =
  "(min-width: 1280px) 794px, (min-width: 768px) 62vw, 100vw";

function BranchIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 52 52"
      className="h-14 w-14 shrink-0 text-[#d88e84]"
      fill="none"
    >
      <path
        d="M13 44c10-12 15-25 15-39"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
      <path
        d="M27 17c-6-4-10-8-12-14M27 24c7-3 13-8 17-16M23 32c-7-1-13-5-17-11M22 38c8 2 16 0 23-6"
        stroke="currentColor"
        strokeWidth="1.45"
        strokeLinecap="round"
      />
      <g fill="currentColor" opacity="0.72">
        <path d="M14 3c5 2 7 6 6 11-5-1-8-5-6-11Z" />
        <path d="M43 8c-2 6-6 9-12 8 1-6 6-9 12-8Z" />
        <path d="M6 20c6 0 10 3 11 8-6 1-10-2-11-8Z" />
        <path d="M45 31c-4 5-9 6-14 3 3-5 8-6 14-3Z" />
        <path d="M15 34c5 2 7 6 6 11-5-1-8-5-6-11Z" />
      </g>
      <g fill="currentColor" opacity="0.46">
        <circle cx="28" cy="24" r="2" />
        <circle cx="23" cy="32" r="1.8" />
        <circle cx="28" cy="16" r="1.7" />
      </g>
    </svg>
  );
}

export default function Hero() {
  return (
    <section className="bg-[#fff8f6] py-8 md:py-10">
      <Container>
        <div className="relative min-h-[720px] overflow-hidden rounded-[32px] border border-[#f0ddd6] bg-[#fbf5f2] shadow-[0_18px_70px_rgba(94,55,45,0.05)] md:h-[720px] md:min-h-0">
          <div className="absolute inset-x-0 bottom-0 h-[390px] md:inset-y-0 md:right-0 md:left-auto md:h-auto md:w-[62%]">
            <Image
              src={heroImageSrc}
              alt="Лунева Александра Александровна"
              fill
              preload
              sizes={heroImageSizes}
              className="object-cover object-[69%_50%] md:object-[36%_50%]"
            />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#fbf5f2] to-transparent md:hidden" />
          </div>

          <div className="pointer-events-none absolute inset-y-0 left-0 right-[20%] hidden bg-[linear-gradient(90deg,#fbf5f2_0%,#fbf5f2_39%,rgba(251,245,242,0.96)_49%,rgba(251,245,242,0.72)_61%,rgba(251,245,242,0.34)_75%,rgba(251,245,242,0.08)_91%,rgba(251,245,242,0)_100%)] md:block" />

          <div className="relative z-10 flex min-h-[720px] w-full flex-col pb-[390px] md:h-full md:min-h-0 md:w-[46%] md:pb-0">
            <div className="flex flex-1 flex-col justify-center px-8 py-12 sm:px-12 md:px-16 lg:px-[72px]">
              <p className="mb-8 text-[13px] uppercase tracking-[0.42em] text-[#cf7f78]">
                ПСИХОЛОГ · ГЕШТАЛЬТ-ТЕРАПЕВТ
              </p>

              <h1 className="font-serif text-[32px] font-normal leading-[1.12] text-[#332725] min-[360px]:text-[36px] min-[400px]:text-[39px] sm:text-[61px] lg:text-[66px]">
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

              <div className="mt-8 flex max-w-[455px] items-center gap-4 rounded-[22px] border border-white/70 bg-white/54 px-5 py-4 shadow-[0_20px_60px_rgba(94,55,45,0.06)] backdrop-blur-sm sm:gap-6 md:items-start">
                <BranchIcon />
                <p className="min-w-0 font-serif text-[19px] leading-[1.62] text-[#c87970] sm:text-[20px]">
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

          </div>
        </div>
      </Container>
    </section>
  );
}
