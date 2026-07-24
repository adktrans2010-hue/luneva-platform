import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import Breadcrumbs from "@/components/Breadcrumbs";
import PageStructuredData from "@/components/seo/page-structured-data";
import { getPublishedArticles } from "@/src/lib/articles";
import { blogCategoryLinks, matchesBlogCategory } from "@/src/lib/navigation";

type Props = { params: Promise<{ category: string }> };

export const dynamic = "force-dynamic";

function getCategory(slug: string) {
  return blogCategoryLinks.find((category) => category.slug === slug);
}

export function generateStaticParams() {
  return blogCategoryLinks.map((category) => ({ category: category.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const category = getCategory((await params).category);
  if (!category) return {};
  const path = category.href;
  const hasArticles = (await getPublishedArticles()).some((article) =>
    matchesBlogCategory(article.category, category.aliases),
  );
  return {
    title: `${category.label}: статьи | Luneva Psy`,
    description: `Статьи по теме «${category.label}».`,
    alternates: { canonical: `https://luneva-psy.ru${path}` },
    robots: hasArticles ? { index: true, follow: true } : { index: false, follow: false },
  };
}

export default async function BlogCategoryPage({ params }: Props) {
  const category = getCategory((await params).category);
  if (!category) notFound();

  const articles = (await getPublishedArticles()).filter((article) => {
    return matchesBlogCategory(article.category, category.aliases);
  });
  const breadcrumbs = [
    { name: "Главная", path: "/" },
    { name: "Статьи", path: "/blog" },
    { name: category.label, path: category.href },
  ];

  return (
    <section className="luneva-fade bg-[#fff8f6] px-5 py-16 sm:px-8 sm:py-24">
      {articles.length > 0 && (
        <PageStructuredData path={category.href} title={category.label} description={`Статьи по теме «${category.label}».`} breadcrumbs={breadcrumbs} />
      )}
      <div className="mx-auto max-w-7xl">
        <Breadcrumbs items={[{ label: "Главная", href: "/" }, { label: "Статьи", href: "/blog" }, { label: category.label }]} />
        <p className="text-sm uppercase tracking-[0.22em] text-[#c98778]">Статьи</p>
        <h1 className="mt-4 font-serif text-4xl leading-tight text-[#332725] sm:text-5xl lg:text-6xl">{category.label}</h1>

        {articles.length > 0 ? (
          <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <article key={article.id} className="luneva-card rounded-[2rem] border border-[#ead7d1] bg-white p-8 shadow-sm">
                <p className="text-sm uppercase tracking-[0.16em] text-[#c98778]">{article.category}</p>
                <h2 className="mt-4 text-2xl font-medium leading-snug text-[#332725]">{article.title}</h2>
                <p className="mt-4 leading-7 text-[#5f5552]">{article.excerpt}</p>
                <Link href={`/blog/${article.slug}`} className="mt-7 inline-flex text-[#9c544c]">Читать →</Link>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-12 border-l-2 border-[#c98778] py-3 pl-6">
            <p className="font-serif text-3xl text-[#332725]">Материалы этой категории готовятся</p>
            <Link href="/blog" className="mt-5 inline-flex text-[#9c544c]">Все статьи →</Link>
          </div>
        )}
      </div>
    </section>
  );
}
