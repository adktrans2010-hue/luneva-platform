import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import PageStructuredData from "@/components/seo/page-structured-data";
import { getSeoPage, seoToMetadata } from "@/src/lib/seo";

const requestTopics = [
  "тревога и постоянное напряжение",
  "сложности в отношениях",
  "принятие себя и своего тела",
  "расстройства пищевого поведения (РПП)",
  "переедание и сложные отношения с едой",
  "низкая самооценка",
  "чувство одиночества",
  "усталость и потеря опоры",
  "подростковые переживания",
  "отношения родителей и подростков",
];

const credentials = [
  "бакалавр психологии",
  "дипломированный психолог-консультант",
  "сертифицированный гештальт-терапевт",
  "специалист в области работы с расстройствами пищевого поведения",
];

const trustStatements = [
  "Без необходимости казаться сильнее.",
  "Без страха быть непонятым.",
  "Без давления.",
];

export async function generateMetadata() {
  return seoToMetadata(await getSeoPage("/about"), "/about");
}

function TextBlock({
  title,
  children,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <section
      className={
        wide
          ? "lg:col-span-2 rounded-[2rem] border border-[#ead7d1] bg-[#f7e9e5] p-8 md:p-10"
          : "rounded-[2rem] border border-[#ead7d1] bg-[#f7e9e5] p-8 md:p-10"
      }
    >
      <h2 className="font-serif text-[clamp(1.875rem,8vw,2.25rem)] leading-tight break-words hyphens-auto text-[#332725]">
        {title}
      </h2>
      <div className="mt-6 space-y-5 text-lg leading-8 text-[#5f5552]">
        {children}
      </div>
    </section>
  );
}

