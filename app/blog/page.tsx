import Link from "next/link";

import { getPublishedArticles } from "@/src/lib/articles";
import { getSeoPage, seoToMetadata } from "@/src/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return seoToMetadata(await getSeoPage("/blog"));
}

export default async function BlogPage() {
  const articles = await getPublishedArticles();

  return (
    <section className="luneva-fade bg-[#fff8f6] px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <p className="mb-4 text-sm uppercase tracking-[0.25em] text-[#c98778]">
          Блог
        </p>

        <h1 className="max-w-4xl font-serif text-6xl leading-tight text-[#332725]">
          Статьи о психологии и пути к себе
        </h1>

        <p className="mt-8 max-w-3xl text-lg leading-8 text-[#5f5552]">
          Простые и бережные материалы о чувствах, отношениях, терапии и
          внутренней устойчивости.
        </p>

        {articles.length > 0 ? (
          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {articles.map((article) => (
              <article
                key={article.id}
                className="luneva-card rounded-[2rem] border border-[#ead7d1] bg-white p-8 shadow-sm"
              >
                <p className="text-sm uppercase tracking-[0.2em] text-[#c98778]">
                  {article.category}
                </p>

                <h2 className="mt-5 text-2xl font-medium leading-snug text-[#332725]">
                  {article.title}
                </h2>

                <p className="mt-5 leading-7 text-[#5f5552]">
                  {article.excerpt}
                </p>

                <Link
                  href={`/blog/${article.slug}`}
                  className="mt-8 inline-flex text-[#c98778]"
                >
                  Читать →
                </Link>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-14 rounded-[3rem] bg-[#332725] p-10 text-white md:p-14">
            <h2 className="font-serif text-4xl">
              Больше материалов скоро
            </h2>

            <p className="mt-6 max-w-2xl leading-8 text-[#ead7d1]">
              Раздел будет постепенно пополняться статьями, практиками и
              полезными материалами о психологии.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
