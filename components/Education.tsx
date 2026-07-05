import Image from "next/image";
import Link from "next/link";

const education = [
  {
    name: "МИГИП",
    image: "/education/migip.png",
  },
  {
    name: "Бакалавр-Магистр",
    image: "/education/bakalavr.png",
  },
  {
    name: "Институт профессионального образования",
    image: "/education/ipo.png",
  },
  {
    name: "Сфера",
    image: "/education/sfera.png",
  },
  {
    name: "МАГ",
    image: "/education/mag.png",
  },
  {
    name: "Метафора",
    image: "/education/metafora.png",
  },
];

export default function Education() {
  return (
    <section className="bg-[#fff8f6] px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <p className="mb-4 text-sm uppercase tracking-[0.25em] text-[#c98778]">
          Образование и развитие
        </p>

        <div className="grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {education.map((item) => (
              <div
                key={item.name}
                className="flex h-32 items-center justify-center rounded-2xl border border-[#ead7d1] bg-white p-6 shadow-sm"
              >
                <Image
                  src={item.image}
                  alt={item.name}
                  width={220}
                  height={120}
                  className="max-h-20 w-auto object-contain"
                />
              </div>
            ))}
          </div>

          <div>
            <h2 className="font-serif text-5xl leading-tight text-[#332725]">
              Дипломы и сертификаты
            </h2>

            <div className="my-8 h-[2px] w-20 bg-[#c98778]" />

            <p className="text-lg leading-8 text-[#5f5552]">
              В этом разделе вы можете ознакомиться с дипломами,
              сертификатами и документами о профессиональном обучении
              Александры.
            </p>

            <Link
              href="/certificates"
              className="mt-10 inline-flex rounded-2xl bg-white px-8 py-4 text-[#332725] shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              Смотреть все сертификаты →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}