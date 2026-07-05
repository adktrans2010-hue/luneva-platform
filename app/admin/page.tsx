import Link from "next/link";

const adminSections = [
  {
    title: "Отзывы",
    text: "Добавлять, редактировать и скрывать отзывы клиентов.",
    href: "/admin/reviews",
  },
  {
    title: "Статьи",
    text: "Публиковать материалы блога и полезные заметки.",
    href: "/admin/blog",
  },
  {
    title: "Сертификаты",
    text: "Обновлять дипломы, сертификаты и документы.",
    href: "/admin/certificates",
  },
  {
    title: "Контакты",
    text: "Менять способы связи, ссылки Telegram, WhatsApp и email.",
    href: "/admin/contacts",
  },
];

export default function AdminPage() {
  return (
    <section className="luneva-fade bg-[#fff8f6] px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <p className="mb-4 text-sm uppercase tracking-[0.25em] text-[#c98778]">
          Luneva Admin
        </p>

        <h1 className="max-w-4xl font-serif text-6xl leading-tight text-[#332725]">
          Панель управления сайтом
        </h1>

        <p className="mt-8 max-w-3xl text-lg leading-8 text-[#5f5552]">
          Здесь Саша сможет управлять содержимым сайта без работы с кодом:
          отзывами, статьями, сертификатами и контактами.
        </p>

        <div className="mt-14 rounded-[3rem] border border-[#ead7d1] bg-white p-8 shadow-sm md:p-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-serif text-4xl text-[#332725]">
                Вход администратора
              </h2>

              <p className="mt-4 max-w-2xl leading-7 text-[#5f5552]">
                Авторизация будет подключена следующим шагом. Сейчас это
                визуальная основа будущей админки.
              </p>
            </div>

            <div className="rounded-2xl bg-[#fff8f6] px-6 py-4 text-sm uppercase tracking-[0.2em] text-[#c98778]">
              Draft mode
            </div>
          </div>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {adminSections.map((section) => (
            <Link
              key={section.title}
              href={section.href}
              className="luneva-card rounded-[2rem] border border-[#ead7d1] bg-white p-8 shadow-sm"
            >
              <div className="mb-6 text-3xl text-[#c98778]">✦</div>

              <h2 className="text-xl font-medium text-[#332725]">
                {section.title}
              </h2>

              <p className="mt-4 leading-7 text-[#5f5552]">
                {section.text}
              </p>

              <span className="mt-8 inline-flex text-[#c98778]">
                Открыть →
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-16 rounded-[3rem] bg-[#332725] p-10 text-white md:p-14">
          <h2 className="font-serif text-4xl">
            Следующий этап
          </h2>

          <p className="mt-6 max-w-2xl leading-8 text-[#ead7d1]">
            Подключим простую защиту входа, затем сделаем первый настоящий
            раздел управления отзывами: форма добавления, список отзывов и
            сохранение данных.
          </p>
        </div>
      </div>
    </section>
  );
}