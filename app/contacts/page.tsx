import Link from "next/link";

const contacts = [
  {
    title: "Запись на консультацию",
    text: "Вы можете оставить заявку, и мы спокойно обсудим ваш запрос и возможный формат работы.",
  },
  {
    title: "Онлайн-формат",
    text: "Консультации проходят онлайн — в безопасном и комфортном пространстве из любой точки мира.",
  },
  {
    title: "Первый шаг",
    text: "Не обязательно заранее точно формулировать проблему. Достаточно желания разобраться в том, что происходит.",
  },
];

export default function ContactsPage() {
  return (
    <section className="luneva-fade bg-[#fff8f6] px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <p className="mb-4 text-sm uppercase tracking-[0.25em] text-[#c98778]">
          Контакты
        </p>

        <h1 className="max-w-4xl font-serif text-6xl leading-tight text-[#332725]">
          Сделайте первый шаг к себе
        </h1>

        <p className="mt-8 max-w-3xl text-lg leading-8 text-[#5f5552]">
          Если вы чувствуете, что сейчас подходящий момент обратиться за
          поддержкой — можно начать с простого сообщения.
        </p>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {contacts.map((item) => (
            <div
              key={item.title}
              className="luneva-card rounded-[2rem] border border-[#ead7d1] bg-white p-8 shadow-sm"
            >
              <div className="mb-6 text-3xl text-[#c98778]">✦</div>

              <h2 className="text-xl font-medium text-[#332725]">
                {item.title}
              </h2>

              <p className="mt-4 leading-7 text-[#5f5552]">{item.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 rounded-[3rem] bg-white p-10 shadow-sm md:p-14">
          <h2 className="font-serif text-4xl text-[#332725]">
            Написать сообщение
          </h2>

          <p className="mt-5 max-w-2xl leading-8 text-[#5f5552]">
            Форма записи появится здесь позже. Сейчас можно подключить любой
            удобный способ связи — Telegram, WhatsApp или email.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="#"
              className="rounded-2xl bg-[#332725] px-8 py-4 text-white"
            >
              Telegram
            </Link>

            <Link
              href="#"
              className="rounded-2xl border border-[#332725] px-8 py-4 text-[#332725]"
            >
              Email
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}