import Image from "next/image";
import DecorLeaf from "@/components/DecorLeaf";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-[#fff8f6] px-6 py-16 lg:py-20">
      <div className="absolute left-0 top-32 h-[500px] w-[500px] rounded-full bg-[#f3d4cc]/40 blur-[120px]" />
      <div className="absolute bottom-0 right-0 h-[500px] w-[500px] rounded-full bg-[#e7b8ad]/40 blur-[140px]" />

      <DecorLeaf className="absolute bottom-10 left-8 hidden text-[180px] md:block" />

      <div className="relative mx-auto grid max-w-[1500px] items-center gap-16 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="mb-8 text-sm uppercase tracking-[0.35em] text-[#c98778]">
            Психолог • Гештальт-терапевт
          </p>

          <h1 className="font-serif text-5xl leading-[1.05] text-[#332725] md:text-7xl xl:text-8xl">
            Лунева <br />
            Александра <br />
            Александровна
          </h1>

          <div className="my-8 h-[2px] w-16 bg-[#c98778]" />

          <p className="max-w-xl text-lg leading-9 text-[#5f5552]">
            Бережная психологическая помощь взрослым и подросткам. Поддержка в
            трудных ситуациях, понимание себя и обретение внутренней опоры.
          </p>

          <div className="mt-10 flex gap-5 rounded-[2rem] bg-white/50 p-6">
            <DecorLeaf className="text-5xl" />

            <p className="max-w-md font-serif text-2xl leading-relaxed text-[#c98778]">
              Когда становится трудно — важно, чтобы рядом был человек, который
              поможет найти опору.
            </p>
          </div>

          <div className="mt-10 flex flex-col gap-5 sm:flex-row">
            <button className="rounded-2xl bg-[#332725] px-10 py-5 text-white shadow-lg transition hover:-translate-y-1">
              Записаться на консультацию →
            </button>

            <button className="rounded-2xl border border-[#c98778] px-10 py-5 text-[#332725] transition hover:bg-white">
              Обо мне
            </button>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-8 rounded-[4rem] bg-[#e7b8ad]/45 blur-3xl" />
          <div className="absolute -bottom-8 left-10 right-10 h-24 rounded-full bg-[#c98778]/25 blur-3xl" />

          <Image
            src="/sasha-hero.jpg"
            alt="Лунева Александра Александровна"
            width={1200}
            height={1500}
            priority
            className="relative h-[780px] w-full rounded-[4rem] object-cover shadow-2xl"
          />
        </div>
      </div>
    </section>
  );
}