function SoftList({ items }: { items: string[] }) {
  return (
    <ul className="grid gap-x-8 gap-y-2 sm:grid-cols-2">
      {items.map((item) => (
        <li
          key={item}
          className="flex gap-3 border-b border-[#dec4bd] py-3 last:border-b sm:last:border-b"
        >
          <span className="mt-3 h-2 w-2 shrink-0 rounded-full bg-[#c98778]" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function AboutPage() {
  return (
    <section className="bg-[#fff8f6] px-6 py-24">
      <PageStructuredData path="/about" title="О психологе Александре Луневой" breadcrumbs={[{ name: "Главная", path: "/" }, { name: "Обо мне", path: "/about" }]} />
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:items-center">
          <div className="relative min-w-0">
            <div className="absolute -inset-6 rounded-[4rem] bg-[#e7b8ad]/40 blur-3xl" />

            <Image
              src="/sasha-about-page.jpg"
              alt="Лунева Александра Александровна"
              width={1800}
              height={1200}
              className="relative h-[620px] w-full rounded-[4rem] object-cover object-[58%_42%] shadow-2xl"
            />
          </div>

          <div className="min-w-0">
            <p className="mb-4 text-sm uppercase tracking-[0.25em] text-[#c98778]">
              Обо мне
            </p>

            <h1 className="max-w-full font-serif text-[clamp(2.25rem,10vw,3.75rem)] leading-[1.05] tracking-tight break-words hyphens-auto text-[#332725]">
              Лунева Александра Александровна
            </h1>

            <div className="mt-8 space-y-5 text-lg leading-8 text-[#5f5552]">
              <p className="text-xl text-[#332725]">
                Здравствуйте, меня зовут Александра Лунева
              </p>
              <p>
                Я психолог, гештальт-терапевт. Работаю со взрослыми и
                подростками, помогая разобраться в сложных переживаниях,
                отношениях с собой и другими людьми.
              </p>
              <p>
                Я верю, что каждому человеку важно иметь место, где его услышат
                спокойно, внимательно и без оценки.
              </p>
              <p>
                Иногда бывает сложно объяснить даже самому себе, что происходит
                внутри. Можно долго справляться самостоятельно, откладывать
                обращение за помощью и привыкать терпеть.
              </p>
              <p>Но вам не обязательно проходить через это в одиночку.</p>
            </div>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/certificates"
                className="rounded-2xl bg-[#332725] px-8 py-4 text-white shadow-lg"
              >
                Дипломы и сертификаты
              </Link>

              <Link
                href="/contacts#booking"
                className="rounded-2xl border border-[#c98778] px-8 py-4 text-[#332725]"
              >
                Записаться
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-20 grid grid-cols-1 gap-8 lg:grid-cols-2">
          <TextBlock title="Как я работаю">
            <p>
              Для меня психотерапия - это не набор готовых советов и
              универсальных решений.
            </p>
            <p>
              Это совместный процесс, где важны доверие, безопасность и
              уважение к вашему темпу.
            </p>
            <p>
              На первой встрече мне важно познакомиться с вами: понять, что
              привело вас именно сейчас, был ли раньше опыт терапии, как вы
              себя чувствуете и какой поддержки ждете.
            </p>
            <p>
              Если вы впервые обращаетесь к психологу и волнуетесь - это
              нормально. Мы начнем спокойно, с того места, где вы сейчас.
            </p>
          </TextBlock>

          <TextBlock title="Мой путь в психологию">
            <p>Психология стала для меня не просто профессией.</p>
            <p>
              Это дело, в котором соединились мой интерес к людям, желание
              понимать глубже и возможность быть рядом в непростые моменты.
            </p>
            <p>
              С 2019 года я веду психологическую практику. За это время
              провела более 2500 часов индивидуальных консультаций.
            </p>
            <p>
              Я получила психологическое образование, прошла профессиональную
              подготовку в гештальт-подходе и продолжаю регулярно повышать
              квалификацию.
            </p>
            <p>
              Для меня важно продолжать развиваться как специалисту: я прохожу
              супервизии, участвую в профессиональных группах и продолжаю
              обучение.
            </p>
          </TextBlock>

          <TextBlock title="С чем ко мне обращаются" wide>
            <p>Я провожу психологические консультации в Москве и онлайн.</p>
            <p>Работаю с темами:</p>
            <SoftList items={requestTopics} />
          </TextBlock>

          <TextBlock title="Образование и профессиональный опыт">
            <p>Я:</p>
            <SoftList items={credentials} />
            <p>
              В 2022 году я разработала курс для психологов по работе с
              расстройствами пищевого поведения и стала преподавателем
              Института прикладной психологии в социальной сфере.
            </p>
            <p>
              Также являюсь соавтором образовательных программ и продолжаю
              развиваться в профессиональном сообществе.
            </p>
            <p>
              Все дипломы и сертификаты можно посмотреть в разделе образования.
            </p>
          </TextBlock>

          <TextBlock title="Немного обо мне вне профессии">
            <p>
              За пределами кабинета психолога я остаюсь обычным живым
              человеком.
            </p>
            <p>
              Я жена и мама двух подростков. И, наверное, не случайно мне
              особенно близка работа с подростковым возрастом - временем поиска
              себя, сильных чувств и важных изменений.
            </p>
            <p>
              Я люблю животных, путешествия, музыку, люблю петь и танцевать.
            </p>
            <p>
              Мне близки искренность, открытость и доброта - эти качества я
              ценю в людях и стараюсь сохранять в своей работе.
            </p>
          </TextBlock>

          <TextBlock title="Почему мне можно доверять" wide>
            <p>
              В терапии для меня самое важное - создать пространство, где можно
              говорить честно.
            </p>
            <div className="grid gap-3 md:grid-cols-3">
              {trustStatements.map((statement) => (
                <p
                  key={statement}
                  className="border-l-2 border-[#c98778] py-2 pl-4 text-[#332725]"
                >
                  {statement}
                </p>
              ))}
            </div>
            <p>
              Мы будем искать не &quot;что с вами не так&quot;, а то, что происходит, что
              вам важно и какой путь поможет именно вам.
            </p>
            <p className="text-[#332725]">
              С надеждой,
              <br />
              Александра Лунева
            </p>
          </TextBlock>
        </div>
      </div>
    </section>
  );
}
