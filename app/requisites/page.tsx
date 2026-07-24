import type { Metadata } from "next";

import PageStructuredData from "@/components/seo/page-structured-data";
import JsonLd from "@/components/seo/json-ld";
import { absoluteUrl } from "@/src/lib/seo";
import { SITE_CONTACTS } from "@/src/lib/site-contacts";

export const metadata: Metadata = {
  title: "Реквизиты | Luneva Psy",
  description:
    "Реквизиты психолога Александры Луневой: ФИО, статус самозанятой, ИНН, телефон, email и сайт.",
  alternates: {
    canonical: absoluteUrl("/requisites"),
  },
  openGraph: {
    title: "Реквизиты | Luneva Psy",
    description:
      "Реквизиты психолога Александры Луневой: ФИО, статус самозанятой, ИНН, телефон, email и сайт.",
    url: absoluteUrl("/requisites"),
    siteName: "Luneva Psy",
    locale: "ru_RU",
    type: "website",
  },
};

const requisites = [
  {
    label: "Исполнитель",
    value: SITE_CONTACTS.ownerFullName,
  },
  {
    label: "Статус",
    value: `${SITE_CONTACTS.ownerStatus} (${SITE_CONTACTS.ownerTaxStatus})`,
  },
  {
    label: "ИНН",
    value: SITE_CONTACTS.inn,
  },
  {
    label: "Телефон",
    value: SITE_CONTACTS.phone,
    href: SITE_CONTACTS.phoneTelHref,
  },
  {
    label: "Email",
    value: SITE_CONTACTS.publicEmail,
    href: `mailto:${SITE_CONTACTS.publicEmail}`,
  },
  {
    label: "Сайт",
    value: SITE_CONTACTS.domain,
    href: SITE_CONTACTS.domain,
  },
];

const requisitesSchema = {
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": absoluteUrl("/requisites#provider"),
  name: SITE_CONTACTS.ownerFullName,
  url: SITE_CONTACTS.domain,
  email: `mailto:${SITE_CONTACTS.publicEmail}`,
  telephone: SITE_CONTACTS.phone,
  taxID: SITE_CONTACTS.inn,
  jobTitle: "Психолог",
};

export default function RequisitesPage() {
  return (
    <section className="bg-[#fff8f6] px-6 py-24">
      <PageStructuredData
        path="/requisites"
        title="Реквизиты"
        description="Реквизиты психолога Александры Луневой."
        breadcrumbs={[
          { name: "Главная", path: "/" },
          { name: "Реквизиты", path: "/requisites" },
        ]}
      />
      <JsonLd data={requisitesSchema} />

      <div className="mx-auto max-w-5xl">
        <p className="mb-4 text-sm uppercase tracking-[0.25em] text-[#c98778]">
          Реквизиты
        </p>

        <h1 className="font-serif text-5xl leading-tight text-[#332725] md:text-6xl">
          Контакты и реквизиты
        </h1>

        <p className="mt-6 max-w-3xl text-lg leading-8 text-[#5f5552]">
          Здесь указаны данные исполнителя для связи, оформления записи и
          проверки информации перед оплатой консультации.
        </p>

        <div className="mt-12 overflow-hidden rounded-[2rem] border border-[#ead7d1] bg-white shadow-sm">
          {requisites.map((item) => (
            <div
              key={item.label}
              className="grid gap-2 border-b border-[#ead7d1] px-6 py-5 last:border-b-0 md:grid-cols-[220px_1fr] md:px-8"
            >
              <dt className="text-sm uppercase tracking-[0.18em] text-[#c98778]">
                {item.label}
              </dt>
              <dd className="text-lg leading-7 text-[#332725]">
                {item.href ? (
                  <a
                    href={item.href}
                    className="underline decoration-[#d9aaa0] underline-offset-4 transition hover:text-[#9f665a]"
                  >
                    {item.value}
                  </a>
                ) : (
                  item.value
                )}
              </dd>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
