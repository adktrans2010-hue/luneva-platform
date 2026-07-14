import Link from "next/link";

import { SITE_CONTACTS } from "@/src/lib/site-contacts";
import type { ReactNode } from "react";

type LegalPageProps = {
  title: string;
  updatedAt: string;
  content: string;
};

function renderInline(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const linkPattern = /\[([^\]]+)\]\((https?:\/\/[^)]+|mailto:[^)]+)\)/g;
  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = linkPattern.exec(text)) !== null) {
    if (match.index > cursor) parts.push(text.slice(cursor, match.index));
    parts.push(
      <a
        key={`${match.index}-${match[2]}`}
        href={match[2]}
        className="text-[#9f665a] underline underline-offset-4"
      >
        {match[1]}
      </a>,
    );
    cursor = match.index + match[0].length;
  }

  if (cursor < text.length) parts.push(text.slice(cursor));
  return parts;
}

function renderMarkdown(content: string) {
  const lines = content.trim().split(/\r?\n/);
  const blocks: ReactNode[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index].trim();

    if (!line) {
      index += 1;
      continue;
    }

    if (line.startsWith("## ")) {
      blocks.push(
        <h2 key={`h2-${index}`} className="mt-10 font-serif text-3xl leading-tight text-[#332725] first:mt-0 sm:text-4xl">
          {line.slice(3)}
        </h2>,
      );
      index += 1;
      continue;
    }

    if (line.startsWith("### ")) {
      blocks.push(
        <h3 key={`h3-${index}`} className="mt-7 font-serif text-2xl leading-tight text-[#332725]">
          {line.slice(4)}
        </h3>,
      );
      index += 1;
      continue;
    }

    if (line.startsWith("- ")) {
      const items: string[] = [];
      while (index < lines.length && lines[index].trim().startsWith("- ")) {
        items.push(lines[index].trim().slice(2));
        index += 1;
      }
      blocks.push(
        <ul key={`list-${index}`} className="my-5 grid gap-2">
          {items.map((item) => (
            <li key={item} className="flex gap-3">
              <span className="mt-[0.7rem] h-1.5 w-1.5 shrink-0 rounded-full bg-[#c98778]" />
              <span>{renderInline(item)}</span>
            </li>
          ))}
        </ul>,
      );
      continue;
    }

    const paragraph = [line];
    index += 1;
    while (
      index < lines.length &&
      lines[index].trim() &&
      !lines[index].trim().startsWith("## ") &&
      !lines[index].trim().startsWith("### ") &&
      !lines[index].trim().startsWith("- ")
    ) {
      paragraph.push(lines[index].trim());
      index += 1;
    }
    blocks.push(
      <p key={`p-${index}`} className="my-4">
        {renderInline(paragraph.join(" "))}
      </p>,
    );
  }

  return blocks;
}

export default function LegalPage({ title, updatedAt, content }: LegalPageProps) {
  return (
    <section className="bg-[#fff8f6] px-6 py-16 sm:py-24">
      <div className="mx-auto max-w-5xl">
        <nav className="flex flex-wrap items-center gap-2 text-sm text-[#8a7a76]" aria-label="Хлебные крошки">
          <Link href="/" className="hover:text-[#332725]">Главная</Link>
          <span aria-hidden="true">/</span>
          <span>Правовая информация</span>
          <span aria-hidden="true">/</span>
          <span className="text-[#332725]">{title}</span>
        </nav>

        <article className="mt-8 rounded-[2.5rem] border border-[#ead7d1] bg-white/55 p-7 shadow-[0_30px_100px_rgba(51,39,37,0.06)] sm:p-12 lg:p-16">
          <p className="text-sm uppercase tracking-[0.22em] text-[#c98778]">Правовая информация</p>
          <h1 className="mt-4 font-serif text-4xl leading-tight text-[#332725] sm:text-6xl">{title}</h1>
          <p className="mt-5 text-sm text-[#8a7a76]">Дата последнего обновления: {updatedAt}</p>

          <div className="mt-12 text-base leading-7 text-[#5f5552] sm:text-lg sm:leading-8">
            {renderMarkdown(content)}
          </div>

          <aside className="mt-14 rounded-[2rem] border border-[#ead7d1] bg-[#f7e9e5] p-7 sm:p-9">
            <h2 className="font-serif text-3xl text-[#332725]">Остались вопросы?</h2>
            <p className="mt-4 leading-7 text-[#5f5552]">
              Если у вас возникли вопросы по работе сайта или обработке персональных данных, напишите нам:
            </p>
            <a href={`mailto:${SITE_CONTACTS.email}`} className="mt-4 inline-flex text-lg text-[#9f665a] underline underline-offset-4">
              {SITE_CONTACTS.email}
            </a>
          </aside>
        </article>
      </div>
    </section>
  );
}
