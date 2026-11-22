import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import fs from "node:fs";
import nodePath from "node:path";
import type { ReactNode } from "react";

import Breadcrumbs from "@/components/Breadcrumbs";
import RppBookingLink from "@/components/rpp/RppBookingLink";
import ServiceViewTracker from "@/components/ServiceViewTracker";
import PageStructuredData from "@/components/seo/page-structured-data";
import ConsultationCta from "@/components/sections/ConsultationCta";
import { formatKopeks, getPublicConsultationProducts } from "@/src/lib/consultation-products";
import { getRppSections, rppPages, type RppArticleBlock, type RppPageDefinition } from "@/src/lib/rpp-pages";

type Props = { params: Promise<{ slug?: string[] }> };

const rppLandingMetadata = {
  title: "Психолог по отношениям с едой | Александра Лунева",
  description: "Психологические онлайн-консультации для тех, кто хочет лучше понимать своё пищевое поведение, чувства и отношения с телом.",
};

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

function generateStaticParams() {
  return Object.keys(rppPages).map((key) => ({ slug: key ? key.split("/") : [] }));
}

export { generateStaticParams };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const key = pageKey((await params).slug);
  const page = rppPages[key];
  if (!page) return {};
  const path = pagePath(key);
  const title = key === "" ? rppLandingMetadata.title : (page.seoTitle ?? `${page.title} | Luneva Psy`);
  const description = key === "" ? rppLandingMetadata.description : page.description;
  return {
    title,
    description,
    alternates: { canonical: `https://luneva-psy.ru${path}` },
    robots: page.status === "published" ? { index: true, follow: true } : { index: false, follow: false },
    openGraph: {
      title,
      description,
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

const landingSituations = [
  {
    title: "Еда и переживания",
    text: "Когда питание становится привычным способом справляться с переживаниями.",
  },
  {
    title: "Пищевые привычки",
    text: "Когда хочется лучше понимать свои привычки и отношение к еде в повседневной жизни.",
  },
  {
    title: "Непринятие тела",
    text: "Когда отношение к внешности влияет на настроение, самооценку и свободу в обычной жизни.",
  },
  {
    title: "Вина и стыд из-за еды",
    text: "Когда после еды остаются самокритика, тревога и желание снова всё контролировать.",
  },
  {
    title: "Голод и насыщение",
    text: "Когда трудно замечать голод и насыщение и понимать свои ощущения.",
  },
  {
    title: "Сложные отношения с едой",
    text: "Когда мысли о еде, весе и правилах питания занимают слишком много места в жизни.",
  },
];

const workSteps = [
  {
    title: "Знакомимся и обсуждаем ваш запрос",
    text: "На первой встрече можно спокойно рассказать о том, что сейчас происходит, и понять, с чего хочется начать.",
  },
  {
    title: "Исследуем ваши чувства и привычки",
    text: "Вместе замечаем ситуации, чувства и привычные способы справляться с напряжением вокруг еды и тела.",
  },
  {
    title: "Двигаемся к изменениям в вашем темпе",
    text: "Выбираем дальнейшие шаги бережно и регулярно сверяемся с вашим запросом — без давления и обещаний быстрых результатов.",
  },
];

const landingBenefits = ["Онлайн", "55 минут", "Бережный подход", "Конфиденциально"];

const landingNavigation = [
  { href: "#about", label: "Обо мне" },
  { href: "#help", label: "С чем я помогаю" },
  { href: "#process", label: "Как проходит консультация" },
  { href: "#rpp-pricing", label: "Стоимость" },
  { href: "/contacts", label: "Контакты" },
];

const landingFaq = [
  {
    question: "Нужно ли заранее формулировать запрос?",
    answer:
      "Нет. На первой встрече мы вместе обсудим, что вас волнует в отношениях с едой и телом и чему хочется уделить внимание.",
  },
  {
    question: "Можно ли обсудить напряжение и чувство вины вокруг еды?",
    answer:
      "Да. На встрече можно спокойно обсудить, когда это происходит, что предшествует таким эпизодам и какая поддержка может быть полезна.",
  },
  {
    question: "Можно работать онлайн или лучше очно?",
    answer:
      "Доступны оба формата. Выбор зависит от ваших обстоятельств и возможности организовать спокойное, конфиденциальное пространство для разговора.",
  },
  {
    question: "Сколько длится встреча?",
    answer: "Актуальная продолжительность указана ниже в блоке форматов и стоимости и автоматически берётся из действующего расписания услуг.",
  },
  {
    question: "Нужна ли регулярная работа?",
    answer:
      "Это обсуждается индивидуально после знакомства и уточнения запроса. Решение о продолжении и частоте встреч принимается совместно.",
  },
  {
    question: "Можно ли начать с одной встречи?",
    answer:
      "Да. Первая встреча помогает познакомиться, обсудить ситуацию и понять, подходит ли вам формат дальнейшей работы.",
  },
];

async function RppIndexPage() {
  const pricingItems = await getPublicConsultationProducts();
  const primaryPricing = pricingItems.find((item) => item.durationMinutes === 55) ?? pricingItems[0];

  return (
    <>
      <ServiceViewTracker serviceType="eating_behavior" />
      <header className="mt-7 rounded-[24px] border border-[#e7ddd3] bg-[#fffdf9]/90 px-4 py-3 shadow-[0_10px_30px_rgba(52,47,38,0.05)] backdrop-blur sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <a href="#rpp-hero" className="shrink-0 leading-tight text-[#334b3c]">
            <span className="block font-serif text-2xl">Александра</span>
            <span className="block text-[11px] uppercase tracking-[0.14em] text-[#746b62]">Психолог</span>
          </a>
          <nav aria-label="Навигация по странице" className="hidden items-center gap-4 xl:flex">
            {landingNavigation.map((item) => (
              <a key={item.href} href={item.href} className="text-sm text-[#5f625b] transition hover:text-[#334b3c]">
                {item.label}
              </a>
            ))}
          </nav>
          <RppBookingLink className="hidden min-h-11 items-center justify-center rounded-xl bg-[#334b3c] px-5 text-sm font-medium text-white transition hover:bg-[#263c30] sm:inline-flex">
            Записаться на консультацию
          </RppBookingLink>
          <details className="group relative xl:hidden">
            <summary className="cursor-pointer list-none rounded-xl border border-[#d8ddd4] px-4 py-2 text-sm font-medium text-[#334b3c] marker:hidden">Меню</summary>
            <nav aria-label="Мобильная навигация по странице" className="absolute right-0 z-30 mt-2 grid w-64 gap-1 rounded-2xl border border-[#e7ddd3] bg-[#fffdf9] p-3 shadow-xl">
              {landingNavigation.map((item) => (
                <a key={item.href} href={item.href} className="rounded-lg px-3 py-2 text-sm text-[#5f625b] hover:bg-[#f4eee6] hover:text-[#334b3c]">
                  {item.label}
                </a>
              ))}
              <RppBookingLink className="mt-1 inline-flex min-h-11 items-center justify-center rounded-xl bg-[#334b3c] px-4 text-sm font-medium text-white">
                Записаться на консультацию
              </RppBookingLink>
            </nav>
          </details>
        </div>
      </header>

      <section id="rpp-hero" className="relative mt-5 overflow-hidden rounded-[32px] bg-[#f5eee3] px-6 py-10 shadow-[0_18px_55px_rgba(70,45,40,0.08)] sm:px-10 sm:py-14 lg:px-14 lg:py-16">
        <LeafBranch />
        <div className="relative z-10 grid gap-10 lg:grid-cols-[1.06fr_0.94fr] lg:items-center">
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-[0.18em] text-[#a85e52] sm:text-sm">Отношения с едой • Чувства • Поддержка</p>
            <h1 className="mt-5 font-serif text-[42px] leading-[1.02] text-[#2f4034] sm:text-5xl lg:text-[64px]">Когда отношения с едой стали сложными</h1>
            <p className="mt-6 max-w-xl text-[17px] leading-8 text-[#5d5d55] sm:text-lg">
              Психологические онлайн-консультации для тех, кто хочет лучше понимать своё пищевое поведение, чувства и отношения с телом.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <RppBookingLink className="inline-flex min-h-14 items-center justify-center rounded-2xl bg-[#334b3c] px-7 text-[15px] font-medium text-white shadow-lg shadow-[#334b3c]/15 transition hover:bg-[#263c30] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a85e52]">
                Записаться на консультацию
              </RppBookingLink>
              <a href="#about" className="inline-flex min-h-14 items-center justify-center rounded-2xl border border-[#b9c4b8] bg-white/70 px-7 text-[15px] font-medium text-[#334b3c] transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a85e52]">
                Подробнее обо мне
              </a>
            </div>
            <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {landingBenefits.map((benefit) => (
                <li key={benefit} className="rounded-xl border border-white/80 bg-white/60 px-3 py-3 text-center text-sm font-medium text-[#425649]">{benefit}</li>
              ))}
            </ul>
          </div>
          <div className="relative mx-auto w-full max-w-[440px] lg:max-w-none">
            <div className="absolute -inset-3 rounded-[36px] bg-[#dfb9aa]/45" />
            <div className="relative aspect-[0.78] overflow-hidden rounded-[30px] border-8 border-[#fffaf4] shadow-[0_20px_50px_rgba(61,48,37,0.18)]">
              <Image src="/rpp-alexandra.jpg" alt="Александра Лунева, психолог" fill priority sizes="(min-width: 1024px) 42vw, 92vw" className="object-cover object-[center_36%]" />
            </div>
            <p className="relative mx-auto -mt-10 max-w-[88%] rounded-2xl bg-[#fffdf9] px-5 py-4 text-center font-serif text-xl leading-snug text-[#8d554b] shadow-lg">
              Еда может быть источником заботы о себе, а не борьбы
            </p>
          </div>
        </div>
      </section>

      <section id="help" className="scroll-mt-28 pt-20">
        <p className="text-sm uppercase tracking-[0.2em] text-[#a85e52]">С чем я помогаю</p>
        <h2 className="mt-3 max-w-3xl font-serif text-[36px] leading-tight text-[#2f4034] sm:text-[46px]">О сложном можно говорить бережно и без оценки</h2>
        <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {landingSituations.map((situation, index) => (
            <article key={situation.title} className="rounded-[24px] border border-[#e8ddd2] bg-[#fffdf9] p-6 shadow-[0_12px_34px_rgba(70,45,40,0.05)]">
              <span aria-hidden="true" className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#e5eee5] text-sm font-semibold text-[#334b3c]">0{index + 1}</span>
              <h3 className="mt-4 font-serif text-[25px] leading-snug text-[#2f4034]">{situation.title}</h3>
              <p className="mt-3 text-[15px] leading-7 text-[#656259]">{situation.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="about" className="scroll-mt-28 mt-20 overflow-hidden rounded-[32px] bg-[#eaf0e8] p-7 sm:p-10 lg:p-14">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div className="relative mx-auto w-full max-w-md">
            <div className="relative aspect-[0.82] overflow-hidden rounded-[28px] shadow-[0_18px_45px_rgba(51,75,60,0.18)]">
              <Image src="/rpp-alexandra.jpg" alt="Александра Лунева на консультации" fill sizes="(min-width: 1024px) 34vw, 90vw" className="object-cover object-[center_18%]" />
            </div>
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-[#a85e52]">Обо мне</p>
            <h2 className="mt-3 font-serif text-[36px] leading-tight text-[#2f4034] sm:text-[46px]">Я помогаю выстроить более спокойные отношения с собой и едой</h2>
            <p className="mt-6 text-lg leading-8 text-[#526057]">
              Я веду психологическую практику с 2019 года и провела более 2500 часов индивидуальных консультаций. Помогаю разбираться в отношениях с едой, телом и пищевыми привычками в формате психологических консультаций.
            </p>
            <p className="mt-4 text-lg leading-8 text-[#526057]">На консультации можно не знать готового ответа: здесь есть место для вашего темпа, сомнений и бережного исследования отношений с едой, телом и собой.</p>
            <Link href="/about" className="mt-7 inline-flex min-h-12 items-center justify-center rounded-xl border border-[#a7b9a8] bg-white/70 px-6 font-medium text-[#334b3c] transition hover:bg-white">
              Подробнее обо мне
            </Link>
            <blockquote className="mt-8 rounded-2xl border-l-4 border-[#c77c6d] bg-white/60 px-5 py-4 font-serif text-xl leading-snug text-[#526057]">«Изменения становятся возможнее, когда вместо борьбы появляется внимание к себе».</blockquote>
          </div>
        </div>
        <Link href="/certificates" className="mt-9 inline-flex text-[#334b3c] underline underline-offset-4">
          Образование и квалификация
        </Link>
      </section>

      <section id="process" className="scroll-mt-28 pt-20">
        <p className="text-sm uppercase tracking-[0.2em] text-[#a85e52]">Как проходит консультация</p>
        <h2 className="mt-3 font-serif text-[36px] leading-tight text-[#2f4034] sm:text-[46px]">Спокойно, последовательно, в вашем темпе</h2>
        <div className="mt-9 grid gap-5 lg:grid-cols-[1fr_1fr_1fr_0.95fr]">
          {workSteps.map((step, index) => (
            <article key={step.title} className="rounded-[26px] border border-[#e8ddd2] bg-[#fff8f1] p-6 sm:p-7">
              <span className="text-sm uppercase tracking-[0.16em] text-[#a85e52]">Шаг {index + 1}</span>
              <h3 className="mt-4 font-serif text-[26px] leading-tight text-[#2f4034]">{step.title}</h3>
              <p className="mt-4 text-[15px] leading-7 text-[#656259]">{step.text}</p>
            </article>
          ))}
          {primaryPricing ? (
            <article id="rpp-pricing" className="scroll-mt-28 flex flex-col rounded-[26px] bg-[#334b3c] p-7 text-white shadow-[0_15px_35px_rgba(51,75,60,0.18)]">
              <p className="text-sm uppercase tracking-[0.16em] text-[#dce8da]">Стоимость</p>
              <h3 className="mt-4 font-serif text-[28px] leading-tight">Онлайн-консультация</h3>
              <p className="mt-4 text-sm leading-6 text-[#e1ebe0]">{primaryPricing.durationMinutes} минут • актуальная цена из расписания</p>
              <p className="mt-3 font-serif text-3xl">{formatKopeks(primaryPricing.priceKopeks)} руб.</p>
              <RppBookingLink className="mt-auto inline-flex min-h-12 items-center justify-center rounded-xl bg-white px-4 py-3 text-center text-sm font-medium text-[#334b3c] transition hover:bg-[#f7f4ed]">Записаться</RppBookingLink>
            </article>
          ) : null}
        </div>
      </section>

      {pricingItems.length > 1 ? (
        <section className="pt-16">
          <p className="text-sm uppercase tracking-[0.2em] text-[#a85e52]">Другие форматы</p>
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            {pricingItems.filter((item) => item.id !== primaryPricing?.id).map((item) => (
              <article key={item.id} className="flex flex-col justify-between rounded-[26px] border border-[#e8ddd2] bg-white p-7 shadow-sm">
                <div>
                  <h3 className="font-serif text-[25px] text-[#2f4034]">{item.name}</h3>
                  <p className="mt-4 text-[16px] leading-7 text-[#656259]">{item.sessionsCount} консультаций, {item.durationMinutes} минут, <span className="font-semibold text-[#2f4034]">{formatKopeks(item.priceKopeks)} руб.</span></p>
                  {item.savingsKopeks ? <p className="mt-2 text-sm font-medium text-[#a85e52]">Экономия {formatKopeks(item.savingsKopeks)} руб.</p> : null}
                </div>
                <RppBookingLink className="mt-6 inline-flex min-h-12 items-center justify-center rounded-xl border border-[#a7b9a8] px-5 text-sm font-medium text-[#334b3c] transition hover:bg-[#edf3ec]">Выбрать формат</RppBookingLink>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="pt-20">
        <p className="text-sm uppercase tracking-[0.22em] text-[#c98778]">Частые вопросы</p>
        <h2 className="mt-3 font-serif text-[36px] leading-tight text-[#332725] sm:text-[46px]">Перед первой встречей</h2>
        <div className="mt-9 grid gap-4">
          {landingFaq.map((item) => (
            <details key={item.question} className="group rounded-[22px] border border-[#ead7d1] bg-white/75 p-5 shadow-[0_10px_28px_rgba(70,45,40,0.04)]">
              <summary className="cursor-pointer list-none font-serif text-[22px] leading-snug text-[#332725] marker:hidden">
                <span className="flex items-start justify-between gap-5">
                  {item.question}
                  <span aria-hidden="true" className="text-[#c98778] transition group-open:rotate-45">+</span>
                </span>
              </summary>
              <p className="mt-4 text-[16px] leading-8 text-[#5f5552]">{item.answer}</p>
            </details>
          ))}
        </div>
        <p className="mt-6 rounded-[20px] border border-[#ead7d1] bg-[#fbf3ef] px-6 py-5 text-sm leading-7 text-[#5f5552]">
          Формат встречи — индивидуальная психологическая консультация: разговор о ваших чувствах, переживаниях и привычках.
        </p>
      </section>

      <section className="mt-20 overflow-hidden rounded-[30px] border border-[#ead7d1] bg-[#fbf3ef] px-7 py-10 shadow-[0_18px_55px_rgba(70,45,40,0.06)] sm:px-10 lg:px-14">
        <div className="max-w-4xl">
          <h2 className="font-serif text-[34px] leading-tight text-[#332725] sm:text-[46px]">
            Давайте сделаем первый шаг к спокойным отношениям с едой и с собой
          </h2>
          <p className="mt-6 text-lg leading-8 text-[#5f5552]">
            На первой консультации можно познакомиться, обсудить текущую ситуацию и вместе определить подходящий формат дальнейшей работы.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <RppBookingLink
              className="inline-flex min-h-14 items-center justify-center rounded-[16px] bg-[#332a26] px-7 text-[15px] font-medium text-white shadow-lg shadow-[#332a26]/10 transition hover:bg-[#3d322e] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9c544c]"
            >
              Записаться на консультацию
            </RppBookingLink>
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
    { name: key === "" ? "Отношения с едой" : page.title, path },
  ];

  return (
    <section className="luneva-fade bg-[#fff8f6] px-5 py-16 sm:px-8 sm:py-20 lg:py-24">
      {page.status === "published" && (
        <>
          <PageStructuredData path={path} title={key === "" ? rppLandingMetadata.title : page.title} description={key === "" ? rppLandingMetadata.description : page.description} breadcrumbs={breadcrumbs} />
          {key !== "" && page.articleBlocks ? <ArticleStructuredData page={page} path={path} /> : null}
        </>
      )}
      <div className="mx-auto max-w-6xl">
        <Breadcrumbs items={breadcrumbs.map((item, index) => ({ label: item.name, href: index < breadcrumbs.length - 1 ? item.path : undefined }))} />
        {key !== "" ? (
          <>
            <p className="text-sm uppercase tracking-[0.22em] text-[#c98778]">{page.eyebrow}</p>
            <h1 className="mt-4 max-w-5xl font-serif text-4xl leading-[1.08] text-[#332725] sm:text-5xl lg:text-6xl">
              {page.title}
            </h1>
            <p className="mt-7 max-w-3xl text-lg leading-8 text-[#5f5552]">{page.description}</p>
          </>
        ) : null}

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
