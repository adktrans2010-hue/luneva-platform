import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Политика использования файлов Cookie | Luneva Psy",
  description:
    "Политика использования файлов Cookie на сайте психолога Александры Луневой.",
};

function PolicySection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="border-t border-[#ead7d1] pt-8">
      <h2 className="font-serif text-3xl leading-tight text-[#332725]">{title}</h2>
      <div className="mt-5 space-y-4 text-base leading-7 text-[#5f5552] sm:text-lg sm:leading-8">
        {children}
      </div>
    </section>
  );
}

function PolicyList({ children }: { children: ReactNode }) {
  return (
    <ul className="grid gap-2 pl-1">
      {Array.isArray(children) ? children : [children]}
    </ul>
  );
}

function Item({ children }: { children: ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="mt-[0.7rem] h-1.5 w-1.5 shrink-0 rounded-full bg-[#c98778]" />
      <span>{children}</span>
    </li>
  );
}

export default function CookiesPage() {
  return (
    <section className="bg-[#fff8f6] px-6 py-20 sm:py-24">
      <article className="mx-auto max-w-4xl rounded-[2.5rem] border border-[#ead7d1] bg-white/45 p-7 shadow-[0_30px_100px_rgba(51,39,37,0.06)] sm:p-12 lg:p-16">
        <p className="text-sm uppercase tracking-[0.22em] text-[#c98778]">
          Luneva Psy
        </p>
        <h1 className="mt-4 font-serif text-4xl leading-tight text-[#332725] sm:text-6xl">
          Политика использования файлов Cookie
        </h1>
        <p className="mt-5 text-sm text-[#8a7a76]">
          Дата вступления в силу: 13 июля 2026 г.
        </p>

        <div className="mt-10 space-y-5 text-base leading-7 text-[#5f5552] sm:text-lg sm:leading-8">
          <p>
            Настоящая Политика использования файлов Cookie (далее — Политика)
            объясняет, какие технологии используются на сайте{" "}
            <a className="text-[#9f665a] underline underline-offset-4" href="https://luneva-psy.ru/">
              https://luneva-psy.ru/
            </a>{" "}
            (далее — Сайт), для чего они необходимы и каким образом пользователь
            может управлять их использованием.
          </p>
          <p>
            Используя Сайт, пользователь соглашается с применением файлов Cookie
            в соответствии с настоящей Политикой, если иное не установлено
            настройками его браузера.
          </p>
        </div>

        <div className="mt-12 space-y-10">
          <PolicySection title="1. Что такое Cookie">
            <p>
              Cookie — это небольшие текстовые файлы, которые сохраняются браузером
              на устройстве пользователя при посещении сайта.
            </p>
            <p>Они позволяют:</p>
            <PolicyList>
              <Item>корректно отображать страницы;</Item>
              <Item>запоминать пользовательские настройки;</Item>
              <Item>обеспечивать безопасность работы сайта;</Item>
              <Item>анализировать посещаемость;</Item>
              <Item>улучшать удобство использования сайта.</Item>
            </PolicyList>
            <p>
              Cookie не являются компьютерными программами, не содержат вирусов и
              не могут получить доступ к информации, хранящейся на устройстве
              пользователя.
            </p>
          </PolicySection>

          <PolicySection title="2. Какие Cookie используются">
            <p>На сайте могут использоваться следующие категории файлов Cookie.</p>

            <h3 className="font-serif text-2xl text-[#332725]">Обязательные Cookie</h3>
            <p>Необходимы для корректной работы сайта. Без них невозможно:</p>
            <PolicyList>
              <Item>авторизация в личном кабинете;</Item>
              <Item>сохранение пользовательской сессии;</Item>
              <Item>обеспечение безопасности форм;</Item>
              <Item>защита от спама;</Item>
              <Item>корректная работа отдельных функций сайта.</Item>
            </PolicyList>
            <p>
              Отключение обязательных Cookie может привести к некорректной работе сайта.
            </p>

            <h3 className="font-serif text-2xl text-[#332725]">Функциональные Cookie</h3>
            <p>Используются для сохранения пользовательских настроек, например:</p>
            <PolicyList>
              <Item>языка интерфейса;</Item>
              <Item>состояния отдельных элементов сайта;</Item>
              <Item>предпочтений пользователя.</Item>
            </PolicyList>

            <h3 className="font-serif text-2xl text-[#332725]">Аналитические Cookie</h3>
            <p>
              Используются для анализа посещаемости сайта и улучшения качества его
              работы. С их помощью может собираться информация:
            </p>
            <PolicyList>
              <Item>количество посетителей;</Item>
              <Item>наиболее популярные страницы;</Item>
              <Item>источники переходов;</Item>
              <Item>время нахождения на сайте;</Item>
              <Item>технические характеристики устройства и браузера.</Item>
            </PolicyList>
            <p>
              Данные используются только в обобщенном виде и не позволяют напрямую
              идентифицировать пользователя.
            </p>

            <h3 className="font-serif text-2xl text-[#332725]">Маркетинговые Cookie</h3>
            <p>
              В случае подключения рекламных сервисов могут использоваться Cookie
              для оценки эффективности рекламных кампаний и отображения более
              релевантной информации.
            </p>
            <p>На момент публикации настоящей Политики такие Cookie могут не использоваться.</p>
          </PolicySection>

          <PolicySection title="3. Какие данные могут сохраняться">
            <p>Cookie могут содержать:</p>
            <PolicyList>
              <Item>уникальный идентификатор пользователя;</Item>
              <Item>сведения о браузере;</Item>
              <Item>сведения об устройстве;</Item>
              <Item>сведения о посещенных страницах;</Item>
              <Item>дату и время посещения;</Item>
              <Item>настройки сайта;</Item>
              <Item>информацию о пользовательской сессии.</Item>
            </PolicyList>
            <p>
              Cookie не содержат паспортных данных, банковских реквизитов или иных
              документов пользователя.
            </p>
          </PolicySection>

          <PolicySection title="4. Используемые сервисы">
            <p>
              На сайте могут использоваться сторонние сервисы, которые также могут
              устанавливать собственные Cookie. Например:
            </p>
            <PolicyList>
              <Item>Яндекс Метрика;</Item>
              <Item>Google Analytics (при использовании);</Item>
              <Item>сервисы онлайн-оплаты;</Item>
              <Item>сервисы видеоконференций;</Item>
              <Item>сервисы защиты сайта;</Item>
              <Item>сервисы отображения карт;</Item>
              <Item>сервисы онлайн-чата.</Item>
            </PolicyList>
            <p>
              Использование Cookie такими сервисами регулируется их собственными
              политиками конфиденциальности.
            </p>
          </PolicySection>

          <PolicySection title="5. Управление Cookie">
            <p>Пользователь может самостоятельно:</p>
            <PolicyList>
              <Item>удалить сохраненные Cookie;</Item>
              <Item>запретить их сохранение;</Item>
              <Item>ограничить использование отдельных Cookie.</Item>
            </PolicyList>
            <p>Это можно сделать в настройках используемого браузера.</p>
            <p>
              Следует учитывать, что после отключения Cookie некоторые функции сайта
              могут работать некорректно.
            </p>
          </PolicySection>

          <PolicySection title="6. Срок хранения Cookie">
            <p>Различные Cookie могут храниться:</p>
            <PolicyList>
              <Item>только в течение текущей сессии браузера;</Item>
              <Item>до удаления пользователем;</Item>
              <Item>в течение срока, установленного конкретным сервисом.</Item>
            </PolicyList>
            <p>После истечения установленного срока Cookie автоматически удаляются.</p>
          </PolicySection>

          <PolicySection title="7. Безопасность">
            <p>
              Использование Cookie направлено исключительно на обеспечение корректной
              работы сайта, повышение удобства пользователей и анализ качества
              предоставляемых сервисов.
            </p>
            <p>
              Полученная информация защищается в соответствии с требованиями
              законодательства Российской Федерации.
            </p>
          </PolicySection>

          <PolicySection title="8. Изменение Политики">
            <p>Оператор вправе изменять настоящую Политику.</p>
            <p>Новая редакция вступает в силу с момента ее размещения на сайте.</p>
            <p>
              Актуальная версия всегда доступна по адресу:{" "}
              <a className="text-[#9f665a] underline underline-offset-4" href="https://luneva-psy.ru/cookies">
                https://luneva-psy.ru/cookies
              </a>
            </p>
          </PolicySection>

          <PolicySection title="9. Контактная информация">
            <p>По вопросам использования Cookie пользователь может обратиться:</p>
            <div className="rounded-2xl bg-[#f7e9e5] p-6">
              <p className="font-serif text-2xl text-[#332725]">Luneva Psy</p>
              <p className="mt-3">
                E-mail:{" "}
                <a className="text-[#9f665a] underline underline-offset-4" href="mailto:hello@luneva-psy.ru">
                  hello@luneva-psy.ru
                </a>
              </p>
              <p>
                Сайт:{" "}
                <a className="text-[#9f665a] underline underline-offset-4" href="https://luneva-psy.ru/">
                  https://luneva-psy.ru/
                </a>
              </p>
            </div>
          </PolicySection>
        </div>
      </article>
    </section>
  );
}
