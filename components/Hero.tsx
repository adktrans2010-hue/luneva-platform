import Image from "next/image";

export default function Hero() {
  return (
    <section className="min-h-[85vh] bg-[#fff8f6] px-6 py-16">
      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">

        <div>
          <p className="mb-6 text-sm uppercase tracking-[0.25em] text-[#c98778]">
            Психолог • Гештальт-терапевт
          </p>

          <h1 className="font-serif text-5xl leading-tight text-[#332725] md:text-7xl">
            Лунева <br />
            Александра <br />
            Александровна
          </h1>

          <div className="my-8 h-[2px] w-16 bg-[#c98778]" />

          <p className="max-w-xl text-lg leading-8 text-[#5f5552]">
            Бережная психологическая помощь взрослым и подросткам.
            Поддержка в трудных ситуациях, понимание себя
            и обретение внутренней опоры.
          </p>

          <div className="mt-10 flex gap-5">
            <button className="rounded-2xl bg-[#332725] px-8 py-4 text-white shadow-lg">
              Записаться на консультацию
            </button>

            <button className="rounded-2xl border border-[#c98778] px-8 py-4 text-[#332725]">
              Обо мне
            </button>
          </div>
        </div>


        <div className="relative">
          <div className="absolute inset-0 rounded-[3rem] bg-[#e7b8ad] blur-3xl opacity-40" />

          <Image
            src="/sasha-hero.jpg"
            alt="Лунева Александра Александровна"
            width={900}
            height={1100}
            priority
            className="relative rounded-[3rem] shadow-2xl object-cover"
          />
        </div>

      </div>
    </section>
  );
}