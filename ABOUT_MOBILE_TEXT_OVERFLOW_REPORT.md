# Критическая повторная проверка `/about`

Дата: 29.07.2026. Проверка проведена на локальной **production-сборке**
(`npm.cmd run build` + `npm.cmd run start`), не на dev-сервере. Commit, push и
публикация не выполнялись.

## Точная причина и почему предыдущая проверка была недостаточной

Предыдущая проверка опиралась преимущественно на общую ширину документа и не
измеряла Range конкретных текстовых узлов после загрузки шрифтов. Поэтому она
не зафиксировала локальное переполнение в самих заголовках.

Проблемный текст: **«Лунева Александра Александровна»**.

| Параметр | До исправления, 320 px | После исправления, 320 px |
| --- | ---: | ---: |
| Селектор | `h1.font-serif.text-6xl.leading-tight.text-[#332725]` | `h1.font-serif.text-[clamp(2.25rem,10vw,3.75rem)]...` |
| Родитель | `div.min-w-0` внутри hero-grid | тот же |
| H1 left / right | `24 / 453.3 px` | `24 / 296 px` |
| H1 width | `429.3 px` | `272 px` |
| H1 scrollWidth / clientWidth | `429 / 272 px` | `272 / 272 px` |

Второй проблемный текст: **«Образование и профессиональный опыт»** в H2.

| Параметр | До исправления, 320 px | После исправления, 320 px |
| --- | ---: | ---: |
| Селектор | `h2.font-serif.text-4xl.text-[#332725]` | `h2.font-serif.text-[clamp(1.875rem,8vw,2.25rem)]...` |
| Родитель | `section.rounded-[2rem]...p-8` | тот же |
| Range right / доступная ширина | `387.4 px / 206 px` | `263 px / 206 px` |
| scrollWidth / clientWidth | `330 / 206 px` | `206 / 206 px` |

Причина: `text-6xl` (60 px) и `text-4xl` (36 px) в сочетании с длинными
кириллическими словами не позволяли разбить слово, если оно не помещалось.
Это не было вызвано шрифтовой подменой: после `await document.fonts.ready`
реальный `font-family` H1 — Georgia/Times New Roman (класс `font-serif`), и
его размеры остались стабильны.

## Внесённое точечное исправление

В `app/about/page.tsx`:

- H1 получает адаптивный размер `clamp(2.25rem, 10vw, 3.75rem)`, нормальный
  `line-height: 1.05`, `tracking-tight`, `max-width:100%`, `break-words` и
  `hyphens-auto`;
- H2 получает `clamp(1.875rem, 8vw, 2.25rem)`, `leading-tight`, `break-words`
  и `hyphens-auto`.

Перенос внутри слова разрешён только при необходимости — обычные переносы
русского текста не меняются. Глобальные `overflow-x:hidden` удалены из `html`
и `body`; результат не маскируется этим правилом.

Footer содержит намеренно обрезанный декоративный абсолютный круг
`div.absolute.-bottom-40.-left-40...` внутри `footer.overflow-hidden`. Он имеет
отрицательный left, но не содержит текста и не создаёт правого overflow.
Все видимые текстовые Range footer, кнопок, карточек, логотипа и hero находятся
в границах соответствующих clipping-контейнеров.

## Production-проверка после `document.fonts.ready`

Проверены ширина и высота viewport: 320×568, 360×667, 375×844, 390×844,
412×1024, 768×1024, 820×1024.

| Ширина | document scrollWidth | body scrollWidth | Вышедшие за viewport видимые текстовые элементы |
| ---: | ---: | ---: | --- |
| 320 | 320 | 320 | нет |
| 360 | 360 | 360 | нет |
| 375 | 375 | 375 | нет |
| 390 | 390 | 390 | нет |
| 412 | 412 | 412 | нет |
| 768 | 768 | 768 | нет |
| 820 | 820 | 820 | нет |

Отдельно проверены H1, подзаголовок hero, длинные фразы рядом с фотографией,
подпись «Психолог» в header-logo, H2 карточек, списки образования и
специализаций, кнопки, absolute-декор, `nowrap`, `max-content`, `100vw`,
transforms, отрицательные margin, fixed height, псевдоэлементы и ручные
переносы. Проблемных видимых текстовых элементов не обнаружено.

## Регрессионный тест

Добавлен `tests/e2e/about-mobile-overflow.spec.ts`.

Тест на 320, 360, 390, 412, 768 и 820 px:

- ждёт `document.fonts.ready`;
- проверяет root horizontal overflow;
- проверяет каждый фактически видимый текстовый элемент;
- проверяет clipping-родителей по реальным координатам текста;
- выводит селектор и текст проблемного элемента при падении.

Запуск на локальной production-сборке: **1 passed**.

## Скриншоты

До исправления (контролируемая репродукция прежних классов H1/H2):

- `test-results/about-mobile-overflow/before-320.png`
- `test-results/about-mobile-overflow/before-390.png`
- `test-results/about-mobile-overflow/before-320-heading.png`
- `test-results/about-mobile-overflow/before-390-heading.png`

После исправления:

- `test-results/about-mobile-overflow/after-320.png`
- `test-results/about-mobile-overflow/after-360.png`
- `test-results/about-mobile-overflow/after-390.png`
- `test-results/about-mobile-overflow/after-412.png`
- `test-results/about-mobile-overflow/after-768.png`
- `test-results/about-mobile-overflow/after-820.png`
- `test-results/about-mobile-overflow/after-320-heading.png`
- `test-results/about-mobile-overflow/after-390-heading.png`

## Публичный production и кеш

Публичный `https://luneva-psy.ru/about` отдельно прочитан 29.07.2026. Он всё
ещё отдаёт старый H1-класс:

`font-serif text-6xl leading-tight text-[#332725]`

и старый CSS chunk `/_next/static/chunks/3ijh39b-t1zih.css`. В ответе есть
`x-nextjs-cache: HIT`, но `Cache-Control` и `CDN-Cache-Control` задают
`no-store`. Следовательно, проблема на публичном домене — **неопубликованная
старая сборка**, а не локальный код и не браузерный кеш. По условиям задачи
публикация не выполнялась; после будущего deploy нужно перезапустить приложение
и убедиться, что H1 в публичном HTML содержит новый `clamp(...)` класс.

## Финальные проверки

- `npm.cmd run lint` — успешно.
- `npm.cmd run typecheck` — успешно.
- `npm.cmd run build` — успешно.
- Новый Playwright-тест — успешно.
