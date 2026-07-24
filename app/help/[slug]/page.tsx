import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import Breadcrumbs from "@/components/Breadcrumbs";
import JsonLd from "@/components/seo/json-ld";
import ConsultationCta from "@/components/sections/ConsultationCta";
import {
  getHelpTopicPage,
  helpTopicPageSlugs,
  type HelpTopicFaq,
  type HelpTopicPage,
} from "@/src/lib/help-topic-pages";
import { absoluteUrl, defaultSocialImage } from "@/src/lib/seo";
import { createPageSchema } from "@/src/lib/schema-org";

type Props = {
  params: Promise<{ slug: string }>;
};

function createFaqSchema(path: string, faq: HelpTopicFaq[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${absoluteUrl(path)}#faq`,
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

function getBreadcrumbs(page: HelpTopicPage) {
  return [
    { name: "Главная", path: "/" },
    { name: "С чем я могу помочь", path: "/help" },
    { name: page.h1, path: page.path },
  ];
}

export function generateStaticParams() {
  return helpTopicPageSlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = getHelpTopicPage(slug);

  if (!page) return {};

  const canonical = absoluteUrl(page.path);

  return {
    title: page.title,
    description: page.description,
    alternates: {
      canonical,
    },
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      title: page.title,
      description: page.description,
      url: canonical,
      siteName: "Luneva Psy",
      locale: "ru_RU",
      type: "website",
      images: [defaultSocialImage],
    },
    twitter: {
      card: "summary_large_image",
      title: page.title,
      description: page.description,
      images: [defaultSocialImage.url],
    },
  };
}

function TextBlock({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-[#ead7d1] bg-white/75 p-7 shadow-[0_12px_35px_rgba(70,45,40,0.05)] sm:p-9">
      <h2 className="font-serif text-[2rem] leading-tight text-[#332725] sm:text-[2.55rem]">
        {title}
      </h2>
      <div className="mt-6 h-px w-16 bg-[#c98778]" />
      <div className="mt-7 text-[1.03rem] leading-[1.75] text-[#5f5552] sm:text-[1.08rem]">
        {children}
      </div>
    </section>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {items.map((item) => (
        <li
          key={item}
          className="relative rounded-[20px] border border-[#f0ddd6] bg-[#fffaf8] px-5 py-4 pl-11 text-[#5f5552]"
        >
          <span
            className="absolute left-5 top-[1.55rem] h-1.5 w-1.5 rounded-full bg-[#c98778]"
            aria-hidden="true"
          />
          {item}
        </li>
      ))}
    </ul>
  );
}

function Paragraphs({ items }: { items: string[] }) {
  return (
    <div className="space-y-5">
      {items.map((item) => (
        <p key={item}>{item}</p>
      ))}
    </div>
  );
}

export default async function HelpTopicPage({ params }: Props) {
  const { slug } = await params;
  const page = getHelpTopicPage(slug);

  if (!page) notFound();

  const breadcrumbs = getBreadcrumbs(page);

  return (
    <main className="bg-[#fff8f6] px-5 py-16 sm:px-8 sm:py-24">
      <JsonLd
        data={[
          createPageSchema({
            path: page.path,
            title: page.h1,
            description: page.description,
            breadcrumbs,
          }),
          createFaqSchema(page.path, page.faq),
        ]}
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

        <h1 className="mt-4 max-w-4xl font-serif text-[2.65rem] leading-[1.08] text-[#332725] sm:text-[4rem] lg:text-[4.75rem]">
          {page.h1}
        </h1>

        <div className="mt-10 rounded-[30px] border border-[#ead7d1] bg-white/80 p-7 shadow-[0_16px_45px_rgba(70,45,40,0.06)] sm:p-10">
          <div className="max-w-3xl space-y-5 text-[1.08rem] leading-[1.78] text-[#5f5552] sm:text-[1.14rem]">
            {page.intro.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>

          <Link
            href="/contacts#booking"
            className="mt-8 inline-flex min-h-14 items-center justify-center rounded-[14px] bg-[#332a26] px-7 text-[0.95rem] font-medium text-white no-underline shadow-lg shadow-[#332a26]/10 transition hover:bg-[#3d322e] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#c98778] motion-reduce:transition-none"
          >
            Записаться на консультацию
            <span className="ml-3" aria-hidden="true">
              →
            </span>
          </Link>
        </div>

        <div className="mt-10 grid gap-8">
          <TextBlock title="С чем можно обратиться">
            <BulletList items={page.manifestations} />
          </TextBlock>

          <TextBlock title="Как это может ощущаться в повседневной жизни">
            <Paragraphs items={page.dailyLife} />
          </TextBlock>

          <TextBlock title="Почему это происходит">
            <Paragraphs items={page.reasons} />
          </TextBlock>

          <TextBlock title="Как может помочь психотерапия">
            <Paragraphs items={page.therapy} />
          </TextBlock>

          <TextBlock title="Когда особенно важно обратиться за помощью">
            <BulletList items={page.important} />
          </TextBlock>

          <TextBlock title="Как проходит работа">
            <ol className="grid gap-4">
              {page.process.map((item, index) => (
                <li
                  key={item}
                  className="grid grid-cols-[2.4rem_1fr] gap-4 rounded-[20px] border border-[#f0ddd6] bg-[#fffaf8] px-5 py-4"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f7e7e2] text-sm font-medium text-[#9c544c]">
                    {index + 1}
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ol>
          </TextBlock>

          <TextBlock title="Частые вопросы">
            <div className="divide-y divide-[#ead7d1] rounded-[22px] border border-[#ead7d1] bg-[#fffaf8]">
              {page.faq.map((item) => (
                <details key={item.question} className="group p-5 sm:p-6">
                  <summary className="cursor-pointer list-none font-medium text-[#332725] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#c98778]">
                    <span className="inline-flex w-full items-center justify-between gap-4">
                      {item.question}
                      <span
                        className="text-[#c98778] transition group-open:rotate-45 motion-reduce:transition-none"
                        aria-hidden="true"
                      >
                        +
                      </span>
                    </span>
                  </summary>
                  <p className="mt-4 max-w-3xl text-[#5f5552]">{item.answer}</p>
                </details>
              ))}
            </div>
          </TextBlock>

          <TextBlock title="Читайте также">
            <div className="grid gap-4 sm:grid-cols-2">
              {page.readAlso.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="group rounded-[20px] border border-[#ead7d1] bg-[#fffaf8] p-5 text-left no-underline transition hover:-translate-y-0.5 hover:shadow-[0_14px_34px_rgba(70,45,40,0.07)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#c98778] motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                >
                  <span className="font-medium text-[#332725]">
                    {link.label}
                    <span
                      className="ml-2 inline-block text-[#c98778] transition group-hover:translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
                      aria-hidden="true"
                    >
                      →
                    </span>
                  </span>
                  <span className="mt-3 block text-[0.95rem] leading-6 text-[#6f625e]">
                    {link.description}
                  </span>
                </Link>
              ))}
            </div>
          </TextBlock>
        </div>

        <div className="mt-12 rounded-[30px] border border-[#ead7d1] bg-[#fbf3ef] p-7 shadow-[0_16px_45px_rgba(70,45,40,0.05)] sm:p-10">
          <h2 className="max-w-3xl font-serif text-[2.1rem] leading-tight text-[#332725] sm:text-[2.8rem]">
            Можно начать с одного спокойного разговора
          </h2>
          <p className="mt-5 max-w-3xl text-[1.08rem] leading-[1.75] text-[#5f5552]">
            {page.finalCtaText}
          </p>
          <Link
            href="/contacts#booking"
            className="mt-8 inline-flex min-h-14 items-center justify-center rounded-[14px] bg-[#332a26] px-7 text-[0.95rem] font-medium text-white no-underline shadow-lg shadow-[#332a26]/10 transition hover:bg-[#3d322e] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#c98778] motion-reduce:transition-none"
          >
            Записаться на консультацию
            <span className="ml-3" aria-hidden="true">
              →
            </span>
          </Link>
        </div>

        <ConsultationCta className="mt-16 px-0 py-0" />
      </div>
    </main>
  );
}
