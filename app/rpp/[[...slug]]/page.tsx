import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import fs from "node:fs";
import nodePath from "node:path";
import type { ReactNode } from "react";

import Breadcrumbs from "@/components/Breadcrumbs";
import PageStructuredData from "@/components/seo/page-structured-data";
import ConsultationCta from "@/components/sections/ConsultationCta";
import { navigationItems } from "@/src/lib/navigation";
import { getRppSections, rppPages, type RppArticleBlock, type RppPageDefinition } from "@/src/lib/rpp-pages";

type Props = { params: Promise<{ slug?: string[] }> };

type RppCardLink = {
  href: string;
  label: string;
};

type RppSituationCard = {
  title: string;
  description: string;
  icon: "question" | "control" | "fear" | "care";
  links: RppCardLink[];
};

type RppSectionConfig = {
  id: string;
  title: string;
  eyebrow: string;
  links: RppCardLink[];
};

const rppNavigation = navigationItems.find((item) => item.href === "/rpp");
const rppLinkMap = new Map(rppNavigation?.groups?.flatMap((group) => group.links.map((link) => [link.href, link.label])) ?? []);

const appointmentHref = "/contacts#booking";

const situationCards: RppSituationCard[] = [
  {
    title: "Я не понимаю, РПП ли это",
    description: "Мысли о еде и теле занимают слишком много места, но трудно понять, насколько это серьезно",
    icon: "question",
    links: [
      { href: "/rpp/chto-takoe-rpp", label: "Что такое РПП" },
      { href: "/rpp/priznaki", label: "Симптомы и признаки" },
      { href: "/rpp/faq", label: "Вопросы и ответы" },
    ],
  },
  {
    title: "Я переедаю и теряю контроль",
    description: "Вечерние переедания, еда на фоне тревоги, стыд и обещания снова себя ограничить",
    icon: "control",
    links: [
      { href: "/rpp/pereedanie", label: "Переедание и эмоциональное питание" },
      { href: "/rpp/kompulsivnoe-pereedanie", label: "Компульсивное переедание" },
      { href: "/rpp/diety", label: "Диеты и контроль веса" },
    ],
  },
  {
    title: "Я боюсь еды или набора веса",
    description: "Пропуски приемов пищи, строгие правила, страх определенных продуктов и постоянный контроль",
    icon: "fear",
    links: [
      { href: "/rpp/anoreksiya", label: "Нервная анорексия" },
      { href: "/rpp/bulimiya", label: "Нервная булимия" },
      { href: "/rpp/arfid", label: "ARFID" },
    ],
  },
  {
    title: "Я хочу понять, как получить помощь",
    description: "Как проходит лечение, какие специалисты могут понадобиться и с чего начать восстановление",
    icon: "care",
    links: [
      { href: "/rpp/lechenie", label: "Лечение и восстановление" },
      { href: "/rpp/samopomosh", label: "Самопомощь и безопасность" },
      { href: appointmentHref, label: "Записаться на консультацию" },
    ],
  },
];

const sectionConfigs: RppSectionConfig[] = [
  {
    id: "rpp-basics",
    eyebrow: "Основы",
    title: "Основы РПП",
    links: [
      { href: "/rpp/chto-takoe-rpp", label: "Что такое РПП" },
      { href: "/rpp/priznaki", label: "Симптомы и признаки" },
      { href: "/rpp/prichiny", label: "Причины и факторы риска" },
      { href: "/rpp/telo", label: "Отношения с телом" },
      { href: "/rpp/pereedanie", label: "Переедание и эмоциональное питание" },
      { href: "/rpp/diety", label: "Диеты и контроль веса" },
    ],
  },
  {
    id: "rpp-types",
    eyebrow: "Формы",
    title: "Виды РПП",
    links: [
      { href: "/rpp/vidy", label: "Обзор видов РПП" },
      { href: "/rpp/anoreksiya", label: "Нервная анорексия" },
      { href: "/rpp/bulimiya", label: "Нервная булимия" },
      { href: "/rpp/kompulsivnoe-pereedanie", label: "Компульсивное переедание" },
      { href: "/rpp/arfid", label: "ARFID" },
      { href: "/rpp/drugie-formy", label: "Другие формы РПП" },
    ],
  },
  {
    id: "rpp-support",
    eyebrow: "Поддержка",
    title: "Лечение и поддержка",
    links: [
      { href: "/rpp/lechenie", label: "Лечение и восстановление" },
      { href: "/rpp/samopomosh", label: "Самопомощь и безопасность" },
      { href: "/rpp/faq", label: "Вопросы и ответы" },
      { href: "/rpp/pravilo-treh-marshi-herrin", label: "Правило трех Марши Херрин" },
    ],
  },
];

