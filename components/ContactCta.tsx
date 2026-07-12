export default function ContactCta() {
  return (
    <section className="bg-[#fff8f6] px-6 py-20 sm:px-10">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] border border-[#f0ddd7] bg-[linear-gradient(105deg,#fffaf8_0%,#fff6f2_48%,#f7e8e1_100%)] px-6 py-8 shadow-[0_24px_70px_rgba(94,55,45,0.08)] sm:px-10 md:px-14 md:py-10">
        <div className="relative z-10 max-w-2xl">
          <p className="mb-4 text-sm uppercase tracking-[0.25em] text-[#c98778]">
            Запись на консультацию
          </p>

          <h2 className="max-w-xl font-serif text-3xl leading-tight text-[#332725] sm:text-4xl md:text-5xl">
            Если вы чувствуете, что готовы поговорить о важном
          </h2>

          <p className="mt-5 max-w-xl text-base leading-7 text-[#6a5d59] md:text-lg md:leading-8">
            Оставьте заявку, и мы обсудим ваш запрос, формат работы и первый
            удобный шаг к консультации.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <a
              href="/contacts#booking"
              className="rounded-xl bg-[#e9a194] px-6 py-3 text-sm font-medium text-white shadow-sm transition hover:-translate-y-1 hover:bg-[#d98779]"
            >
              Записаться онлайн →
            </a>

            <a
              href="/about"
              className="rounded-xl border border-[#e5bdb4] bg-white/72 px-6 py-3 text-sm font-medium text-[#6a4039] shadow-sm transition hover:-translate-y-1 hover:bg-white"
            >
              Узнать обо мне
            </a>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[46%] md:block">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_68%_52%,rgba(255,255,255,0.86),rgba(255,255,255,0.18)_48%,rgba(255,255,255,0)_70%)]" />
          <div className="absolute bottom-4 right-0 h-20 w-[92%] rounded-l-full bg-[linear-gradient(90deg,rgba(246,221,211,0.28),rgba(255,255,255,0.86))]" />
          <div className="absolute bottom-12 right-20 h-24 w-16 rounded-[999px_999px_42px_42px] bg-[linear-gradient(140deg,#f4ded5,#fff8f5_54%,#d8b1a5)] shadow-[0_24px_50px_rgba(94,55,45,0.12)]" />
          <div className="absolute bottom-[8.4rem] right-[6.75rem] h-10 w-7 rounded-t-full bg-[#f0d2c8]" />
          <div className="absolute bottom-[10.1rem] right-[7.45rem] h-28 w-px rotate-[-26deg] bg-[#cfa596]" />
          <div className="absolute bottom-[10.35rem] right-[7.55rem] h-24 w-px rotate-[18deg] bg-[#cfa596]" />
          <div className="absolute bottom-[10.3rem] right-[7.35rem] h-20 w-px rotate-[47deg] bg-[#cfa596]" />
          <div className="absolute bottom-[11.6rem] right-[9.6rem] h-8 w-px rotate-[62deg] bg-[#cfa596]" />
          <div className="absolute bottom-[12.15rem] right-[6.25rem] h-9 w-px rotate-[-48deg] bg-[#cfa596]" />
          <div className="absolute bottom-[13.05rem] right-[8.9rem] h-2 w-2 rounded-full bg-[#d8b1a5]" />
          <div className="absolute bottom-[12.1rem] right-[5.55rem] h-2 w-2 rounded-full bg-[#d8b1a5]" />
          <div className="absolute bottom-[11.6rem] right-[10.55rem] h-2 w-2 rounded-full bg-[#d8b1a5]" />
          <div className="absolute bottom-[15rem] right-[7.3rem] h-2 w-2 rounded-full bg-[#d8b1a5]" />
        </div>
      </div>
    </section>
  );
}
