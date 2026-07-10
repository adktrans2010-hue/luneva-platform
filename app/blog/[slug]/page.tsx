import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  getPublishedArticleBySlug,
  getRelatedPublishedArticles,
} from "@/src/lib/articles";

export const dynamic = "force-dynamic";

type ArticlePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({
  params,
}: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getPublishedArticleBySlug(slug);

  if (!article) {
    return {
      title: "Статья не найдена | Luneva Psy",
    };
  }

  const title = `${article.title} | Luneva Psy`;
  const description = article.excerpt || article.title;
  const url = `/blog/${article.slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      type: "article",
    },
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = await getPublishedArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  const relatedArticles = await getRelatedPublishedArticles(article);

  return (
    <article className="bg-[#fff8f6] px-6 py-20">
      <div className="mx-auto max-w-3xl">
        <Link href="/blog" className="text-[#c98778]">
          ← Назад к статьям
        </Link>

        <p className="mt-10 text-sm uppercase tracking-[0.25em] text-[#c98778]">
          {article.category}
        </p>

        <h1 className="mt-5 font-serif text-5xl leading-tight text-[#332725]">
          {article.title}
        </h1>

        <p className="mt-7 text-xl leading-9 text-[#5f5552]">
          {article.excerpt}
        </p>

        <div className="mt-12 whitespace-pre-line rounded-[2rem] border border-[#ead7d1] bg-white p-8 text-lg leading-9 text-[#332725] shadow-sm">
          {article.content}
        </div>

        {relatedArticles.length > 0 && (
          <section className="mt-14">
            <h2 className="font-serif text-3xl text-[#332725]">
              Похожие материалы
            </h2>

            <div className="mt-6 grid gap-4">
              {relatedArticles.map((relatedArticle) => (
                <Link
                  key={relatedArticle.id}
                  href={`/blog/${relatedArticle.slug}`}
                  className="block rounded-[1.5rem] border border-[#ead7d1] bg-white p-6 shadow-sm transition hover:-translate-y-1"
                >
                  <div className="text-sm uppercase tracking-[0.18em] text-[#c98778]">
                    {relatedArticle.category}
                  </div>
                  <h3 className="mt-3 font-serif text-2xl text-[#332725]">
                    {relatedArticle.title}
                  </h3>
                  <p className="mt-3 line-clamp-2 text-[#5f5552]">
                    {relatedArticle.excerpt}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </article>
  );
}
