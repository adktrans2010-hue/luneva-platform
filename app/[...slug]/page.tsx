import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import Breadcrumbs from "@/components/Breadcrumbs";
import PageStructuredData from "@/components/seo/page-structured-data";
import ConsultationCta from "@/components/sections/ConsultationCta";
import { placeholderPages } from "@/src/lib/placeholder-pages";
import { defaultSocialImage, getSeoPage, seoToMetadata } from "@/src/lib/seo";
import { getPublishedSitePage } from "@/src/lib/site-pages";

type Props = { params: Promise<{ slug: string[] }> };

function toPath(slug: string[]) {
  return `/${slug.join("/")}`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const path = toPath(slug);
  const placeholder = placeholderPages[path];
  const [page, seo] = await Promise.all([getPublishedSitePage(path), getSeoPage(path)]);

  if (page) {
    return seo
      ? seoToMetadata(seo, path)
      : {
          title: `${page.title} | Luneva Psy`,
          description: page.intro,
          alternates: { canonical: `https://luneva-psy.ru${path}` },
          robots: { index: true, follow: true },
          openGraph: {
            title: `${page.title} | Luneva Psy`,
            description: page.intro,
            url: `https://luneva-psy.ru${path}`,
            siteName: "Luneva Psy",
            locale: "ru_RU",
            type: "website",
            images: [defaultSocialImage],
          },
        };
  }

  if (!placeholder) return {};
  return {
    title: `${placeholder.title} | Luneva Psy`,
    description: "Материал готовится к публикации.",
    alternates: { canonical: `https://luneva-psy.ru${path}` },
    robots: { index: false, follow: false },
  };
}

export default async function ManagedSitePage({ params }: Props) {
  const { slug } = await params;
  const currentPath = toPath(slug);
  const page = await getPublishedSitePage(currentPath);

  if (page) {
    const blocks = page.content.split(/\n\s*\n/u).map((block) => block.trim()).filter(Boolean);
    return (
      <section className="bg-[#fff8f6] px-5 py-16 sm:px-8 sm:py-24">
        <PageStructuredData path={currentPath} title={page.title} description={page.intro} breadcrumbs={[{ name: "Главная", path: "/" }, { name: page.title, path: currentPath }]} />
        <div className="mx-auto max-w-5xl">
          <Breadcrumbs items={[{ label: "Главная", href: "/" }, { label: page.title }]} />
          {page.eyebrow && <p className="mb-4 text-sm uppercase tracking-[0.22em] text-[#c98778]">{page.eyebrow}</p>}
          <h1 className="font-serif text-4xl leading-tight text-[#332725] sm:text-5xl lg:text-6xl">{page.title}</h1>
          <p className="mt-8 max-w-3xl text-lg leading-8 text-[#5f5552]">{page.intro}</p>
          <article className="mt-12 border-t border-[#ead7d1] pt-10">
            <div className="grid gap-6 text-lg leading-8 text-[#5f5552]">
              {blocks.map((block, index) => block.startsWith("## ")
                ? <h2 key={`${index}-${block}`} className="mt-4 font-serif text-4xl text-[#332725]">{block.slice(3)}</h2>
                : <p key={`${index}-${block}`} className="whitespace-pre-line">{block}</p>)}
            </div>
          </article>
        </div>
      </section>
    );
  }

  const placeholder = placeholderPages[currentPath];
  if (!placeholder) notFound();

  const breadcrumbs = [
    { name: "Главная", path: "/" },
    { name: placeholder.parent.label, path: placeholder.parent.href },
    { name: placeholder.title, path: currentPath },
  ];

  return (
    <section className="bg-[#fff8f6] px-5 py-16 sm:px-8 sm:py-24">
      <div className="mx-auto max-w-5xl">
        <Breadcrumbs items={breadcrumbs.map((item, index) => ({ label: item.name, href: index < breadcrumbs.length - 1 ? item.path : undefined }))} />
        <p className="text-sm uppercase tracking-[0.22em] text-[#c98778]">{placeholder.eyebrow}</p>
        <h1 className="mt-4 max-w-4xl font-serif text-4xl leading-tight text-[#332725] sm:text-5xl lg:text-6xl">{placeholder.title}</h1>
        <div className="mt-12 border-l-2 border-[#c98778] py-3 pl-6">
          <p className="font-serif text-3xl text-[#332725]">Материал готовится к публикации</p>
          <Link href={placeholder.parent.href} className="mt-5 inline-flex text-[#9c544c]">Вернуться в раздел →</Link>
        </div>
        <ConsultationCta className="mt-16 px-0 py-0" />
      </div>
    </section>
  );
}
