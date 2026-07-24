# Отчет по этапу: наполнение тематических страниц раздела «С чем я помогаю»

Дата проверки: 24.07.2026  
Проект: Luneva Platform  
Коммит / push / публикация: не выполнялись по условиям задачи.

## 1. Что было найдено до работ

- Маршрут `app/help/[slug]/page.tsx` существовал, но использовал короткие тексты карточек из `src/lib/help-topics.ts`.
- Пять тематических страниц `/help/relationships`, `/help/anxiety`, `/help/grief-crisis`, `/help/self-esteem`, `/help/emotions` фактически были страницами-заглушками.
- В `src/lib/publication-status.ts` эти страницы были отмечены как `placeholder`.
- `/help/eating-disorders` уже редиректил на `/rpp` через 301.
- `/help/trauma-ptsd` уже редиректил на `/help/grief-crisis` через 301.
- В sitemap пять новых тематических страниц не были добавлены явно.
- `/rpp` оставался каноническим маршрутом для темы РПП.

## 2. Что реализовано

- Создан типизированный источник контента `src/lib/help-topic-pages.ts`.
- Полностью наполнены пять тематических страниц:
  - `/help/relationships`
  - `/help/anxiety`
  - `/help/grief-crisis`
  - `/help/self-esteem`
  - `/help/emotions`
- Каждая страница получила:
  - breadcrumbs;
  - один H1;
  - уникальный Title;
  - уникальный Description;
  - canonical на свой маршрут;
  - Open Graph и Twitter metadata;
  - вводный текст;
  - CTA «Записаться на консультацию»;
  - блок «С чем можно обратиться»;
  - блок «Как это может ощущаться в повседневной жизни»;
  - блок «Почему это происходит»;
  - блок «Как может помочь психотерапия»;
  - блок «Когда особенно важно обратиться за помощью»;
  - блок «Как проходит работа»;
  - видимый FAQ;
  - FAQPage JSON-LD;
  - BreadcrumbList JSON-LD;
  - блок «Читайте также»;
  - финальный CTA.
- `/rpp` не переписывался и остался отдельной полноценной страницей РПП.
- `/help/eating-disorders` оставлен как 301 на `/rpp`.
- `/help/trauma-ptsd` оставлен как 301 на `/help/grief-crisis`.
- Пять тематических страниц переведены из `placeholder` в `published`.
- Пять тематических страниц добавлены в sitemap.
- Редиректные `/help/eating-disorders` и `/help/trauma-ptsd` не добавлены в sitemap.
- В аналитике `help_topic_click` добавлено различение источника клика:
  - `source: "home"` для Главной;
  - `source: "help"` для страницы `/help`.

## 3. SEO по страницам

| Страница | Title | H1 | Canonical |
|---|---|---|---|
| `/help/relationships` | `Сложности в отношениях с партнером, детьми и родителями \| Психолог Александра Лунева` | `Сложности в отношениях с партнером, детьми и родителями` | `https://luneva-psy.ru/help/relationships` |
| `/help/anxiety` | `Тревога, панические атаки и внутреннее напряжение \| Психолог Александра Лунева` | `Тревога, панические атаки, страхи и внутреннее напряжение` | `https://luneva-psy.ru/help/anxiety` |
| `/help/grief-crisis` | `Утрата, жизненные кризисы, психологическая травма и ПТСР \| Психолог Александра Лунева` | `Утрата, жизненные кризисы, психологическая травма и ПТСР` | `https://luneva-psy.ru/help/grief-crisis` |
| `/help/self-esteem` | `Низкая самооценка, неуверенность и внутренняя опора \| Психолог Александра Лунева` | `Низкая самооценка, неуверенность, одиночество и потеря внутренней опоры` | `https://luneva-psy.ru/help/self-esteem` |
| `/help/emotions` | `Эмоциональное выгорание, усталость, апатия и сложные чувства \| Психолог Александра Лунева` | `Эмоциональное выгорание, усталость, апатия и сложные чувства` | `https://luneva-psy.ru/help/emotions` |

## 4. FAQ по страницам

### `/help/relationships`

- Можно ли прийти, если партнер или родитель не хочет обращаться к психологу?
- Это обязательно семейная терапия?
- Психолог скажет, кто прав?
- Можно ли обсуждать отношения с подростком?
- Если мы часто ссоримся, это значит, что отношения пора заканчивать?
- Сколько встреч может понадобиться?

### `/help/anxiety`

- Тревога - это всегда проблема?
- Паническая атака опасна?
- Можно ли работать с тревогой онлайн?
- Нужно ли сразу понимать причину тревоги?
- Психолог научит техникам успокоения?
- Сколько времени занимает работа с тревогой?

### `/help/grief-crisis`

- Нужно ли подробно рассказывать о травматичном событии на первой встрече?
- Горе можно пройти быстрее?
- Если прошло много времени, обращаться уже поздно?
- ПТСР можно поставить себе по описанию симптомов?
- Что делать, если состояние резко ухудшается?
- Можно ли работать с такими темами онлайн?

### `/help/self-esteem`

- Низкая самооценка - это про слабость характера?
- Можно ли стать увереннее без жесткой мотивации?
- Что делать, если я все понимаю, но все равно себя критикую?
- Можно ли обсуждать одиночество?
- Психолог будет давать задания?
- Как понять, что внутренняя опора восстанавливается?

### `/help/emotions`

