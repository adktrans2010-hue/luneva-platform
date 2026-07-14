import { getPublishedFaqItems } from "@/src/lib/faq";
import { defaultSocialImage, getSeoPage, seoToMetadata } from "@/src/lib/seo";

export async function generateMetadata() {
  const seo = await getSeoPage("/faq");
  return seo
    ? seoToMetadata(seo, "/faq")
    : {
        title: "Частые вопросы | Luneva Psy",
        description: "Ответы на частые вопросы о консультациях психолога Александры Луневой.",
        alternates: { canonical: "https://luneva-psy.ru/faq" },
        robots: { index: true, follow: true },
        openGraph: {
          title: "Частые вопросы | Luneva Psy",
          description: "Ответы на частые вопросы о консультациях психолога Александры Луневой.",
          url: "https://luneva-psy.ru/faq",
          siteName: "Luneva Psy",
          locale: "ru_RU",
          type: "website" as const,
          images: [defaultSocialImage],
        },
        twitter: {
          card: "summary_large_image" as const,
          title: "Частые вопросы | Luneva Psy",
          description: "Ответы на частые вопросы о консультациях психолога Александры Луневой.",
          images: [defaultSocialImage.url],
        },
      };
}

export default async function FaqPage() {
  const items = await getPublishedFaqItems();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };

  return (
    <section className="bg-[#fff8f6] px-6 py-24">
      {items.length > 0 && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replaceAll("<", "\\u003c") }} />}
      <div className="mx-auto max-w-5xl">
        <p className="mb-4 text-sm uppercase tracking-[0.25em] text-[#c98778]">Полезная информация</p>
        <h1 className="font-serif text-6xl leading-tight text-[#332725]">Частые вопросы</h1>
        <p className="mt-8 max-w-3xl text-lg leading-8 text-[#5f5552]">Ответы на организационные вопросы о консультациях, формате работы и записи.</p>
        <div className="mt-12 grid gap-4">
          {items.map((item) => (
            <details key={item.id} className="group rounded-[2rem] border border-[#ead7d1] bg-white p-6 shadow-sm">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-xl font-medium text-[#332725]">
                {item.question}<span className="text-2xl text-[#c98778] transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-5 whitespace-pre-line leading-8 text-[#5f5552]">{item.answer}</p>
            </details>
          ))}
          {items.length === 0 && <p className="rounded-[2rem] bg-white p-8 text-[#5f5552]">Раздел скоро будет дополнен.</p>}
        </div>
      </div>
    </section>
  );
}
