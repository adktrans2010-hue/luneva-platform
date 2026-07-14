import { absoluteUrl } from "@/src/lib/seo";
import { SITE_CONTACTS } from "@/src/lib/site-contacts";

export type BreadcrumbItem = {
  name: string;
  path: string;
};

const websiteId = absoluteUrl("/#website");
const personId = absoluteUrl("/#person");
const serviceId = absoluteUrl("/#psychological-consultations");

export function createGlobalSchema() {
  const homeUrl = absoluteUrl("/");

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": websiteId,
        url: homeUrl,
        name: "Luneva Psy",
        description: "Сайт психолога Александры Луневой.",
        inLanguage: "ru-RU",
        publisher: { "@id": personId },
      },
      {
        "@type": "Person",
        "@id": personId,
        name: "Лунева Александра Александровна",
        givenName: "Александра",
        familyName: "Лунева",
        url: absoluteUrl("/about"),
        image: absoluteUrl("/sasha-about-page.jpg"),
        jobTitle: "Психолог",
        email: `mailto:${SITE_CONTACTS.publicEmail}`,
        telephone: SITE_CONTACTS.whatsapp,
        hasOccupation: {
          "@type": "Occupation",
          name: "Психолог",
          occupationLocation: {
            "@type": "Country",
            name: "Россия",
          },
        },
        knowsAbout: [
          "Гештальт-терапия",
          "Психологическое консультирование",
          "Расстройства пищевого поведения",
          "Психологическая травма",
          "Подростковая психология",
        ],
        address: [
          {
            "@type": "PostalAddress",
            addressLocality: "Москва",
            streetAddress: "Кожевнический проезд, дом 4/5, строение 5",
            addressCountry: "RU",
          },
          {
            "@type": "PostalAddress",
            addressLocality: "Видное",
            addressRegion: "Московская область",
            streetAddress: "Калиновая улица, 1, Соседский центр",
            addressCountry: "RU",
          },
        ],
      },
      {
        "@type": "Service",
        "@id": serviceId,
        name: "Консультация психолога",
        serviceType: "Психологическое консультирование",
        description: "Индивидуальные психологические консультации онлайн и очно.",
        provider: { "@id": personId },
        areaServed: ["Россия", "Москва", "Московская область", "Онлайн"],
        url: absoluteUrl("/contacts"),
      },
      {
        "@type": "WebPage",
        "@id": absoluteUrl("/#webpage"),
        url: homeUrl,
        name: "Психолог Александра Лунева | Luneva Psy",
        description: "Бережная психологическая помощь взрослым и подросткам.",
        isPartOf: { "@id": websiteId },
        about: { "@id": personId },
        mainEntity: { "@id": serviceId },
        inLanguage: "ru-RU",
      },
    ],
  };
}

export function createBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@id": absoluteUrl(item.path),
        name: item.name,
      },
    })),
  };
}

export function createPageSchema({
  path,
  title,
  description,
  breadcrumbs,
}: {
  path: string;
  title: string;
  description?: string;
  breadcrumbs: BreadcrumbItem[];
}) {
  const pageUrl = absoluteUrl(path);
  const breadcrumb = createBreadcrumbSchema(breadcrumbs);

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${pageUrl}#webpage`,
        url: pageUrl,
        name: title,
        description,
        isPartOf: { "@id": websiteId },
        about: { "@id": personId },
        breadcrumb: { "@id": `${pageUrl}#breadcrumb` },
        inLanguage: "ru-RU",
      },
      {
        ...breadcrumb,
        "@id": `${pageUrl}#breadcrumb`,
      },
    ],
  };
}
