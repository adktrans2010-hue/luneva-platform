import { readFile } from "node:fs/promises";
import path from "node:path";

import type { Metadata } from "next";
import { notFound } from "next/navigation";

import LegalPage from "@/components/legal/legal-page";
import PageStructuredData from "@/components/seo/page-structured-data";
import { defaultSocialImage } from "@/src/lib/seo";

const legalDocuments = {
  terms: {
    title: "Пользовательское соглашение",
    description: "Пользовательское соглашение сайта Luneva Psy.",
    updatedAt: "13 июля 2026 г.",
  },
  privacy: {
    title: "Политика обработки персональных данных",
    description: "Политика обработки персональных данных сайта Luneva Psy.",
    updatedAt: "13 июля 2026 г.",
  },
  consent: {
    title: "Согласие на обработку персональных данных",
    description: "Согласие на обработку персональных данных на сайте Luneva Psy.",
    updatedAt: "13 июля 2026 г.",
  },
  cookies: {
    title: "Политика использования Cookie",
    description: "Политика использования файлов Cookie на сайте Luneva Psy.",
    updatedAt: "13 июля 2026 г.",
  },
} as const;

type LegalSlug = keyof typeof legalDocuments;
type LegalPageProps = { params: Promise<{ slug: string }> };

function isLegalSlug(slug: string): slug is LegalSlug {
  return slug in legalDocuments;
}

async function readLegalDocument(slug: LegalSlug) {
  return readFile(path.join(process.cwd(), "content", "legal", `${slug}.md`), "utf8");
}

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(legalDocuments).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: LegalPageProps): Promise<Metadata> {
  const { slug } = await params;
  if (!isLegalSlug(slug)) return {};

  const document = legalDocuments[slug];
  const canonical = `https://luneva-psy.ru/legal/${slug}`;

  return {
    title: `${document.title} | Luneva Psy`,
    description: document.description,
    alternates: { canonical },
    openGraph: {
      title: `${document.title} | Luneva Psy`,
      description: document.description,
      url: canonical,
      siteName: "Luneva Psy",
      type: "website",
      locale: "ru_RU",
      images: [defaultSocialImage],
    },
    twitter: {
      card: "summary_large_image",
      title: `${document.title} | Luneva Psy`,
      description: document.description,
      images: [defaultSocialImage.url],
    },
    robots: { index: true, follow: true },
  };
}

export default async function LegalDocumentPage({ params }: LegalPageProps) {
  const { slug } = await params;
  if (!isLegalSlug(slug)) notFound();

  const document = legalDocuments[slug];
  const content = await readLegalDocument(slug);

  return (
    <>
      <PageStructuredData
        path={`/legal/${slug}`}
        title={document.title}
        description={document.description}
        breadcrumbs={[
          { name: "Главная", path: "/" },
          { name: "Правовая информация", path: "/legal/terms" },
          { name: document.title, path: `/legal/${slug}` },
        ]}
      />
      <LegalPage
        title={document.title}
        updatedAt={document.updatedAt}
        content={content}
      />
    </>
  );
}
