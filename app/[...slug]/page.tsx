import { notFound } from "next/navigation";

import PageStructuredData from "@/components/seo/page-structured-data";
import { defaultSocialImage, getSeoPage, seoToMetadata } from "@/src/lib/seo";
import { getPublishedSitePage } from "@/src/lib/site-pages";

type Props = { params: Promise<{ slug: string[] }> };

function toPath(slug: string[]) {
  return `/${slug.join("/")}`;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const path = toPath(slug);
  const [page, seo] = await Promise.all([
    getPublishedSitePage(path),
    getSeoPage(path),
  ]);
  if (!page) return {};
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
          type: "website" as const,
          images: [defaultSocialImage],
        },
        twitter: {
          card: "summary_large_image" as const,
          title: `${page.title} | Luneva Psy`,
          description: page.intro,
          images: [defaultSocialImage.url],
        },
      };
}

export default async function ManagedSitePage({ params }: Props) {
  const { slug } = await params;
  const currentPath = toPath(slug);
  const page = await getPublishedSitePage(currentPath);
  if (!page) notFound();

  const blocks = page.content.split(/\n\s*\n/u).map((block) => block.trim()).filter(Boolean);

  return (
    <section className="bg-[#fff8f6] px-6 py-24">
      <PageStructuredData
        path={currentPath}
        title={page.title}
        description={page.intro}
        breadcrumbs={[
          { name: "Главная", path: "/" },
          { name: page.title, path: currentPath },
        ]}
      />
      <div className="mx-auto max-w-5xl">
        {page.eyebrow && <p className="mb-4 text-sm uppercase tracking-[0.25em] text-[#c98778]">{page.eyebrow}</p>}
        <h1 className="font-serif text-6xl leading-tight text-[#332725]">{page.title}</h1>
        <p className="mt-8 max-w-3xl text-lg leading-8 text-[#5f5552]">{page.intro}</p>
        <article className="mt-12 rounded-[3rem] border border-[#ead7d1] bg-white p-8 shadow-sm md:p-12">
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
