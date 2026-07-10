export default function ContactCta() {
  return (
    <section className="bg-[#fff8f6] px-6 py-24">
      <div className="mx-auto max-w-7xl rounded-[3rem] bg-[#332725] p-10 text-white md:p-16">
        <p className="mb-4 text-sm uppercase tracking-[0.25em] text-[#e7b8ad]">
          Запись на консультацию
        </p>

        <h2 className="font-serif text-5xl leading-tight">
          Если вы чувствуете, что готовы поговорить о важном
        </h2>

        <p className="mt-6 max-w-2xl text-lg leading-8 text-[#ead7d1]">
          Оставьте заявку, и мы обсудим ваш запрос, формат работы и первый
          удобный шаг к консультации.
        </p>

        <div className="mt-10 flex flex-wrap gap-4">
          <a
            href="/contacts#booking"
            className="rounded-2xl bg-white px-8 py-4 text-[#332725]"
          >
            Записаться онлайн
          </a>

          <a
            href="/about"
            className="rounded-2xl border border-[#e7b8ad] px-8 py-4 text-white"
          >
            Узнать обо мне
          </a>
        </div>
      </div>
    </section>
  );
}
