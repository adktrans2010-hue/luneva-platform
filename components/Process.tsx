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
        <div className="overflow-hidden rounded-[3rem] border border-[#ead7d1] bg-white shadow-sm">
          <div className="relative h-72 md:h-96 lg:h-[460px]">
            <Image
              src="/therapy-process.jpg"
              alt="Как проходит консультация"
              fill
              priority={false}
              sizes="(max-width: 768px) 100vw, 1280px"
              className="object-cover object-[52%_34%]"
            />
            <div className="absolute inset-0 bg-[#332725]/15" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#fff8f6]/35 via-transparent to-transparent" />
          </div>

          <div className="bg-[#fff8f6] px-6 py-12 md:px-12 lg:px-16">
            <div className="mx-auto max-w-3xl text-center">
              <p className="mb-3 text-sm uppercase tracking-[0.25em] text-[#c98778]">
                Процесс терапии
              </p>

              <h2 className="font-serif text-5xl leading-tight text-[#332725]">
                Как проходит консультация
              </h2>

              <p className="mt-5 text-lg leading-8 text-[#5f5552]">
                Психотерапия - это совместный процесс, где важны доверие,
                бережность и уважение к вашему темпу.
              </p>
            </div>

            <div className="mt-12 grid gap-8 lg:grid-cols-3">
              {steps.map((step, index) => (
                <article
                  key={step.title}
                  className="relative flex gap-5"
                >
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#f6dfd8] font-serif text-xl text-[#c98778]">
                      {index + 1}
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-[#332725]">
                      {step.title}
                    </h3>

                    <p className="mt-3 leading-7 text-[#5f5552]">{step.text}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
