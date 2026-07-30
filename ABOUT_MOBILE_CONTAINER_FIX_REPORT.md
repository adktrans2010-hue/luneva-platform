# Повторная проверка контейнера `/about`

Дата: 29.07.2026. Проверка выполнена на локальной production-сборке после
`document.fonts.ready`.

## Контейнерная цепочка

Проверены `html → body → main → main > section → main > section > div`.
На 320 px их фактические правые границы: `320, 320, 320, 320, 296 px`.
Section использует `box-sizing:border-box` и padding `24 px` с каждой стороны;
внутренний container имеет ширину `272 px`, `min-width:0` и `max-width:1280px`.

Конструкции `width:100vw` внутри `/about`, fixed/min widths, max-content,
fit-content, translateX, отрицательные margin и full-width content-box с
добавочным padding не найдены. Глобальных `overflow-x:hidden` на `html` и
`body` нет. Viewport layout стандартный: `width=device-width`,
`initial-scale=1`.

Внутренний `scrollWidth` hero-container может быть больше clientWidth на 24 px
из-за декоративного glow с `-inset-6`, но его rect лежит в границах viewport и
он не расширяет документ. Текстовые H1/H2 исправлены ранее: ни один видимый
текстовый Range не выходит за правую/левую границу и не клиппится родителем.

## Результаты production-диагностики

| Viewport | document scrollWidth | body scrollWidth | Элементы с rect за viewport |
| ---: | ---: | ---: | --- |
| 320 | 320 | 320 | нет |
| 360 | 360 | 360 | нет |
| 375 | 375 | 375 | нет |
| 390 | 390 | 390 | нет |
| 412 | 412 | 412 | нет |
| 768 | 768 | 768 | нет |
| 820 | 820 | 820 | нет |

## Скриншоты

- `test-results/about-container-fix/about-320.png`
- `test-results/about-container-fix/about-360.png`
- `test-results/about-container-fix/about-375.png`
- `test-results/about-container-fix/about-390.png`
- `test-results/about-container-fix/about-412.png`
- `test-results/about-container-fix/about-768.png`
- `test-results/about-container-fix/about-820.png`

## Публичная версия

Публичный домен ранее был проверен и продолжает отдавать старую,
неопубликованную сборку. Локальные изменения не опубликованы по явному
ограничению задачи; поэтому до будущего deploy пользователи production-сайта
могут видеть прежнюю вёрстку.

## Проверки

`npm.cmd run lint`, `npm.cmd run typecheck` и `npm.cmd run build` выполнены
после изменений; commit, push и публикация не выполнялись.
