import Image from "next/image";

export default function About() {
  return (
    <section className="bg-[#fff8f6] px-6 py-24">
      <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-2">
        <div className="relative">
          <div className="absolute -inset-4 rounded-[3rem] bg-[#ead7d1] opacity-60 blur-2xl" />

          <Image
            src="/sasha-home-about-yellow.png"
            alt="Лунева Александра Александровна"
            width={800}
            height={1000}
            className="relative h-[620px] w-full rounded-[3rem] object-cover object-[52%_45%] shadow-xl"
          />
        </div>

        <div>
          <p className="mb-4 text-sm uppercase tracking-[0.25em] text-[#c98778]">
            Обо мне
          </p>

          <h2 className="font-serif text-5xl leading-tight text-[#332725]">
            Помогаю бережно разобраться в себе и найти внутреннюю опору
          </h2>

          <p className="mt-6 text-lg leading-8 text-[#5f5552]">
            Я дипломированный психолог, гештальт-терапевт, специалист по работе
            с травмой, утратой, ПТСР и расстройствами пищевого поведения.
          </p>

          <div className="mt-8 grid gap-4">
            {[
              "Дипломированный психолог",
              "Гештальт-терапевт",
              "Специалист по травме и ПТСР",
              "Специалист по расстройствам пищевого поведения",
              "Автор и преподаватель курсов",
            ].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-[#ead7d1] bg-white px-5 py-4 text-[#5f5552]"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
