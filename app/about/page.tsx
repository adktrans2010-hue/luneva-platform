import Image from "next/image";
import Link from "next/link";
import { getSeoPage, seoToMetadata } from "@/src/lib/seo";

export async function generateMetadata() {
  return seoToMetadata(await getSeoPage("/about"));
}

export default function AboutPage() {
  return (
    <section className="bg-[#fff8f6] px-6 py-24">
      <div className="mx-auto grid max-w-7xl gap-16 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="relative">
          <div className="absolute -inset-6 rounded-[4rem] bg-[#e7b8ad]/40 blur-3xl" />

          <Image
            src="/sasha-about-page.jpg"
            alt="Лунева Александра Александровна"
            width={1800}
            height={1200}
            className="relative h-[620px] w-full rounded-[4rem] object-cover object-[58%_42%] shadow-2xl"
          />
        </div>

        <div>
          <p className="mb-4 text-sm uppercase tracking-[0.25em] text-[#c98778]">
            Обо мне
          </p>

          <h1 className="font-serif text-6xl leading-tight text-[#332725]">
            Лунева Александра Александровна
          </h1>

          <p className="mt-8 text-lg leading-8 text-[#5f5552]">
            Я дипломированный психолог, гештальт-терапевт, специалист по работе
            с травмой, утратой, ПТСР и расстройствами пищевого поведения.
          </p>

          <p className="mt-6 text-lg leading-8 text-[#5f5552]">
            В своей работе я опираюсь на бережность, конфиденциальность и
            уважение к темпу клиента. Для меня важно создать пространство, где
            можно говорить о сложном без давления и оценки.
          </p>

          <div className="mt-10 grid gap-4">
            {[
              "Гештальт-терапия",
              "Работа с травмой и ПТСР",
              "Расстройства пищевого поведения",
              "Поддержка в кризисных состояниях",
            ].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-[#ead7d1] bg-white px-5 py-4 text-[#5f5552]"
              >
                {item}
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/certificates"
              className="rounded-2xl bg-[#332725] px-8 py-4 text-white shadow-lg"
            >
              Дипломы и сертификаты
            </Link>

            <Link
              href="/contacts#booking"
              className="rounded-2xl border border-[#c98778] px-8 py-4 text-[#332725]"
            >
              Записаться
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
