import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  getPublishedArticleBySlug,
  getRelatedPublishedArticles,
  type Article,
} from "@/src/lib/articles";
import ConsultationCta from "@/components/sections/ConsultationCta";
import { defaultSocialImage, siteUrl } from "@/src/lib/seo";

export const dynamic = "force-dynamic";

type ArticlePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

type FaqItem = {
  question: string;
  answer: string;
};

function parseFaq(value: string | null): FaqItem[] {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value) as unknown;

    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((item) => {
        if (!item || typeof item !== "object") return null;

        const record = item as Record<string, unknown>;
        const question = String(record.question ?? "").trim();
        const answer = String(record.answer ?? "").trim();

        return question && answer ? { question, answer } : null;
      })
      .filter((item): item is FaqItem => Boolean(item));
  } catch {
    return value
      .split(/\n{2,}/)
      .map((block) => {
        const [question, ...answerParts] = block.split("\n");
        const answer = answerParts.join("\n").trim();

        return question?.trim() && answer
          ? { question: question.trim(), answer }
          : null;
      })
      .filter((item): item is FaqItem => Boolean(item));
  }
}

function getArticleUrl(article: Article) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");

  return siteUrl
    ? `${siteUrl}/blog/${article.slug}`
    : `/blog/${article.slug}`;
}

function buildArticleJsonLd(article: Article, faqItems: FaqItem[]) {
  const url = getArticleUrl(article);
  const articleJsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.h1 || article.title,
    description: article.seoDescription || article.excerpt,
    mainEntityOfPage: url,
    datePublished: article.createdAt,
    dateModified: article.updatedAt,
    author: {
      "@type": "Person",
      name: "Александра Лунева",
    },
    publisher: {
      "@type": "Organization",
      name: "Luneva Psy",
    },
  };

  if (article.image) {
    articleJsonLd.image = article.image;
  }

  const jsonLd: Record<string, unknown>[] = [articleJsonLd];

  if (faqItems.length > 0) {
    jsonLd.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqItems.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer,
        },
      })),
    });
  }

  return jsonLd;
}

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

  const title = article.seoTitle || `${article.title} | Luneva Psy`;
  const description = article.seoDescription || article.excerpt || article.title;
  const url = `/blog/${article.slug}`;
  const socialImage = article.image
    ? new URL(article.image, siteUrl).toString()
    : defaultSocialImage.url;

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
      siteName: "Luneva Psy",
      locale: "ru_RU",
      images: [
        {
          url: socialImage,
          width: article.image ? undefined : defaultSocialImage.width,
          height: article.image ? undefined : defaultSocialImage.height,
          alt: article.h1 || article.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [socialImage],
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
  const faqItems = parseFaq(article.faq);
  const jsonLd = buildArticleJsonLd(article, faqItems);

  return (
    <article className="bg-[#fff8f6] px-6 py-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto max-w-4xl">
        <Link href="/blog" className="text-[#c98778]">
          ← Назад к статьям
        </Link>

        <p className="mt-10 text-sm uppercase tracking-[0.25em] text-[#c98778]">
          {article.category}
        </p>

        <h1 className="mt-5 font-serif text-5xl leading-tight text-[#332725]">
          {article.h1 || article.title}
        </h1>

        <p className="mt-7 max-w-3xl text-xl leading-9 text-[#5f5552]">
          {article.excerpt}
        </p>

        {article.image && (
          <div className="mt-10 overflow-hidden rounded-[2rem] border border-[#ead7d1] bg-white shadow-sm">
            <Image
              src={article.image}
              alt={article.h1 || article.title}
              width={1200}
              height={700}
              className="h-auto w-full object-cover"
            />
          </div>
        )}

        <div className="mt-12 whitespace-pre-line rounded-[2rem] border border-[#ead7d1] bg-white p-8 text-lg leading-9 text-[#332725] shadow-sm">
          {article.content}
        </div>

        {faqItems.length > 0 && (
          <section className="mt-14 rounded-[2rem] border border-[#ead7d1] bg-white p-8 shadow-sm">
            <h2 className="font-serif text-3xl text-[#332725]">FAQ</h2>

            <div className="mt-6 grid gap-4">
              {faqItems.map((item) => (
                <details
                  key={item.question}
                  className="rounded-2xl border border-[#ead7d1] bg-[#fff8f6] p-5"
                >
                  <summary className="cursor-pointer font-medium text-[#332725]">
                    {item.question}
                  </summary>
                  <p className="mt-4 whitespace-pre-line leading-7 text-[#5f5552]">
                    {item.answer}
                  </p>
                </details>
              ))}
            </div>
          </section>
        )}

        <ConsultationCta className="mt-14 px-0 py-0" />

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
                    {relatedArticle.h1 || relatedArticle.title}
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