const popularMaterials: RppCardLink[] = [
  { href: "/rpp/diety", label: "Почему после ограничений возникает переедание" },
  { href: "/rpp/pereedanie", label: "Что делать после переедания" },
  { href: "/rpp/pravilo-treh-marshi-herrin", label: "Правило трех Марши Херрин" },
];

function pageKey(slug?: string[]) {
  return slug?.join("/") ?? "";
}

function pagePath(key: string) {
  return key ? `/rpp/${key}` : "/rpp";
}

function publicAssetExists(src: string) {
  const cleanPath = src.replace(/^\//u, "");
  return fs.existsSync(nodePath.join(process.cwd(), "public", cleanPath));
}

function isPublishedHref(href: string) {
  if (href.startsWith("#") || href === appointmentHref) return true;
  if (!href.startsWith("/rpp")) return true;
  const key = href.replace(/^\/rpp\/?/u, "");
  return Boolean(rppPages[key]?.status === "published");
}

function generateStaticParams() {
  return Object.keys(rppPages).map((key) => ({ slug: key ? key.split("/") : [] }));
}

export { generateStaticParams };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const key = pageKey((await params).slug);
  const page = rppPages[key];
  if (!page) return {};
  const path = pagePath(key);
  return {
    title: page.seoTitle ?? `${page.title} | Luneva Psy`,
    description: page.description,
    alternates: { canonical: `https://luneva-psy.ru${path}` },
    robots: page.status === "published" ? { index: true, follow: true } : { index: false, follow: false },
    openGraph: {
      title: page.seoTitle ?? `${page.title} | Luneva Psy`,
      description: page.description,
      url: `https://luneva-psy.ru${path}`,
      siteName: "Luneva Psy",
      locale: "ru_RU",
      type: "website",
    },
  };
}

function ArticleStructuredData({ page, path }: { page: RppPageDefinition; path: string }) {
  const canonicalUrl = `https://luneva-psy.ru${path}`;
  const graph: Record<string, unknown>[] = [
    {
      "@type": "Article",
      "@id": `${canonicalUrl}#article`,
      headline: page.title,
      description: page.description,
      inLanguage: "ru-RU",
      mainEntityOfPage: canonicalUrl,
      author: {
        "@type": "Person",
        name: "Александра Лунева",
        url: "https://luneva-psy.ru/about",
      },
      publisher: {
        "@type": "Organization",
        name: "Luneva Psy",
        url: "https://luneva-psy.ru",
      },
    },
  ];

  if (page.faq?.length) {
    graph.push({
      "@type": "FAQPage",
      "@id": `${canonicalUrl}#faq`,
      mainEntity: page.faq.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer,
        },
      })),
    });
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": graph,
        }),
      }}
    />
  );
}

