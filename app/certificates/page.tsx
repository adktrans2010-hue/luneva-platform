import CertificateGallery from "@/components/CertificateGallery";
import JsonLd from "@/components/seo/json-ld";
import PageStructuredData from "@/components/seo/page-structured-data";
import { getPublishedCertificates } from "@/src/lib/certificates";
import { getSeoPage, seoToMetadata } from "@/src/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return seoToMetadata(await getSeoPage("/certificates"), "/certificates");
}

export default async function CertificatesPage() {
  const certificates = await getPublishedCertificates();
  const certificatesJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Дипломы и сертификаты Луневой Александры",
    itemListElement: certificates.map((certificate, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "ImageObject",
        name: certificate.seoTitle || certificate.title,
        description:
          certificate.seoDescription ||
          certificate.description ||
          certificate.title,
        keywords: certificate.seoKeywords || undefined,
        contentUrl: new URL(certificate.image, "https://luneva-psy.ru").toString(),
      },
    })),
  };

  return (
    <section className="bg-[#fff8f6] px-6 py-24">
      <PageStructuredData path="/certificates" title="Дипломы и сертификаты" breadcrumbs={[{ name: "Главная", path: "/" }, { name: "Дипломы и сертификаты", path: "/certificates" }]} />
      {certificates.length > 0 && <JsonLd data={certificatesJsonLd} />}

      <div className="mx-auto max-w-7xl">
        <p className="mb-4 text-sm uppercase tracking-[0.25em] text-[#c98778]">
          Образование
        </p>

        <h1 className="font-serif text-6xl text-[#332725]">
          Дипломы и сертификаты
        </h1>

        <p className="mt-6 max-w-3xl text-lg leading-8 text-[#5f5552]">
          Документы о профессиональном образовании, повышении квалификации и
          дополнительном обучении Луневой Александры Александровны.
        </p>

        {certificates.length > 0 ? (
          <CertificateGallery certificates={certificates} />
        ) : (
          <div className="mt-16 rounded-[3rem] bg-[#332725] p-10 text-white md:p-14">
            <h2 className="font-serif text-4xl">Документы скоро появятся</h2>
            <p className="mt-6 max-w-2xl leading-8 text-[#ead7d1]">
              Раздел можно наполнить через админку сайта.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
