# Исправление мобильного заголовка блока «Процесс терапии»

Дата: 29.07.2026. Commit, push и публикация не выполнялись.

## Компонент и причина

Компонент: `components/Process.tsx`.

Заголовок — `h2` с текстом «Как проходит консультация». До исправления он
использовал `font-serif text-5xl leading-tight`, то есть `font-size: 48px` на
мобильном. Внутри карточки на 320 px для текста оставалось примерно 224 px,
поэтому слово «консультация» могло выйти за правую границу.

Проверка не нашла в H2 ручных `<br>`, отдельных `span`, `nowrap`,
`width:max-content`, `fit-content`, fixed width, transform, отрицательных
margin или absolute positioning. Родитель `overflow-hidden` нужен только для
границы и изображения карточки; проблема была размером текста и внутренними
отступами, а не этим overflow.

## Изменение

H2 теперь имеет:

```text
box-border w-full max-w-full min-w-0
text-[clamp(2rem,9.5vw,3rem)]
leading-[1.08] tracking-tight whitespace-normal
```

Контейнер блока получил `w-full max-w-full min-w-0 box-border`, а mobile
padding внутренней части уменьшен до 16 px. Карточки этапов переходят в одну
колонку на mobile и их текстовые части имеют `min-w-0`.

## Production-измерения после `document.fonts.ready`

| Viewport | H2 left–right | H2 width | scrollWidth/clientWidth | font-size | letter-spacing |
| ---: | --- | ---: | --- | --- | --- |
| 320 | 33–287 px | 254 px | 254 / 254 | 32 px | -0.8 px |
| 360 | 33–327 px | 294 px | 294 / 294 | 34.2 px | -0.855 px |
| 375 | 33–342 px | 309 px | 309 / 309 | 35.625 px | -0.891 px |
| 390 | 33–357 px | 324 px | 324 / 324 | 37.05 px | -0.926 px |
| 412 | 33–379 px | 346 px | 346 / 346 | 39.14 px | -0.979 px |

На всех проверенных ширинах H2 имеет `white-space: normal`, `overflow: visible`
и находится строго внутри родительского контейнера. Вводный абзац и карточки
этапов также визуально остаются в пределах карточки.

## Скриншоты

- `test-results/home-process-mobile/home-process-320.png`
- `test-results/home-process-mobile/home-process-360.png`
- `test-results/home-process-mobile/home-process-375.png`
- `test-results/home-process-mobile/home-process-390.png`
- `test-results/home-process-mobile/home-process-412.png`

## Проверки

Финально выполнены `npm.cmd run lint`, `npm.cmd run typecheck` и
`npm.cmd run build`.
