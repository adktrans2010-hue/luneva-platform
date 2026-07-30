# Исправление мобильного переполнения `/about`

Дата: 29.07.2026. Commit, push и публикация не выполнялись.

## Метод диагностики

Страница проверена Playwright на 320, 360, 375, 390, 412 и 768 px. Для всех
элементов и текстовых Range проверялись:

- `getBoundingClientRect().right > window.innerWidth`;
- `getBoundingClientRect().left < 0`;
- `scrollWidth > clientWidth`;
- `white-space`, `letter-spacing`, `min-width`, размеры, transform и position.

Проверка выполнена также после снятия глобальных `overflow-x-hidden` с `html`
и `body`, поэтому итог не зависит от скрытия горизонтального переполнения.

## Найденная первопричина

Текстовые заголовки не помещались в свои колонки на узких экранах:

| Элемент до исправления (320 px) | CSS-класс | Фактические размеры до |
| --- | --- | --- |
| H1 «Лунева Александра Александровна» | `font-serif text-6xl leading-tight text-[#332725]` | text Range: `left 24`, `right 453.3`, ширина `429.3`; сам H1: `scrollWidth 429`, `clientWidth 272` |
| H2 «Образование и профессиональный опыт» | `font-serif text-4xl text-[#332725]` | text Range: `left 57`, `right 387.4`, ширина `330.4`; сам H2: `scrollWidth 330`, `clientWidth 206` |

Главной проблемой был длинный фрагмент имени в H1 и длинное слово в H2. Они
создавали реальное внутреннее переполнение. Ранее `overflow-x:hidden` лишь
скрывал его, из-за чего пользователю казалось, что последние буквы обрезаны.

Дополнительно проверены логотип и подпись «Психолог», декоративные блоки,
letter-spacing, `white-space`, fixed/min/max width, `100vw`, transforms,
absolute positioning, отрицательные отступы, flex/grid и изображения.
Единственный элемент с отрицательным `left` — декоративный круг footer
`absolute -bottom-40 -left-40 ...`; он находится внутри самого footer с
контролируемым клиппингом и не создаёт правого overflow.

## Изменения

В `app/about/page.tsx`:

- H1: `text-[clamp(2.25rem,10vw,3.75rem)]`, `leading-[1.05]`, `tracking-tight`,
  `break-words`, `hyphens-auto`, `max-w-full`;
- H2: `text-[clamp(1.875rem,8vw,2.25rem)]`, `leading-tight`, `break-words`,
  `hyphens-auto`.

Это сохраняет нормальные переносы слов, но разрешает перенос внутри слова
только когда оно иначе не помещается.

В `app/layout.tsx` удалены `overflow-x-hidden` с `html` и `body` — сайт больше
не маскирует проблему глобальным стилем.

В `components/Logo.tsx` footer-logo ограничен шириной родительского контейнера;
header-logo уже использует пропорциональный `object-contain` контейнер, поэтому
подпись «Психолог» не обрезается.

## Итоговые измерения

| Viewport | `documentElement.scrollWidth` | `body.scrollWidth` | H1 right / width | Результат |
| --- | ---: | ---: | --- | --- |
| 320 | 320 | 320 | `296 / 272` | пройдено |
| 360 | 360 | 360 | `336 / 312` | пройдено |
| 375 | 375 | 375 | `351 / 327` | пройдено |
| 390 | 390 | 390 | `366 / 342` | пройдено |
| 412 | 412 | 412 | `388 / 364` | пройдено |
| 768 | 768 | 768 | `744 / 720` | пройдено |

На всех ширинах: нет элементов с `right > viewport`, нет текстовых Range за
границей, и `document.documentElement.scrollWidth <= window.innerWidth`.

## Скриншоты

- `audit/mobile-overflow/about-320.png`
- `audit/mobile-overflow/about-360.png`
- `audit/mobile-overflow/about-390.png`
- `audit/mobile-overflow/about-412.png`
- `audit/mobile-overflow/about-768.png`

## Проверки

После изменений выполнены:

- `npm.cmd run lint`;
- `npm.cmd run typecheck`;
- `npm.cmd run build`.
