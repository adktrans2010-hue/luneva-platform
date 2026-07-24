import type { Metadata } from "next";
import { notFound } from "next/navigation";

import Breadcrumbs from "@/components/Breadcrumbs";
import PageStructuredData from "@/components/seo/page-structured-data";
import ConsultationCta from "@/components/sections/ConsultationCta";
import { helpTopics } from "@/src/lib/help-topics";
import { absoluteUrl, defaultSocialImage } from "@/src/lib/seo";

type Props = {
  params: Promise<{ slug: string }>;
};

function getTopicBySlug(slug: string) {
  return helpTopics.find((topic) => topic.href === `/help/${slug}`);
}

export function generateStaticParams() {
  return helpTopics
    .filter((topic) => topic.href.startsWith("/help/"))
    .map((topic) => ({
      slug: topic.href.replace("/help/", ""),
    }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const topic = getTopicBySlug(slug);

  if (!topic) return {};

  const title = `${topic.title} | Психолог Александра Лунева`;
  const description = `${topic.description} ${topic.explanation}`;
  const canonical = absoluteUrl(topic.href);

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: "Luneva Psy",
      locale: "ru_RU",
      type: "website",
      images: [defaultSocialImage],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [defaultSocialImage.url],
    },
  };
}

export default async function HelpTopicPage({ params }: Props) {
  const { slug } = await params;
  const topic = getTopicBySlug(slug);

  if (!topic) notFound();

  const breadcrumbs = [
    { name: "Главная", path: "/" },
    { name: "С чем я могу помочь", path: "/help" },
    { name: topic.title, path: topic.href },
  ];

  return (
    <section className="bg-[#fff8f6] px-5 py-16 sm:px-8 sm:py-24">
      <PageStructuredData
        path={topic.href}
        title={topic.title}
        description={`${topic.description} ${topic.explanation}`}
        breadcrumbs={breadcrumbs}
      />
      <div className="mx-auto max-w-5xl">
        <Breadcrumbs
          items={breadcrumbs.map((item, index) => ({
            label: item.name,
            href: index < breadcrumbs.length - 1 ? item.path : undefined,
          }))}
        />

        <p className="text-sm uppercase tracking-[0.22em] text-[#c98778]">
          Психологическая помощь
        </p>

        <h1 className="mt-4 max-w-4xl font-serif text-4xl leading-tight text-[#332725] sm:text-5xl lg:text-6xl">
          {topic.title}
        </h1>

        <div className="mt-10 rounded-[2rem] border border-[#ead7d1] bg-white/75 p-7 shadow-[0_12px_35px_rgba(70,45,40,0.06)] sm:p-9">
          <p className="max-w-3xl text-lg leading-8 text-[#5f5552]">
            {topic.description}
          </p>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-[#5f5552]">
            {topic.explanation}
          </p>
        </div>

        <ConsultationCta className="mt-16 px-0 py-0" />
      </div>
    </section>
  );
}