- Как отличить усталость от выгорания?
- Если у меня апатия, нужен психолог или врач?
- На консультации меня будут заставлять активнее действовать?
- Можно ли работать с подавленной злостью?
- Почему я не могу отдыхать, хотя очень устал?
- Сколько времени нужно, чтобы восстановиться?

## 5. Внутренние ссылки

### `/help/relationships`

- `/help/anxiety`
- `/help/self-esteem`
- `/help/grief-crisis`
- `/about`

### `/help/anxiety`

- `/help/emotions`
- `/help/self-esteem`
- `/help/relationships`
- `/contacts`

### `/help/grief-crisis`

- `/help/anxiety`
- `/help/emotions`
- `/help/relationships`
- `/contacts`

### `/help/self-esteem`

- `/help/relationships`
- `/help/anxiety`
- `/help/emotions`
- `/about`

### `/help/emotions`

- `/help/anxiety`
- `/help/self-esteem`
- `/help/relationships`
- `/contacts`

## 6. Редиректы

Проверено локально на production-сборке:

- `/help/eating-disorders` -> `301` -> `/rpp`
- `/help/trauma-ptsd` -> `301` -> `/help/grief-crisis`

## 7. Sitemap и robots

Проверено локально:

- `/help/relationships` есть в sitemap.
- `/help/anxiety` есть в sitemap.
- `/help/grief-crisis` есть в sitemap.
- `/help/self-esteem` есть в sitemap.
- `/help/emotions` есть в sitemap.
- `/rpp` есть в sitemap.
- `/help/eating-disorders` отсутствует в sitemap.
- `/help/trauma-ptsd` отсутствует в sitemap.
- `robots.txt` не блокирует раздел `/help`.

## 8. HTTP-проверка

Проверено локально на `next start`:

- `/help/relationships` -> `200 OK`
- `/help/anxiety` -> `200 OK`
- `/help/grief-crisis` -> `200 OK`
- `/help/self-esteem` -> `200 OK`
- `/help/emotions` -> `200 OK`
- `/rpp` -> `200 OK`
- `/help/eating-disorders` -> `301 Moved Permanently`
- `/help/trauma-ptsd` -> `301 Moved Permanently`
- `/sitemap.xml` -> `200 OK`
- `/robots.txt` -> `200 OK`

## 9. Визуальная проверка

Скриншоты сохранены:

- `C:\Users\User\Documents\Сайт Luneva-psy\Luneva-Platform\luneva-platform\test-results\help-topic-pages\desktop-relationships.png`
- `C:\Users\User\Documents\Сайт Luneva-psy\Luneva-Platform\luneva-platform\test-results\help-topic-pages\mobile-relationships.png`
- `C:\Users\User\Documents\Сайт Luneva-psy\Luneva-Platform\luneva-platform\test-results\help-topic-pages\desktop-anxiety.png`
- `C:\Users\User\Documents\Сайт Luneva-psy\Luneva-Platform\luneva-platform\test-results\help-topic-pages\mobile-anxiety.png`
- `C:\Users\User\Documents\Сайт Luneva-psy\Luneva-Platform\luneva-platform\test-results\help-topic-pages\desktop-grief-crisis.png`
- `C:\Users\User\Documents\Сайт Luneva-psy\Luneva-Platform\luneva-platform\test-results\help-topic-pages\mobile-grief-crisis.png`
- `C:\Users\User\Documents\Сайт Luneva-psy\Luneva-Platform\luneva-platform\test-results\help-topic-pages\desktop-self-esteem.png`
- `C:\Users\User\Documents\Сайт Luneva-psy\Luneva-Platform\luneva-platform\test-results\help-topic-pages\mobile-self-esteem.png`
- `C:\Users\User\Documents\Сайт Luneva-psy\Luneva-Platform\luneva-platform\test-results\help-topic-pages\desktop-emotions.png`
- `C:\Users\User\Documents\Сайт Luneva-psy\Luneva-Platform\luneva-platform\test-results\help-topic-pages\mobile-emotions.png`

Дополнительно через Playwright проверено на мобильной ширине `390px`:

- H1 присутствует на всех пяти страницах.
- Canonical корректный на всех пяти страницах.
- FAQ видимый, по 6 вопросов на каждой странице.
- Горизонтального скролла страницы нет.

## 10. Автоматические проверки

- `npm.cmd run lint` -> успешно.
- `npm.cmd run typecheck` -> успешно.
- `npm.cmd run build` -> успешно.

Примечание: обычный `npm run ...` в PowerShell был заблокирован политикой выполнения `npm.ps1`, поэтому команды запускались через `npm.cmd`. Это ограничение оболочки Windows, не ошибка проекта.

## 11. Измененные файлы

- `app/help/[slug]/page.tsx`
- `app/help/page.tsx`
- `app/sitemap.ts`
- `components/SymptomsCarousel.tsx`
- `src/lib/help-topic-pages.ts`
- `src/lib/help-topics.ts`
- `src/lib/publication-status.ts`
- `HELP_TOPIC_PAGES_STAGE_REPORT.md`

## 12. Что осталось проверить вручную

- Открыть пять страниц на реальном телефоне после публикации.
- Проверить клики CTA в Яндекс Метрике после согласия на cookies.
- Проверить, что в production sitemap после деплоя содержит новые страницы и не содержит редиректные URL.
- Проверить, что внешний CDN/кеш не отдает старую версию страниц после публикации.

