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

        <p className="mb-4 text-sm uppercase tracking-[0.25em] text-[#c98778]">
          Процесс терапии
        </p>

        <h2 className="font-serif text-5xl text-[#332725]">
          Как проходит консультация
        </h2>

        <p className="mt-6 max-w-2xl text-lg leading-8 text-[#5f5552]">
          Психотерапия — это совместный процесс, где важны доверие,
          бережность и уважение к вашему темпу.
        </p>

        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {steps.map((step, index) => (
            <div
              key={step.title}
              className="
                rounded-[2rem]
                bg-white
                p-8
                shadow-sm
                border
                border-[#ead7d1]
              "
            >
              <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-full bg-[#fff8f6] font-serif text-2xl text-[#c98778]">
                {index + 1}
              </div>

              <h3 className="text-xl font-medium text-[#332725]">
                {step.title}
              </h3>

              <p className="mt-4 leading-7 text-[#5f5552]">
                {step.text}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}