import AppointmentForm from "@/components/AppointmentForm";
import ContactIcons from "@/components/ContactIcons";
import Link from "next/link";
import PageStructuredData from "@/components/seo/page-structured-data";
import { getPublicConsultationProducts } from "@/src/lib/consultation-products";
import { getSeoPage, seoToMetadata } from "@/src/lib/seo";
import { SITE_CONTACTS } from "@/src/lib/site-contacts";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return seoToMetadata(await getSeoPage("/contacts"), "/contacts");
}

const contactCards = [
  {
    title: "Max",
    text: "Написать в Max для согласования консультации и организационных вопросов.",
    href: SITE_CONTACTS.maxHref,
    label: "Открыть Max",
  },
  {
    title: "Telegram",
    text: "Написать в Telegram для быстрой связи и уточнения свободного времени.",
    href: SITE_CONTACTS.telegramHref,
    label: "Открыть Telegram",
  },
  {
    title: "WhatsApp",
    text: `Пишите в WhatsApp: ${SITE_CONTACTS.whatsapp}.`,
    href: SITE_CONTACTS.whatsappHref,
    label: "Написать в WhatsApp",
  },
  {
    title: "E-mail",
    text: `Для писем и организационных вопросов: ${SITE_CONTACTS.contactEmail}.`,
    href: SITE_CONTACTS.emailHref,
    label: "Написать письмо",
  },
];

const addresses = [
  {
    title: "Москва",
    address: "Москва, Кожевнический проезд, дом 4/5, строение 5",
    map:
      "https://yandex.ru/map-widget/v1/?text=%D0%9C%D0%BE%D1%81%D0%BA%D0%B2%D0%B0%2C%20%D0%9A%D0%BE%D0%B6%D0%B5%D0%B2%D0%BD%D0%B8%D1%87%D0%B5%D1%81%D0%BA%D0%B8%D0%B9%20%D0%BF%D1%80%D0%BE%D0%B5%D0%B7%D0%B4%2C%20%D0%B4%D0%BE%D0%BC%204%2F5%2C%20%D1%81%D1%82%D1%80%D0%BE%D0%B5%D0%BD%D0%B8%D0%B5%205&z=16",
  },
  {
    title: "Видное",
    address: "Московская область, город Видное, Калиновая 1, «Соседский центр»",
    map:
      "https://yandex.ru/map-widget/v1/?text=%D0%9C%D0%BE%D1%81%D0%BA%D0%BE%D0%B2%D1%81%D0%BA%D0%B0%D1%8F%20%D0%BE%D0%B1%D0%BB%D0%B0%D1%81%D1%82%D1%8C%2C%20%D0%92%D0%B8%D0%B4%D0%BD%D0%BE%D0%B5%2C%20%D0%9A%D0%B0%D0%BB%D0%B8%D0%BD%D0%BE%D0%B2%D0%B0%D1%8F%201%2C%20%D0%A1%D0%BE%D1%81%D0%B5%D0%B4%D1%81%D0%BA%D0%B8%D0%B9%20%D1%86%D0%B5%D0%BD%D1%82%D1%80&z=16",
  },
];

