import Image from "next/image";

export default function Hero() {
  return (
    <section className="bg-[#fff8f6] px-6 py-12 md:py-16">
      <div className="mx-auto grid max-w-[1500px] items-center gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:gap-16">
        <div>
          <p className="mb-5 text-sm uppercase tracking-[0.25em] text-[#c98778]">
            Психолог • Гештальт-терапевт
          </p>

          <h1 className="font-serif text-4xl leading-tight text-[#332725] sm:text-5xl md:text-7xl">
            Лунева <br />
            Александра <br />
            Александровна
          </h1>

          <div className="my-7 h-[2px] w-16 bg-[#c98778]" />

          <p className="max-w-xl text-base leading-8 text-[#5f5552] md:text-lg">
            Бережная психологическая помощь взрослым и подросткам.
            Поддержка в трудных ситуациях, понимание себя
            и обретение внутренней опоры.
          </p>

          <div className="mt-8 rounded-[2rem] border border-[#ead7d1] bg-white/70 p-5 shadow-sm md:p-6">
            <p className="font-serif text-xl leading-relaxed text-[#332725] md:text-2xl">
              «Я верю, что внутри каждого человека есть ресурс
              для изменений. Иногда нужен тот, кто поможет его увидеть.»
            </p>

            <p className="mt-4 text-sm text-[#c98778]">
              — Александра Лунева
            </p>
          </div>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <button className="rounded-2xl bg-[#332725] px-8 py-4 text-white shadow-lg">
              Записаться на консультацию
            </button>

            <button className="rounded-2xl border border-[#c98778] px-8 py-4 text-[#332725]">
              Обо мне
            </button>
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-0 rounded-[3rem] bg-[#e7b8ad] opacity-40 blur-3xl" />

          <Image
            src="/sasha-hero.jpg"
            alt="Лунева Александра Александровна"
            width={1200}
            height={1500}
            priority
            className="relative h-[520px] w-full rounded-[3rem] object-cover shadow-2xl sm:h-[640px] lg:h-[780px]"
          />
        </div>
      </div>
    </section>
  );
}