function ProseParagraphs({ paragraphs }: { paragraphs: string[] }) {
  const content: ReactNode[] = [];
  let index = 0;

  while (index < paragraphs.length) {
    const paragraph = paragraphs[index];
    const startsList = paragraph.endsWith(":") && paragraphs[index + 1]?.endsWith(";");

    if (startsList) {
      const items: string[] = [];
      let cursor = index + 1;
      while (cursor < paragraphs.length && (paragraphs[cursor].endsWith(";") || (items.length > 0 && paragraphs[cursor].endsWith(".")))) {
        items.push(paragraphs[cursor].replace(/[;.]$/u, ""));
        if (paragraphs[cursor].endsWith(".")) {
          cursor += 1;
          break;
        }
        cursor += 1;
      }
      content.push(<p key={`p-${index}`}>{paragraph}</p>);
      content.push(
        <ul key={`list-${index}`} className="grid gap-3 pl-1">
          {items.map((item) => (
            <li key={item} className="flex gap-3">
              <span aria-hidden="true" className="mt-[0.7em] h-1.5 w-1.5 shrink-0 rounded-full bg-[#c98778]" />
              <span>{item}</span>
            </li>
          ))}
        </ul>,
      );
      index = cursor;
      continue;
    }

    content.push(<p key={`p-${index}`}>{paragraph}</p>);
    index += 1;
  }

  return <div className="grid gap-5 text-base leading-8 text-[#5f5552] sm:text-lg">{content}</div>;
}

function ArticleList({ block }: { block: Extract<RppArticleBlock, { type: "list" }> }) {
  const Tag = block.ordered ? "ol" : "ul";

  return (
    <Tag className={`grid gap-3 text-[16px] leading-8 text-[#5f5552] sm:text-[17px] ${block.ordered ? "list-decimal pl-6" : ""}`}>
      {block.items.map((item) => (
        <li key={item} className={block.ordered ? "pl-2" : "flex gap-3"}>
          {!block.ordered && <span aria-hidden="true" className="mt-[0.8em] h-1.5 w-1.5 shrink-0 rounded-full bg-[#c98778]" />}
          <span>{item}</span>
        </li>
      ))}
    </Tag>
  );
}

