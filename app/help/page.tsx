import { getSeoPage, seoToMetadata } from "@/src/lib/seo";
import ConsultationCta from "@/components/sections/ConsultationCta";
import PageStructuredData from "@/components/seo/page-structured-data";
import SymptomsCarousel from "@/components/SymptomsCarousel";

export async function generateMetadata() {
  return seoToMetadata(await getSeoPage("/help"), "/help");
}

export default function HelpPage() {
  return (
    <section className="luneva-fade bg-[#fff8f6] px-6 py-24">
      <PageStructuredData path="/help" title="С чем я могу помочь" breadcrumbs={[{ name: "Главная", path: "/" }, { name: "С чем я могу помочь", path: "/help" }]} />
      <div className="mx-auto max-w-7xl">
        <p className="mb-4 text-sm uppercase tracking-[0.25em] text-[#c98778]">
          Психологическая помощь
        </p>

        <h1 className="max-w-4xl font-serif text-6xl leading-tight text-[#332725]">
          С чем можно обратиться
        </h1>

        <p className="mt-8 max-w-3xl text-lg leading-8 text-[#5f5552]">
          В терапии мы бережно исследуем то, что сейчас мешает жить спокойнее,
          лучше понимать себя и строить отношения с собой и другими.
        </p>

        <SymptomsCarousel source="help" />

        <ConsultationCta className="mt-16 px-0 py-0" />
      </div>
    </section>
  );
}
