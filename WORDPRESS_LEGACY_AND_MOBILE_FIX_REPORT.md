# Отчёт: WordPress legacy URL и мобильная версия `/about`

Дата проверки: 29.07.2026. Commit, push и публикация не выполнялись.

## Аудит до изменений

Публичный production-сайт до работ возвращал `404` для `/sample-page-2/`,
`/author/andlun777/`, обеих проверенных категорий и старого URL статьи.
`/luneva-psy-biography/?elementor-preview=202&ver=1772700348` отвечал `301`,
но переносил оба Elementor-параметра на `/about`; прямой parameterized URL
`/about?...` отвечал `200`.

В проекте правила были разделены между `next.config.ts` и `proxy.ts`.
`app/sitemap.ts` формирует карту только из канонических SEO-страниц,
опубликованных статей и опубликованных разделов; WordPress URL в ней не было.
`app/robots.ts` не блокирует legacy URL, поэтому поисковый робот сможет увидеть
новые `301` и `410`.

## Реализация

Единая типизированная обработка legacy URL находится в
`src/lib/legacy-routes.ts`, а применяется в `proxy.ts`. Дублирующие redirects
удалены из `next.config.ts`.

| URL или шаблон | До | Решение | После | Конечный URL / причина |
| --- | --- | --- | --- | --- |
| `/sample-page/`, `/sample-page-2/`, `/hello-world/` | 404 для проверенного URL | gone | 410 | Тестовые WordPress-страницы |
| `/author/*` | 404 для проверенного URL | gone | 410 | Архив автора без аналога |
| `/category/*`, `/tag/*` | 404 для проверенных URL | gone | 410 | Ненужные WordPress-архивы |
| `/YYYY/`, `/YYYY/MM/`, `/YYYY/MM/DD/` | 404 для проверенного старого URL | gone, кроме точной статьи ниже | 410 | Архивы дат без аналога |
| `/feed/`, `/comments/feed/`, `/wp-json/`, `/xmlrpc.php`, `/wp-admin/*` | не менялись до проверки | gone | 410 | Устаревшие WordPress service URL |
| `/?feed`, `?p`, `?page_id`, `?author`, `?cat`, `?m` | `page_id=812` уже вёл на блог | `page_id=812` остаётся 301; прочие legacy query — gone | 301 / 410 | Нет массовых редиректов на главную |
| `/2023/07/17/как-фэтшейминг-влияет-на-пищевое-пове/` | 404 | permanent redirect | 301 | `/blog/rasstroystva-pischevogo-povedeniya-i-vliyanie-sredy` |
| `/luneva-psy-biography/` | 301 | permanent redirect | 301 | `/about`, query Elementor удаляются |
| `/about?elementor-preview=…&ver=…` | 200 | permanent redirect | 301 | `/about` |

Очищаются только подтверждённые WordPress/Elementor-параметры:
`elementor-preview`, `ver`, `preview`, `preview_id`, `preview_nonce`.
Маркетинговые параметры (`utm_*`, `yclid`, `gclid`) не удаляются.

## Статья о фэтшейминге

Современный точный тематический аналог найден и опубликован:
`/blog/rasstroystva-pischevogo-povedeniya-i-vliyanie-sredy` —
«Расстройства пищевого поведения и влияние среды». В excerpt, Description и
содержании статьи прямо рассматривается фэтшейминг и его влияние на РПП.

Проверено локально: конечная страница возвращает `200`, имеет один H1, Title
`Расстройства пищевого поведения и влияние среды | Luneva Psy`, уникальный
Description и canonical на собственный URL. Страница формируется среди
опубликованных статей и попадает в sitemap; robots её не блокирует.

Поиск по исходникам не выявил внутренних ссылок на перечисленные WordPress URL.
Проверка sitemap также не нашла `sample-page`, author/category URL или legacy
slug фэтшейминга.

## Мобильная `/about`

Причина горизонтального переполнения — первый hero-grid: на мобильных у него
создавалась неявная колонка шириной 429 px из-за intrinsic minimum размера
изображения. Глобальный `overflow-x: hidden` скрывал симптом, но не исправлял
сам источник.

В `app/about/page.tsx` добавлены явная мобильная сетка `grid-cols-1` и
`minmax(0, …)` для desktop-колонок, а также `min-w-0` для её children. Та же
явная мобильная колонка добавлена grid-раскладке карточек. После этого на
ширинах 320, 360, 375, 390, 412, 768, 820 и 1440 px выполнено
`document.documentElement.scrollWidth === window.innerWidth`.

В `components/Logo.tsx` header-logo теперь помещается с `object-contain` в
пропорциональный контейнер. На 320 px изображение находится в диапазоне
12–76 px при границе шапки 89 px; на 768 px — 16–96 px при границе 113 px.
Подпись «Психолог» больше не закрывается следующим блоком, высота шапки
увеличена только с 80 до 89 px (и до 97 px начиная с 375 px).

Скриншоты сохранены в `audit/wordpress-mobile/`:

- `about-320.png`
- `about-390.png`
- `about-768.png`
- `about-820.png`
- `about-desktop.png`

## Проверки

Локальная production-сборка:

- `/sample-page-2/`, `/author/andlun777/`, `/category/без-рубрики/`,
  `/category/uncategorized/` → `410`.
- старая статья → `301` сразу на её современный URL; конечная страница `200`.
- biography с Elementor query → `301 /about`; `/about` с теми же query →
  `301 /about`.
- `/sitemap.xml` и `/robots.txt` → `200`.
- `npm.cmd run lint` → успешно.
- `npm.cmd run typecheck` → успешно.
- `npm.cmd run build` → успешно.

## После будущей публикации

1. В Яндекс.Вебмастере открыть «Индексирование → Переобход страниц».
2. Отправить старые WordPress URL, `/about`, `/luneva-psy-biography/`, старый
   URL статьи и её новый URL на переобход.
3. Запустить проверку мобильной страницы для `/about`.
4. Через несколько дней проверить «Диагностика», «Страницы в поиске» и
   исчезновение архивов; затем нажать «Проверить» у рекомендации Description.

Не использовать robots.txt как способ очистки уже проиндексированных URL.