function ArticleCta({ block }: { block: Extract<RppArticleBlock, { type: "cta" }> }) {
  return (
    <aside className="my-10 overflow-hidden rounded-[28px] border border-[#ead7d1] bg-[#fbf3ef] p-7 shadow-[0_18px_48px_rgba(70,45,40,0.06)] sm:p-9">
      <h2 className="font-serif text-[32px] leading-tight text-[#332725] sm:text-[42px]">{block.title}</h2>
      <div className="mt-6 grid gap-4 text-[16px] leading-8 text-[#5f5552] sm:text-[17px]">
        {block.paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
      {block.bullets?.length ? (
        <ul className="mt-6 grid gap-3 text-[16px] leading-7 text-[#5f5552]">
          {block.bullets.map((item) => (
            <li key={item} className="flex gap-3">
              <span aria-hidden="true" className="mt-[0.75em] h-1.5 w-1.5 shrink-0 rounded-full bg-[#c98778]" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href={block.primaryHref}
          className="inline-flex min-h-13 items-center justify-center rounded-[16px] bg-[#332a26] px-6 py-4 text-[15px] font-medium text-white shadow-lg shadow-[#332a26]/10 transition hover:bg-[#3d322e] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9c544c]"
        >
          {block.primaryLabel}
        </Link>
        {block.secondaryHref && block.secondaryLabel ? (
          <Link
            href={block.secondaryHref}
            className="inline-flex min-h-13 items-center justify-center rounded-[16px] border border-[#d9aaa0] bg-white/50 px-6 py-4 text-[15px] font-medium text-[#9c544c] transition hover:bg-white/75 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9c544c]"
          >
            {block.secondaryLabel}
          </Link>
        ) : null}
      </div>
    </aside>
  );
}

function ArticleBlocks({ blocks }: { blocks: RppArticleBlock[] }) {
  return (
    <div className="grid gap-6 text-[#5f5552]">
      {blocks.map((block, index) => {
        const key = `${block.type}-${index}`;

        if (block.type === "lead") {
          return (
            <p key={key} className="font-serif text-[28px] leading-[1.35] text-[#332725] sm:text-[34px]">
              {block.text}
            </p>
          );
        }

        if (block.type === "paragraph") {
          return (
            <p key={key} className="text-[16px] leading-8 text-[#5f5552] sm:text-[17px]">
              {block.text}
            </p>
          );
        }

        if (block.type === "heading") {
          if (block.level === 3) {
            return (
              <h3 key={key} className="pt-4 font-serif text-[28px] leading-tight text-[#332725] sm:text-[32px]">
                {block.text}
              </h3>
            );
          }

          return (
            <h2 key={key} className="pt-8 font-serif text-[32px] leading-tight text-[#332725] sm:text-[42px]">
              {block.text}
            </h2>
          );
        }

        if (block.type === "list") {
          return <ArticleList key={key} block={block} />;
        }

        if (block.type === "emphasis") {
          return (
            <div key={key} className="rounded-[22px] border border-[#ead7d1] bg-white/70 px-6 py-5 font-serif text-[24px] leading-snug text-[#8d443e] shadow-[0_12px_35px_rgba(70,45,40,0.04)]">
              {block.text}
            </div>
          );
        }

        if (block.type === "quote") {
          return (
            <blockquote key={key} className="border-l-2 border-[#c98778] py-3 pl-6 text-[16px] italic leading-8 text-[#5f5552] sm:text-[17px]">
              {block.text}
            </blockquote>
          );
        }

        if (block.type === "image") {
          if (!publicAssetExists(block.src)) return null;

          return (
            <figure key={key} className="my-4 overflow-hidden rounded-[28px] border border-[#ead7d1] bg-white/70 p-4 shadow-[0_16px_42px_rgba(70,45,40,0.06)]">
              <Image src={block.src} alt={block.alt} width={1200} height={800} className="h-auto w-full rounded-[20px]" />
              {block.caption ? <figcaption className="mt-4 text-sm leading-6 text-[#7a6d69]">{block.caption}</figcaption> : null}
            </figure>
          );
        }

        if (block.type === "cta") {
          return <ArticleCta key={key} block={block} />;
        }

        return null;
      })}
    </div>
  );
}

function ArticleFaq({ page }: { page: RppPageDefinition }) {
  if (!page.faq?.length) return null;

  return (
    <section className="mt-14 border-t border-[#ead7d1] pt-12">
      <h2 className="font-serif text-[34px] leading-tight text-[#332725] sm:text-[44px]">Частые вопросы</h2>
      <div className="mt-7 grid gap-4">
        {page.faq.map((item) => (
          <details key={item.question} className="group rounded-[22px] border border-[#ead7d1] bg-white/70 p-5 shadow-[0_10px_28px_rgba(70,45,40,0.04)]">
            <summary className="cursor-pointer list-none font-serif text-[22px] leading-snug text-[#332725] marker:hidden">
              <span className="inline-flex w-full items-start justify-between gap-5">
                {item.question}
                <span aria-hidden="true" className="text-[#c98778] transition group-open:rotate-45">
                  +
                </span>
              </span>
            </summary>
            <p className="mt-4 text-[16px] leading-8 text-[#5f5552]">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

function RppIcon({ type }: { type: RppSituationCard["icon"] }) {
  const common = "h-7 w-7 stroke-[#7f4b43]";

  if (type === "control") {
    return (
      <svg viewBox="0 0 32 32" aria-hidden="true" className={common} fill="none" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 7v10" />
        <path d="M12 7v10" />
        <path d="M10 17v8" />
        <path d="M22 7c-3.4 3.2-4.2 7.6-2.1 10.8" />
        <path d="M22 7v18" />
      </svg>
    );
  }

  if (type === "fear") {
    return (
      <svg viewBox="0 0 32 32" aria-hidden="true" className={common} fill="none" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 22a8.5 8.5 0 1 1 14-6.5" />
        <path d="M22 21l3 3" />
        <path d="M25 21l-3 3" />
        <path d="M11 16h.1" />
        <path d="M17 16h.1" />
      </svg>
    );
  }

  if (type === "care") {
    return (
      <svg viewBox="0 0 32 32" aria-hidden="true" className={common} fill="none" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 15a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
        <path d="M8 26a8 8 0 0 1 16 0" />
        <path d="M6 19c2.3-.4 4.2.2 5.8 1.8" />
        <path d="M26 19c-2.3-.4-4.2.2-5.8 1.8" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={common} fill="none" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 26c0-4.2 6-5.1 6-11a6 6 0 0 0-12 0" />
      <path d="M16 26v.2" />
      <path d="M13 15a3 3 0 1 1 4.8 2.4" />
    </svg>
  );
}

function LeafBranch() {
  return (
    <svg viewBox="0 0 220 220" aria-hidden="true" className="pointer-events-none absolute -bottom-8 -right-10 h-48 w-48 text-[#e6a69b]/40 sm:h-56 sm:w-56">
      <path d="M16 202C67 153 107 106 182 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <path d="M73 151c-17 4-29-1-39-14 17-4 30 0 39 14Z" fill="currentColor" opacity="0.45" />
      <path d="M99 125c-18 2-29-5-36-19 18-2 29 5 36 19Z" fill="currentColor" opacity="0.45" />
      <path d="M123 101c-17-2-26-11-29-27 17 2 26 11 29 27Z" fill="currentColor" opacity="0.45" />
      <path d="M148 75c-15-6-22-17-21-32 15 6 22 17 21 32Z" fill="currentColor" opacity="0.45" />
      <path d="M112 110c18 2 31-4 39-18-18-2-31 4-39 18Z" fill="currentColor" opacity="0.42" />
      <path d="M136 83c19-1 31-9 37-24-19 1-31 9-37 24Z" fill="currentColor" opacity="0.42" />
      <path d="M158 58c17-4 28-14 31-30-17 4-28 14-31 30Z" fill="currentColor" opacity="0.42" />
    </svg>
  );
}

function RppSituationCard({ card }: { card: RppSituationCard }) {
  return (
    <article className="group relative overflow-hidden rounded-[28px] border border-[#ead7d1] bg-white/80 p-7 shadow-[0_16px_42px_rgba(70,45,40,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_52px_rgba(70,45,40,0.09)] sm:p-8">
      <LeafBranch />
      <div className="relative z-10 flex items-start justify-between gap-6">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-[#f7e8e3] sm:h-16 sm:w-16">
          <RppIcon type={card.icon} />
        </span>
        <span aria-hidden="true" className="text-3xl leading-none text-[#c98778]">
          ✦
        </span>
      </div>
      <div className="relative z-10 mt-8">
        <h3 className="font-serif text-[30px] leading-[1.12] text-[#332725] sm:text-[34px]">{card.title}</h3>
        <div className="mt-6 h-px w-16 bg-[#c98778]" />
        <p className="mt-6 text-[16px] leading-7 text-[#5f5552]">{card.description}</p>
        <ul className="mt-7 flex flex-wrap gap-2">
          {card.links.filter((link) => isPublishedHref(link.href)).map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="inline-flex rounded-full border border-[#e0b9b0] bg-white/70 px-4 py-2 text-sm text-[#8d443e] transition hover:border-[#c98778] hover:bg-[#fff8f6] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9c544c]"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}

function MaterialLinkCard({ link }: { link: RppCardLink }) {
  return (
    <Link
      href={link.href}
      className="group relative flex min-h-48 overflow-hidden rounded-[26px] border border-[#ead7d1] bg-white/78 p-7 shadow-[0_12px_35px_rgba(70,45,40,0.05)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(70,45,40,0.08)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#9c544c]"
    >
      <LeafBranch />
      <span aria-hidden="true" className="absolute right-7 top-6 text-2xl text-[#c98778]">
        ✦
      </span>
      <span className="relative z-10 mt-auto">
        <span className="block font-serif text-[27px] leading-[1.15] text-[#332725]">{link.label}</span>
        <span className="mt-5 inline-flex text-sm uppercase tracking-[0.16em] text-[#9c544c]">Открыть материал →</span>
      </span>
    </Link>
  );
}

function RppIndexPage() {
  const visibleSections = sectionConfigs.map((section) => ({
    ...section,
    links: section.links.filter((link) => isPublishedHref(link.href)),
  }));
  const visiblePopular = popularMaterials.filter((link) => isPublishedHref(link.href));

  return (
    <>
      <div className="mt-12 rounded-[30px] border border-[#ead7d1] bg-white/68 px-6 py-9 shadow-[0_18px_55px_rgba(70,45,40,0.05)] sm:px-10 sm:py-12 lg:px-14">
        <p className="text-sm uppercase tracking-[0.24em] text-[#c98778]">Расстройства пищевого поведения</p>
        <h2 className="mt-5 max-w-5xl font-serif text-[38px] leading-[1.08] text-[#332725] sm:text-5xl lg:text-[64px]">
          Когда еда, вес и тело начинают управлять жизнью
        </h2>
        <p className="mt-7 max-w-4xl text-lg leading-8 text-[#5f5552]">
          Здесь собраны материалы о расстройствах пищевого поведения: первых признаках, причинах, переедании, анорексии,
          булимии, отношении к телу и восстановлении. Можно начать с темы, которая сейчас ближе всего
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <a
            href="#rpp-start"
            className="inline-flex min-h-14 items-center justify-center rounded-[16px] bg-[#332a26] px-7 text-[15px] font-medium text-white shadow-lg shadow-[#332a26]/10 transition hover:bg-[#3d322e] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9c544c]"
          >
            С чего начать
          </a>
          <Link
            href={appointmentHref}
            className="inline-flex min-h-14 items-center justify-center rounded-[16px] border border-[#d9aaa0] bg-white/35 px-7 text-[15px] font-medium text-[#9c544c] transition hover:bg-white/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9c544c]"
          >
            Мне нужна помощь сейчас
          </Link>
        </div>
      </div>

      <section id="rpp-start" className="scroll-mt-28 pt-20">
        <p className="text-sm uppercase tracking-[0.22em] text-[#c98778]">Навигация по состоянию</p>
        <h2 className="mt-3 font-serif text-[36px] leading-tight text-[#332725] sm:text-[46px]">С чего начать</h2>
        <div className="mt-9 grid gap-5 md:grid-cols-2">
          {situationCards.map((card) => (
            <RppSituationCard key={card.title} card={card} />
          ))}
        </div>
      </section>

      <nav aria-label="Разделы энциклопедии РПП" className="mt-16 rounded-[24px] border border-[#ead7d1] bg-white/55 p-4">
        <ul className="flex flex-wrap gap-3">
          {visibleSections.map((section) => (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                className="inline-flex rounded-full bg-white px-5 py-3 text-sm font-medium text-[#5f5552] shadow-sm transition hover:text-[#9c544c] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9c544c]"
              >
                {section.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-16 grid gap-12">
        {visibleSections.map((section) => (
          <section key={section.id} id={section.id} className="scroll-mt-28">
            <p className="text-sm uppercase tracking-[0.22em] text-[#c98778]">{section.eyebrow}</p>
            <h2 className="mt-3 font-serif text-[34px] leading-tight text-[#332725] sm:text-[44px]">{section.title}</h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {section.links.map((link) => (
                <MaterialLinkCard key={link.href} link={{ ...link, label: rppLinkMap.get(link.href) ?? link.label }} />
              ))}
            </div>
          </section>
        ))}
      </div>

      <section className="mt-16 border-t border-[#ead7d1] pt-12">
        <p className="text-sm uppercase tracking-[0.22em] text-[#c98778]">Популярные материалы</p>
        <h2 className="mt-3 font-serif text-[34px] leading-tight text-[#332725] sm:text-[44px]">Часто начинают отсюда</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {visiblePopular.map((link) => (
            <MaterialLinkCard key={link.label} link={link} />
          ))}
        </div>
      </section>

      <section className="mt-16 overflow-hidden rounded-[30px] border border-[#ead7d1] bg-[#fbf3ef] px-7 py-10 shadow-[0_18px_55px_rgba(70,45,40,0.06)] sm:px-10 lg:px-14">
        <div className="max-w-4xl">
          <h2 className="font-serif text-[34px] leading-tight text-[#332725] sm:text-[46px]">Необязательно сначала во всем разобраться</h2>
          <p className="mt-6 text-lg leading-8 text-[#5f5552]">
            Если еда, вес или тело забирают слишком много сил, можно начать с разговора. Мы обсудим, что происходит и какая
            помощь может подойти именно вам
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href={appointmentHref}
              className="inline-flex min-h-14 items-center justify-center rounded-[16px] bg-[#332a26] px-7 text-[15px] font-medium text-white shadow-lg shadow-[#332a26]/10 transition hover:bg-[#3d322e] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9c544c]"
            >
              Записаться на консультацию
            </Link>
            <Link
              href="/rpp/lechenie"
              className="inline-flex min-h-14 items-center justify-center rounded-[16px] border border-[#d9aaa0] bg-white/35 px-7 text-[15px] font-medium text-[#9c544c] transition hover:bg-white/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9c544c]"
            >
              Как проходит работа с РПП
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

export default async function RppPage({ params }: Props) {
  const key = pageKey((await params).slug);
  const page = rppPages[key];
  if (!page) notFound();

  const path = pagePath(key);
  const sections = getRppSections(page.sectionHeadings);
  const breadcrumbs = [
    { name: "Главная", path: "/" },
    ...(key ? [{ name: "Энциклопедия РПП", path: "/rpp" }] : []),
    { name: page.title, path },
  ];

  return (
    <section className="luneva-fade bg-[#fff8f6] px-5 py-16 sm:px-8 sm:py-20 lg:py-24">
      {page.status === "published" && (
        <>
          <PageStructuredData path={path} title={page.title} description={page.description} breadcrumbs={breadcrumbs} />
          {page.articleBlocks ? <ArticleStructuredData page={page} path={path} /> : null}
        </>
      )}
      <div className="mx-auto max-w-6xl">
        <Breadcrumbs items={breadcrumbs.map((item, index) => ({ label: item.name, href: index < breadcrumbs.length - 1 ? item.path : undefined }))} />
        <p className="text-sm uppercase tracking-[0.22em] text-[#c98778]">{page.eyebrow}</p>
        <h1 className="mt-4 max-w-5xl font-serif text-4xl leading-[1.08] text-[#332725] sm:text-5xl lg:text-6xl">
          {page.title}
        </h1>
        {key !== "" && <p className="mt-7 max-w-3xl text-lg leading-8 text-[#5f5552]">{page.description}</p>}

        {page.status !== "published" ? (
          <div className="mt-14 border-l-2 border-[#c98778] py-4 pl-6">
            <p className="font-serif text-3xl text-[#332725]">Материал готовится к публикации</p>
            <Link href="/rpp" className="mt-5 inline-flex text-[#9c544c]">
              Вернуться в Энциклопедию РПП →
            </Link>
          </div>
        ) : key === "" ? (
          <RppIndexPage />
        ) : (
          <article className="mt-14 max-w-4xl">
            {page.articleBlocks ? (
              <>
                <ArticleBlocks blocks={page.articleBlocks} />
                <ArticleFaq page={page} />
              </>
            ) : page.customParagraphs ? (
              <ProseParagraphs paragraphs={page.customParagraphs} />
            ) : null}
            <div className="grid gap-14">
              {sections.map((section) => (
                <section key={section.heading}>
                  <h2 className="mb-6 font-serif text-3xl leading-tight text-[#332725] sm:text-4xl">{section.heading}</h2>
                  <ProseParagraphs paragraphs={section.paragraphs} />
                </section>
              ))}
            </div>
          </article>
        )}

        {key !== "" && <ConsultationCta className="mt-20 px-0 py-0" />}
      </div>
    </section>
  );
}
