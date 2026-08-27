import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { helpTopicPages } from "@/src/lib/help-topic-pages";
import { getRppSections, rppPages } from "@/src/lib/rpp-pages";

type CorpusDocument = {
  id: string;
  title: string;
  category: string;
  source: string;
  tags: string[];
  filename: string;
  body: string;
};

const outputRoot = path.resolve(process.argv[2] ?? "knowledge-corpus");
const pilotRoot = path.join(outputRoot, "pilot");

function section(title: string, paragraphs: readonly string[]) {
  return paragraphs.length ? `## ${title}\n\n${paragraphs.join("\n\n")}` : "";
}

const documents: CorpusDocument[] = Object.values(helpTopicPages).map((page) => ({
  id: `help-${page.slug}`,
  title: page.h1,
  category: page.slug === "grief-crisis" ? "травма и кризис" : page.slug,
  source: `https://luneva-psy.ru${page.path}`,
  tags: [page.slug, "психологическая помощь", "подход Александры"],
  filename: `help-${page.slug}.md`,
  body: [
    section("О теме", page.intro),
    section("Как это может проявляться", page.manifestations),
    section("Как это влияет на повседневную жизнь", page.dailyLife),
    section("Что может поддерживать трудность", page.reasons),
    section("Как может помочь психотерапия", page.therapy),
    section("Когда важно обратиться за помощью", page.important),
    section("Как проходит работа", page.process),
    page.faq.length ? `## Вопросы и ответы\n\n${page.faq.map((item) => `### ${item.question}\n\n${item.answer}`).join("\n\n")}` : "",
  ].filter(Boolean).join("\n\n"),
}));

const selectedRpp = [
  "chto-takoe-rpp", "priznaki", "prichiny", "telo", "pereedanie", "diety",
  "anoreksiya", "bulimiya", "kompulsivnoe-pereedanie", "lechenie", "samopomosh",
  "pravilo-treh-marshi-herrin", "faq",
];

// The public RPP pages intentionally reuse explanatory sections for navigation and
// SEO.  A retrieval corpus must not repeat those paragraphs because repetition
// distorts ranking and makes several sources appear to corroborate the same text.
const seenRppParagraphs = new Set<string>();

function uniqueRppParagraphs(paragraphs: readonly string[]) {
  return paragraphs.filter((paragraph) => {
    const key = paragraph.replace(/\s+/g, " ").trim();
    if (!key || seenRppParagraphs.has(key)) return false;
    seenRppParagraphs.add(key);
    return true;
  });
}

for (const slug of selectedRpp) {
  const page = rppPages[slug];
  if (!page || page.status !== "published") throw new Error(`RPP source is not published: ${slug}`);
  const blocks = page.articleBlocks?.map((block) => {
    if (block.type === "heading") return `${"#".repeat(block.level)} ${block.text}`;
    if (block.type === "list") return block.items.map((item) => `- ${item}`).join("\n");
    if (block.type === "cta" || block.type === "image") return "";
    return block.text;
  }).filter(Boolean) ?? [];
  const faq = page.faq?.filter((item) => uniqueRppParagraphs([item.answer]).length > 0)
    .map((item) => `### ${item.question}\n\n${item.answer}`) ?? [];
  documents.push({
    id: `rpp-${slug}`,
    title: page.title,
    category: "РПП",
    source: `https://luneva-psy.ru/rpp/${slug}`,
    tags: ["РПП", slug, page.eyebrow],
    filename: `rpp-${slug}.md`,
    body: [
      ...uniqueRppParagraphs([page.description]),
      ...getRppSections(page.sectionHeadings).map((item) => section(item.heading, uniqueRppParagraphs(item.paragraphs))),
      ...uniqueRppParagraphs(page.customParagraphs ?? []),
      ...uniqueRppParagraphs(blocks),
      ...(faq.length ? ["## Вопросы и ответы", ...faq] : []),
    ].filter(Boolean).join("\n\n"),
  });
}

documents.push({
  id: "alexandra-approach",
  title: "Подход Александры Луневой к психологической работе",
  category: "подход Александры",
  source: "https://luneva-psy.ru/about",
  tags: ["подход Александры", "гештальт-терапия", "формат консультаций"],
  filename: "alexandra-approach.md",
  body: `## О специалисте

Александра Лунева — психолог и гештальт-терапевт. Она работает со взрослыми и подростками, помогая разбираться в сложных переживаниях, отношениях с собой и другими людьми.

## Как строится работа

Психотерапия понимается не как набор готовых советов и универсальных решений, а как совместный процесс, в котором важны доверие, безопасность и уважение к темпу человека. На первой встрече обсуждаются причина обращения, актуальное состояние, предыдущий опыт терапии и ожидаемая поддержка.

В работе важно создать пространство, где можно говорить честно, без необходимости казаться сильнее, без страха быть непонятым и без давления. Задача — исследовать не «что с человеком не так», а что с ним происходит, что для него важно и какой путь может подойти именно ему.

## Основные темы

Тревога и напряжение; сложности в отношениях; принятие себя и тела; РПП и переедание; низкая самооценка; одиночество; усталость и потеря опоры; подростковые переживания и отношения родителей с подростками.

## Профессиональные границы

Психологическая работа не гарантирует быстрый результат и не заменяет медицинскую помощь. При необходимости состояние оценивается совместно с врачами и другими профильными специалистами.`,
});

