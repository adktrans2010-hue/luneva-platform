const symptoms = [
  "Тревога, страхи и внутреннее напряжение",
  "Сложности в отношениях и семье",
  "Переживание утраты и жизненных изменений",
  "Низкая самооценка и потеря опоры",
  "Эмоциональное выгорание и усталость",
  "Расстройства пищевого поведения",
];

export default function Symptoms() {
  return (
    <section className="bg-[#fff8f6] px-6 py-24">
      <div className="mx-auto max-w-7xl">

        <p className="mb-4 text-sm uppercase tracking-[0.25em] text-[#c98778]">
          Когда стоит обратиться
        </p>

        <h2 className="max-w-3xl font-serif text-5xl text-[#332725]">
          Я могу быть рядом,
          когда становится сложно
        </h2>

        <p className="mt-6 max-w-2xl text-lg leading-8 text-[#5f5552]">
          В терапии мы бережно исследуем ваши переживания,
          ищем причины трудностей и находим новые способы
          справляться с жизненными ситуациями.
        </p>


        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {symptoms.map((item) => (
            <div
              key={item}
              className="
              rounded-[2rem]
              bg-white
              p-8
              text-[#5f5552]
              shadow-sm
              transition
              hover:-translate-y-1
              hover:shadow-xl
              "
            >
              <div className="mb-6 text-3xl">
                ✦
              </div>

              <p className="text-lg leading-7">
                {item}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}