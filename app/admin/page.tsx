import Link from "next/link";
import { cookies } from "next/headers";

import { AdminCsrfField } from "@/components/admin/admin-csrf-field";
import { ADMIN_COOKIE_NAME, authorizeAdminSession } from "@/src/lib/admin-auth";

const adminSections = [
  {
    title: "AI · Диалоги",
    text: "Чувствительные AI-диалоги и ответы human operator. Только clinical_admin.",
    href: "/admin/ai/conversations",
    clinical: true,
  },
  {
    title: "AI · Требуют внимания",
    text: "Safety alerts и запросы участия Александры. Только clinical_admin.",
    href: "/admin/ai/attention",
    clinical: true,
  },
  {
    title: "AI · База знаний",
    text: "Загружать и активировать утверждённые материалы для AI-помощника.",
    href: "/admin/ai/knowledge",
  },
  {
    title: "Отзывы",
    text: "Добавлять, редактировать и скрывать отзывы клиентов.",
    href: "/admin/reviews",
  },
  {
    title: "Полезные статьи",
    text: "Список статей, категории, поиск, похожие материалы и SEO-страницы.",
    href: "/admin/blog",
  },
  {
    title: "Видео",
    text: "Добавлять короткие и длинные видео, темы и внешние ссылки.",
    href: "/admin/videos",
  },
  {
    title: "Услуги и стоимость",
    text: "Добавлять услуги, менять цены, описание, формат и длительность.",
    href: "/admin/pricing",
  },
  {
    title: "Дипломы и сертификаты",
    text: "Обновлять дипломы, сертификаты и документы.",
    href: "/admin/certificates",
  },
  {
    title: "FAQ",
    text: "Добавлять частые вопросы и ответы, менять порядок и видимость.",
    href: "/admin/faq",
  },
  {
    title: "Страницы сайта",
    text: "Создавать информационные страницы и редактировать их содержимое.",
    href: "/admin/pages",
  },
  {
    title: "Заявки",
    text: "Смотреть обращения из формы онлайн-записи и вести календарь.",
    href: "/admin/appointments",
  },
  {
    title: "Пакеты консультаций",
    text: "Добавлять оплаченные пакеты клиентам и видеть остаток консультаций.",
    href: "/admin/packages",
  },
  {
    title: "Клиенты",
    text: "Список зарегистрированных клиентов, контакты, почта, блокировка и безопасное удаление.",
    href: "/admin/clients",
  },
  {
    title: "Редактор SEO",
    text: "Настраивать адреса страниц, заголовки, описания, карту сайта и микроразметку.",
    href: "/admin/seo",
  },
  {
    title: "Как живёт сайт",
    text: "Смотреть посетителей, популярные страницы, статьи, видео, записи и источники переходов.",
    href: "/admin/site-life",
  },
  {
    title: "Настройки администратора",
    text: "Менять почту, телефон и включать вход с Google Authenticator.",
    href: "/admin/settings",
  },
  {
    title: "Журнал входов",
    text: "Проверять успешные и отклонённые входы, IP-адреса и блокировки.",
    href: "/admin/login-history",
  },
];

export default async function AdminPage() {
  const token = (await cookies()).get(ADMIN_COOKIE_NAME)?.value;
  const authorization = await authorizeAdminSession(token, ["admin", "clinical_admin"]);
  const visibleSections = adminSections.filter((section) => !section.clinical || (authorization.authorized && authorization.session.role === "clinical_admin"));
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
          Здесь можно управлять содержимым сайта: отзывами, статьями, видео,
          стоимостью, SEO, статистикой, сертификатами и заявками на
          консультацию.
        </p>

        <form action="/api/admin/logout" method="post" className="mt-8">
          <AdminCsrfField />
          <button
            type="submit"
            className="rounded-2xl border border-[#c98778] px-5 py-3 text-[#c98778] transition hover:bg-white"
          >
            Выйти из админки
          </button>
        </form>

        <div className="mt-14 rounded-[3rem] border border-[#ead7d1] bg-white p-8 shadow-sm md:p-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-serif text-4xl text-[#332725]">
                Защищенная админка
              </h2>

              <p className="mt-4 max-w-2xl leading-7 text-[#5f5552]">
                После работы нажмите кнопку выхода, чтобы закрыть доступ на
                этом устройстве.
              </p>
            </div>

            <div className="rounded-2xl bg-[#fff8f6] px-6 py-4 text-sm uppercase tracking-[0.2em] text-[#c98778]">
              Protected
            </div>
          </div>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {visibleSections.map((section) => (
            <Link
              key={section.title}
              href={section.href}
              className="luneva-card rounded-[2rem] border border-[#ead7d1] bg-white p-8 shadow-sm"
            >
              <div className="mb-6 text-3xl text-[#c98778]">✦</div>

              <h2 className="text-xl font-medium text-[#332725]">
                {section.title}
              </h2>

              <p className="mt-4 leading-7 text-[#5f5552]">{section.text}</p>

              <span className="mt-8 inline-flex text-[#c98778]">
                Открыть →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