export default async function ContactsPage() {
  const products = await getPublicConsultationProducts();

  return (
    <section className="luneva-fade bg-[#fff8f6] px-6 py-24">
      <PageStructuredData path="/contacts" title="Контакты и запись на консультацию" breadcrumbs={[{ name: "Главная", path: "/" }, { name: "Контакты", path: "/contacts" }]} />
      <div className="mx-auto max-w-7xl">
        <p className="mb-4 text-sm uppercase tracking-[0.25em] text-[#c98778]">
          Контакты
        </p>

        <h1 className="max-w-4xl font-serif text-6xl leading-tight text-[#332725]">
          Запись и способы связи
        </h1>

        <p className="mt-8 max-w-3xl text-lg leading-8 text-[#5f5552]">
          Можно написать в WhatsApp, отправить письмо или выбрать свободное
          время в форме онлайн-записи.
        </p>

        <div className="mt-12 rounded-[2rem] border border-[#ead7d1] bg-white p-8 shadow-sm md:p-10">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="mb-4 text-sm uppercase tracking-[0.25em] text-[#c98778]">
                Реквизиты
              </p>
              <h2 className="font-serif text-4xl text-[#332725]">
                Контакты и реквизиты исполнителя
              </h2>
              <p className="mt-4 max-w-2xl leading-8 text-[#5f5552]">
                {SITE_CONTACTS.ownerFullName}, {SITE_CONTACTS.ownerStatus.toLowerCase()} —{" "}
                {SITE_CONTACTS.ownerTaxStatus.toLowerCase()}.
              </p>
            </div>

            <Link
              href="/requisites"
              className="inline-flex shrink-0 items-center justify-center rounded-2xl border border-[#332725] px-6 py-3 text-[#332725] transition hover:bg-[#fff8f6]"
            >
              Смотреть реквизиты
            </Link>
          </div>

          <dl className="mt-8 grid gap-5 md:grid-cols-2">
            <div>
              <dt className="text-sm uppercase tracking-[0.18em] text-[#c98778]">
                ИНН
              </dt>
              <dd className="mt-2 text-lg text-[#332725]">{SITE_CONTACTS.inn}</dd>
            </div>
            <div>
              <dt className="text-sm uppercase tracking-[0.18em] text-[#c98778]">
                Сайт
              </dt>
              <dd className="mt-2 text-lg text-[#332725]">
                <a href={SITE_CONTACTS.domain}>{SITE_CONTACTS.domainLabel}</a>
              </dd>
            </div>
            <div>
              <dt className="text-sm uppercase tracking-[0.18em] text-[#c98778]">
                Email
              </dt>
              <dd className="mt-2 text-lg text-[#332725]">
                <a href={`mailto:${SITE_CONTACTS.contactEmail}`}>{SITE_CONTACTS.contactEmail}</a>
              </dd>
            </div>
            <div>
              <dt className="text-sm uppercase tracking-[0.18em] text-[#c98778]">
                Телефон
              </dt>
              <dd className="mt-2 text-lg text-[#332725]">
                <a href={SITE_CONTACTS.phoneTelHref}>{SITE_CONTACTS.phone}</a>
                <span className="mt-1 block text-sm text-[#8a7a76]">на звонки не отвечаю</span>
              </dd>
            </div>
          </dl>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {contactCards.map((item) => (
            <a
              key={item.title}
              href={item.href}
              target={item.href.startsWith("http") ? "_blank" : undefined}
              rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
              className="luneva-card rounded-[2rem] border border-[#ead7d1] bg-white p-8 shadow-sm"
            >
              <div className="mb-6 text-3xl text-[#c98778]">✦</div>

              <h2 className="text-xl font-medium text-[#332725]">
                {item.title}
              </h2>

              <p className="mt-4 leading-7 text-[#5f5552]">{item.text}</p>

              <span className="mt-6 inline-flex text-[#c98778]">
                {item.label}
              </span>
            </a>
          ))}
        </div>

        <div className="mt-16 rounded-[3rem] bg-white p-10 shadow-sm md:p-12">
          <p className="mb-4 text-sm uppercase tracking-[0.25em] text-[#c98778]">
            Соцсети
          </p>

          <h2 className="font-serif text-4xl text-[#332725]">
            Быстрая связь
          </h2>

          <ContactIcons variant="list" className="mt-8 sm:grid-cols-2" showPhone />
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-2">
          {addresses.map((place) => (
            <div
              key={place.address}
              className="overflow-hidden rounded-[3rem] border border-[#ead7d1] bg-white shadow-sm"
            >
              <div className="p-8 md:p-10">
                <p className="mb-4 text-sm uppercase tracking-[0.25em] text-[#c98778]">
                  Карта
                </p>

                <h2 className="font-serif text-4xl text-[#332725]">
                  {place.title}
                </h2>

                <p className="mt-5 leading-8 text-[#5f5552]">
                  Личный прием по адресу: {place.address}
                </p>
              </div>

              <iframe
                title={`Яндекс Карта: ${place.title}`}
                src={place.map}
                className="h-80 w-full border-0"
                loading="lazy"
              />
            </div>
          ))}
        </div>

        <div className="mt-16 rounded-[3rem] bg-white p-10 shadow-sm md:p-14">
          <h2 className="font-serif text-4xl text-[#332725]">
            Онлайн-запись
          </h2>

          <p className="mt-5 max-w-2xl leading-8 text-[#5f5552]">
            Заполните короткую форму, выберите формат консультации, дату и
            свободное время. Выбранное окно будет забронировано до
            подтверждения.
          </p>

          <AppointmentForm products={products} />
        </div>
      </div>
    </section>
  );
}
