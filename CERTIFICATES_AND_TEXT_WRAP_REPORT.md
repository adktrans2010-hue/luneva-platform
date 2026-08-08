# Certificates And Text Wrap Report

**Дата завершения:** 2026-08-08, Europe/Moscow
**Исходный commit:** `cce3176b677bf234209aeaf6411b7f2435786fd3`
**Commit с функциональными изменениями:** `aba086c95a07c7c38bc20b373e591c2f282a70b9` (`feat: localize qualification certificates`)
**Ветка:** `master`
**Remote:** `origin` (`github.com/adktrans2010-hue/luneva-platform`)

## Обследование

Проверены блок квалификаций на главной (`components/About.tsx`), его интерактивные карточки и модальное окно, общий блок помощи на главной и `/help` (`components/SymptomsCarousel.tsx`), а также общий компонент социальных ссылок. В проекте уже существовал доступный модальный просмотр сертификатов, поэтому он был сохранён и дополнен локальными данными.

## Локальные сертификаты

Пользовательские карточки квалификаций теперь используют только файлы из `public/`:

| Карточка | Стабильный id | Локальный файл или галерея |
| --- | --- | --- |
| Дипломированный психолог | `psychology-degree` | `/certificates/imported/Диплом о переподготовке.jpg` |
| Гештальт-терапевт | `gestalt-therapist` | `/certificates/gestalt/gestalt-therapist.jpg` |
| Специалист по травме и ПТСР | `trauma-ptsd` | `/certificates/imported/Лунева Александра Александровна2_page-0001.jpg` |
| Специалист по РПП | `eating-disorders` | 9 файлов `/certificates/rpp/rpp-01.jpg` … `/certificates/rpp/rpp-09.jpg` |
| Автор и преподаватель курсов | `teacher-author` | `/certificates/teaching/teacher-author.jpg` |

В production-коде карточек и модального окна больше нет `disk.yandex.ru`, `externalUrl` и переходов к внешнему архиву. Внешние источники использовались только однократно для загрузки предоставленных файлов в локальный репозиторий.

## Модальный просмотр

Сохранены и проверены: `role="dialog"`, `aria-modal`, связанный заголовок, перевод фокуса в окно, удержание фокуса, возврат фокуса на открывшую карточку, блокировка прокрутки фона и её восстановление. Окно закрывается крестиком, клавишей Esc и нажатием по фону. Для РПП доступна локальная галерея с номером текущего файла, стрелками и disabled-состояниями на границах.

Если изображение отсутствует, пользователь увидит понятное сообщение и безопасную внутреннюю ссылку на `/certificates`; внешняя ссылка не создаётся.

## Перенос текста

Причиной разрыва слов был `[overflow-wrap:anywhere]` в карточках квалификаций и помощи. В этих компонентах, а также в общих социальных ссылках, он заменён на правила нормального текста:

```css
white-space: normal;
word-break: normal;
overflow-wrap: normal;
hyphens: none;
```

Добавлены `min-w-0` и `max-w-full`. Карточки помощи сохраняют одну карточку со swipe на мобильном, две колонки на ширине от 768 px и три на desktop. Текст не обрезается `line-clamp`; карточки не используют фиксированную высоту для сокрытия содержимого.

## Изменённые файлы

- `components/About.tsx`
- `components/CertificateLightbox.tsx`
- `components/QualificationCertificateCards.tsx`
- `components/SocialLinks.tsx`
- `components/SymptomsCarousel.tsx`
- `src/lib/certificate-previews.ts`
- `src/lib/qualification-certificates.ts`
- `scripts/test-yookassa-payments.ts`
- `public/certificates/gestalt/gestalt-therapist.jpg`
- `public/certificates/rpp/rpp-01.jpg` … `rpp-09.jpg`
- `public/certificates/teaching/teacher-author.jpg`

## Проверки

| Команда | Результат |
| --- | --- |
| `npm.cmd run lint` | успешно |
| `npm.cmd run typecheck` | успешно |
| `npm.cmd test` | успешно (`YooKassa invariant tests passed`) |
| `npm.cmd run build` | успешно, создан `.next/BUILD_ID` |

Дополнительно выполнены проверки исходников: в пользовательском коде нет внешних URL Яндекс.Диска и `externalUrl`; карточки квалификаций и помощи не содержат `[overflow-wrap:anywhere]` и `line-clamp`.

## Production smoke-test

Изменения опубликованы на текущем VPS в `/var/www/luneva-platform`. Процесс `luneva-platform` в PM2 находится в состоянии `online`; приложение слушает локальный порт `127.0.0.1:3000`, внешний HTTPS обслуживается Nginx.

8 августа 2026 года проверены реальные HTTPS-ответы production:

| URL | Результат |
| --- | --- |
| `https://luneva-psy.ru/` | HTTP 200 |
| `/certificates/gestalt/gestalt-therapist.jpg` | HTTP 200 |
| `/certificates/rpp/rpp-01.jpg` | HTTP 200 |
| `/certificates/teaching/teacher-author.jpg` | HTTP 200 |

На опубликованной главной дополнительно проверено:

- все пять карточек квалификаций присутствуют как доступные кнопки;
- карточка «Дипломированный психолог» открывает модальное окно «Бакалавр психологии» с локальным оптимизированным изображением;
- закрытие модального окна по Esc работает;
- карточка РПП открывает локальную галерею `1 / 9` с навигацией назад и вперёд;
- четвёртый шаг «Поддержка изменений» присутствует в блоке процесса работы;
- на мобильной ширине 390 px `scrollWidth` равен ширине документа, горизонтального overflow нет.

## Ограничения

Существующий проект не содержит отдельного автоматизированного browser/e2e-теста для touch swipe или keyboard focus trap. Эти сценарии реализованы существующим компонентом модального окна и требуют финального ручного smoke-test после публикации на production.

## Статус

**ОПУБЛИКОВАНО И ПРОВЕРЕНО**
