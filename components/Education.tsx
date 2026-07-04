const education = [
  {
    year: "2015",
    title: "Психологическое образование",
    text: "Получение профессиональной подготовки в области психологии.",
  },
  {
    year: "2018",
    title: "Гештальт-терапия",
    text: "Длительное обучение и практика в гештальт-подходе.",
  },
  {
    year: "2020",
    title: "Работа с травмой и ПТСР",
    text: "Дополнительная специализация по работе с травматическим опытом.",
  },
  {
    year: "2022",
    title: "Расстройства пищевого поведения",
    text: "Специализация по психологической помощи при РПП.",
  },
];

export default function Education() {
  return (
    <section className="bg-[#fff8f6] px-6 py-24">
      <div className="mx-auto max-w-7xl">

        <p className="mb-4 text-sm uppercase tracking-[0.25em] text-[#c98778]">
          Профессиональный путь
        </p>

        <h2 className="font-serif text-5xl text-[#332725]">
          Образование и опыт
        </h2>

        <p className="mt-6 max-w-2xl text-lg leading-8 text-[#5f5552]">
          Постоянное обучение и развитие — важная часть моей
          профессиональной практики и ответственности перед клиентами.
        </p>


        <div className="mt-14 space-y-6">
          {education.map((item) => (
            <div
              key={item.title}
              className="
                grid gap-6
                rounded-[2rem]
                bg-white
                p-8
                shadow-sm
                md:grid-cols-[120px_1fr]
              "
            >
              <div className="font-serif text-4xl text-[#c98778]">
                {item.year}
              </div>

              <div>
                <h3 className="text-xl font-medium text-[#332725]">
                  {item.title}
                </h3>

                <p className="mt-3 leading-7 text-[#5f5552]">
                  {item.text}
                </p>
              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
}