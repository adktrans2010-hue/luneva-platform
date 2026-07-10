import Image from "next/image";

const steps = [
  {
    title: "Первая встреча",
    text: "Мы знакомимся, обсуждаем ваш запрос и то, с чем сейчас важно разобраться.",
  },
  {
    title: "Бережная работа",
    text: "В безопасном темпе исследуем чувства, переживания и привычные способы реагирования.",
  },
  {
    title: "Поиск опоры",
    text: "Находим новые способы справляться с трудностями и лучше понимать себя.",
  },
];

export default function Process() {
  return (
    <section className="bg-[#fff8f6] px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <div className="relative overflow-hidden rounded-[3rem] border border-[#ead7d1] bg-white shadow-sm">
          <Image
            src="/therapy-process.jpg"
            alt="Как проходит консультация"
            fill
            priority={false}
            sizes="(max-width: 768px) 100vw, 1280px"
            className="object-cover object-[58%_45%]"
          />

          <div className="absolute inset-0 bg-gradient-to-r from-[#fff8f6]/95 via-[#fff8f6]/82 to-[#fff8f6]/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#fff8f6]/95 via-transparent to-[#fff8f6]/20" />

          <div className="relative px-6 py-14 md:px-12 lg:px-16 lg:py-20">
            <div className="mx-auto max-w-3xl text-center">
              <p className="mb-4 text-sm uppercase tracking-[0.25em] text-[#c98778]">
                Процесс терапии
              </p>

              <h2 className="font-serif text-5xl text-[#332725]">
                Как проходит консультация
              </h2>

              <p className="mt-6 text-lg leading-8 text-[#5f5552]">
                Психотерапия - это совместный процесс, где важны доверие,
                бережность и уважение к вашему темпу.
              </p>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {steps.map((step, index) => (
                <article
                  key={step.title}
                  className="rounded-[2rem] border border-white/70 bg-white/88 p-6 shadow-sm backdrop-blur-md transition hover:-translate-y-1 hover:bg-white hover:shadow-xl"
                >
                  <div className="mb-5 flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#fff8f6] font-serif text-xl text-[#c98778]">
                      {index + 1}
                    </div>

                    <h3 className="text-lg font-medium text-[#332725]">
                      {step.title}
                    </h3>
                  </div>

                  <p className="leading-7 text-[#5f5552]">{step.text}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
