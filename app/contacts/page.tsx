import AppointmentForm from "@/components/AppointmentForm";
import LocationMapPreview from "@/components/LocationMapPreview";
import SocialLinks from "@/components/SocialLinks";
import Link from "next/link";
import PageStructuredData from "@/components/seo/page-structured-data";
import { getPublicConsultationProducts } from "@/src/lib/consultation-products";
import { getSeoPage, seoToMetadata } from "@/src/lib/seo";
import { SITE_CONTACTS } from "@/src/lib/site-contacts";
import { isEmergencyBookingDisabled } from "@/src/lib/emergency-booking";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return seoToMetadata(await getSeoPage("/contacts"), "/contacts");
}

const contactCards = [
  { title: "WhatsApp", text: "Вопросы о консультации", href: SITE_CONTACTS.whatsappHref, label: "Написать", icon: "↗" },
  { title: "Email", text: SITE_CONTACTS.contactEmail, href: SITE_CONTACTS.emailHref, label: "Написать письмо", icon: "✉" },
  { title: "Онлайн-запись", text: "Выберите удобное время", href: "/contacts#booking", label: "Записаться", icon: "+" },
  { title: "Личный кабинет", text: "Ваши записи и история встреч", href: "/account", label: "Открыть кабинет", icon: "⌂" },
];

const addresses = [
  {
    title: "Москва",
    address: "Москва, Кожевнический проезд, дом 4/5, строение 5",
    mapHref:
      "https://yandex.ru/maps/?text=%D0%9C%D0%BE%D1%81%D0%BA%D0%B2%D0%B0%2C%20%D0%9A%D0%BE%D0%B6%D0%B5%D0%B2%D0%BD%D0%B8%D1%87%D0%B5%D1%81%D0%BA%D0%B8%D0%B9%20%D0%BF%D1%80%D0%BE%D0%B5%D0%B7%D0%B4%2C%20%D0%B4%D0%BE%D0%BC%204%2F5%2C%20%D1%81%D1%82%D1%80%D0%BE%D0%B5%D0%BD%D0%B8%D0%B5%205",
  },
  {
    title: "Видное",
    address: "Московская область, город Видное, Калиновая 1, «Соседский центр»",
    mapHref:
      "https://yandex.ru/maps/?text=%D0%9C%D0%BE%D1%81%D0%BA%D0%BE%D0%B2%D1%81%D0%BA%D0%B0%D1%8F%20%D0%BE%D0%B1%D0%BB%D0%B0%D1%81%D1%82%D1%8C%2C%20%D0%92%D0%B8%D0%B4%D0%BD%D0%BE%D0%B5%2C%20%D0%9A%D0%B0%D0%BB%D0%B8%D0%BD%D0%BE%D0%B2%D0%B0%D1%8F%201%2C%20%D0%A1%D0%BE%D1%81%D0%B5%D0%B4%D1%81%D0%BA%D0%B8%D0%B9%20%D1%86%D0%B5%D0%BD%D1%82%D1%80",
  },
];

export default async function ContactsPage() {
  const products = await getPublicConsultationProducts();
  const emergencyBookingDisabled = isEmergencyBookingDisabled();

  return (
    <section className="luneva-fade bg-[#fff8f6] px-5 pt-10 pb-16 md:px-6 md:pt-14 md:pb-20">
      <PageStructuredData path="/contacts" title="Контакты и запись на консультацию" breadcrumbs={[{ name: "Главная", path: "/" }, { name: "Контакты", path: "/contacts" }]} />
      <div className="mx-auto max-w-7xl">
        <p className="mb-4 text-sm uppercase tracking-[0.25em] text-[#c98778]">
          Контакты
        </p>

        <h1 className="max-w-4xl font-serif text-4xl sm:text-5xl lg:text-6xl leading-tight text-[#332725]">
          Запись и способы связи
        </h1>

        <p className="mt-4 max-w-3xl text-lg leading-8 text-[#5f5552]">
          Выберите удобный способ связи или запишитесь на консультацию онлайн.
        </p>

        <div className="mt-7 grid grid-cols-1 gap-4 md:grid-cols-4">
          {contactCards.map((item) => (
            <a
              key={item.title}
              href={item.href}
              target={item.href.startsWith("http") ? "_blank" : undefined}
              rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
              className="luneva-card flex min-w-0 flex-col rounded-[2rem] border border-[#ead7d1] bg-white p-5 shadow-sm transition hover:border-[#c98778] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8d443e]"
            >
              <div aria-hidden="true" className="mb-3 grid h-9 w-9 place-items-center rounded-full bg-[#fff0eb] text-xl text-[#8d443e]">{item.icon}</div>

              <h2 className="text-xl font-medium text-[#332725]">
                {item.title}
              </h2>

              <p className="mt-2 text-sm leading-6 text-[#5f5552] [overflow-wrap:anywhere]">{item.text}</p>

              <span className="mt-auto inline-flex pt-4 text-sm font-medium text-[#8d443e] [overflow-wrap:anywhere]">
                {item.label}
              </span>
            </a>
          ))}
        </div>

        <div className="mt-8 rounded-[2rem] bg-white p-6 shadow-sm md:p-8">
          <p className="mb-4 text-sm uppercase tracking-[0.25em] text-[#c98778]">
            Социальные сети
          </p>

          <SocialLinks className="mt-4" />
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          {addresses.map((place) => (
            <div
              key={place.address}
              className="flex flex-col overflow-hidden rounded-[2rem] border border-[#ead7d1] bg-white shadow-sm"
            >
              <div className="flex-1 p-6 md:p-8">
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

              <LocationMapPreview title={place.title} address={place.address} href={place.mapHref} />
              <div className="bg-[#fff8f6] p-6 md:px-8">
                <a
                  href={place.mapHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-2xl bg-[#332725] px-6 py-3 text-white transition hover:bg-[#4a3935] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#332725]"
                >
                  Открыть в Яндекс Картах
                </a>
              </div>
            </div>
          ))}
        </div>

        <div id="booking" className="mt-12 scroll-mt-28 rounded-[2rem] bg-white p-6 shadow-sm md:p-10">
          <h2 className="font-serif text-4xl text-[#332725]">
            Онлайн-запись
          </h2>

          <p className="mt-5 max-w-2xl leading-8 text-[#5f5552]">
            Заполните короткую форму, выберите формат консультации, дату и
            свободное время. После создания оплаты окно резервируется на 60
            минут. Если оплата не поступит, резерв автоматически снимается.
          </p>

          <AppointmentForm
            products={products}
            emergencyBookingDisabled={emergencyBookingDisabled}
          />
        </div>

        <div className="mt-16 rounded-[2rem] border border-[#ead7d1] bg-white p-8 shadow-sm md:p-10">
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
      </div>
    </section>
  );
}