documents.push({
  id: "ai-limitations",
  title: "Ограничения AI-помощника Александры",
  category: "limitations",
  source: "internal://phase3/ai-limitations",
  tags: ["limitations", "AI", "границы"],
  filename: "ai-limitations.md",
  body: `## Роль AI-помощника

AI-помощник может находить утверждённые материалы Александры, объяснять общую информацию и помогать сформулировать вопрос для консультации.

## Что AI не должен делать

AI не ставит диагнозы, не назначает лечение, лекарства, диеты или медицинские обследования. Он не заменяет психолога, психиатра, врача или экстренную службу. Он не должен обещать результат терапии, интерпретировать симптомы как доказанный диагноз, убеждать человека прекратить назначенное лечение или выдавать предположения за слова Александры.

Если в corpus нет достаточной информации, AI должен прямо сказать об этом, не додумывать ответ и предложить обратиться к специалисту. Нельзя смешивать соседние темы: сведения о РПП не должны автоматически применяться к травме, а общая тревога не должна интерпретироваться как ПТСР.

AI не получает доступ к закрытым записям, реальным клиентским диалогам и персональным данным.`,
});

documents.push({
  id: "safety-crisis",
  title: "Безопасность и кризисные ситуации",
  category: "safety / crisis",
  source: "internal://phase3/safety-crisis",
  tags: ["safety", "crisis", "urgent"],
  filename: "safety-crisis.md",
  body: `## Когда нужна срочная помощь

Если человек сообщает о непосредственной угрозе жизни, намерении причинить вред себе или другому, тяжёлом физическом ухудшении, потере сознания, крови в рвоте, выраженном обезвоживании или другом остром состоянии, обычный информационный ответ должен быть остановлен.

Нужно рекомендовать немедленно обратиться в местную экстренную службу или ближайшее отделение неотложной помощи и, если возможно и безопасно, связаться с доверенным человеком, который может находиться рядом. AI не должен оценивать, насколько угроза «достаточно серьёзна», и не должен оставлять человека только с упражнениями самопомощи.

## Безопасная коммуникация

Ответ должен быть коротким, спокойным, без осуждения и без обещания конфиденциальности, которую система не может гарантировать. Нельзя романтизировать самоповреждение, давать инструкции, описывать способы или спорить с переживаниями человека.

## Медицинские риски при РПП

РПП может иметь серьёзные физические последствия независимо от внешности и веса. При резком ухудшении, обмороках, нарушении сердечного ритма, частой рвоте или выраженном ограничении питания необходима медицинская оценка.`,
});

const manifest = {
  schema_version: 1,
  corpus_id: "alexandra-pilot-2026-08-27",
  status: "pilot",
  ai_enabled: false,
  documents: documents.map((document) => ({
    id: document.id,
    title: document.title,
    category: document.category,
    source: document.source,
    tags: document.tags,
    filename: document.filename,
    version: "1.0.0",
    date: "2026-08-27",
    status: "approved-pilot",
  })),
};

const inventoryRows = [
  ...documents.map((doc) => `| ${doc.title} | ${doc.category} | ${doc.source} | Markdown | 2026-08-27 | unique | high | pilot | Проверен структурированный источник; CTA/SEO удалены |`),
  "| РПП у подростков | РПП | /rpp/podrostki | TS placeholder | current | duplicate/empty | low | exclude | Материал ещё не опубликован |",
  "| Помощь близкому человеку | РПП | /rpp/blizkim | TS placeholder | current | duplicate/empty | low | exclude | Материал ещё не опубликован |",
  "| Словарь терминов | РПП | /rpp/slovar | TS placeholder | current | duplicate/empty | low | exclude | Материал ещё не опубликован |",
  "| Legal/cookies/payment/account content | technical/legal | site routes | TS/Markdown | current | unique | low | exclude | Не относится к психологическому corpus |",
  "| Reviews | marketing | site/database | records | unknown | possible duplicates | low | exclude | Клиентский/маркетинговый контент не используется |",
  "| Scheduled Telegram posts ludmila-* | mixed | scheduled_channel_posts | database text | 2026 | unknown | disputed | exclude | Авторство/проект неоднозначны; требуется отдельное подтверждение |",
  "| Production articles and FAQ | website | PostgreSQL | records | 2026-08-27 | none | n/a | exclude | Таблицы существуют, опубликованных записей нет |",
];

const inventory = `# Knowledge Corpus Inventory

Проверено: 2026-08-27. Инвентаризация охватывает authoritative repositories, структурированный контент сайта и read-only списки production articles/FAQ/publication queue. Клиентские данные и закрытые диалоги не просматривались и не использовались.

| Title | Topic | Source | Type | Freshness | Duplicate | Quality | AI suitability | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
${inventoryRows.join("\n")}

## Решение по pilot

В pilot включён 21 документ высокого качества. Исключены placeholder-страницы, legal/cookies, цены, расписание, CTA, SEO boilerplate, отзывы и публикации с неподтверждённым авторством. Основным источником остаётся опубликованный структурированный контент luneva-psy.ru.
`;

async function main() {
  await rm(pilotRoot, { recursive: true, force: true });
  await mkdir(pilotRoot, { recursive: true });
  for (const document of documents) {
    const header = `# ${document.title}\n\nИсточник: ${document.source}\n\nКатегория: ${document.category}\n\nВерсия: 1.0.0\n\n`;
    await writeFile(path.join(pilotRoot, document.filename), `${header}${document.body.trim()}\n`, "utf8");
  }
  await writeFile(path.join(outputRoot, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  await writeFile(path.join(outputRoot, "KNOWLEDGE_CORPUS_INVENTORY.md"), inventory, "utf8");
  console.log(`PHASE3_CORPUS=PASS documents=${documents.length} output=${outputRoot}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Phase 3 corpus generation failed");
  process.exitCode = 1;
});
