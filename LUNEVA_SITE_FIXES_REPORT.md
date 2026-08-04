# LUNEVA SITE FIXES REPORT

Дата этапа: 2026-08-04

## 1. Commits

- Исходный commit: `35fdf901c99aa2021feef7ff0e5d77e48ca6fb62`
- Итоговый commit: будет указан в итоговом сообщении после фиксации изменений.

## 2. Измененные файлы

- `app/api/admin/review-categories/[id]/route.ts`
- `app/api/admin/review-categories/route.ts`
- `app/api/admin/reviews/[id]/route.ts`
- `app/blog/category/[category]/page.tsx`
- `app/blog/page.tsx`
- `app/contacts/page.tsx`
- `app/reviews/page.tsx`
- `components/CertificateLightbox.tsx`
- `components/ContactIcons.tsx`
- `components/Hero.tsx`
- `components/QualificationCertificateCards.tsx`
- `components/ReviewsCatalog.tsx`
- `components/SocialLinks.tsx`
- `components/Symptoms.tsx`
- `components/SymptomsCarousel.tsx`
- `scripts/test-yookassa-payments.ts`
- `src/lib/certificate-previews.ts`
- `src/lib/client-analytics.ts`
- `src/lib/qualification-certificates.ts`
- `src/lib/site-contacts.ts`
- `src/lib/social-links.tsx`

## 3. Hero

- В цитатном блоке заменена декоративная веточка на SVG-веточку с листьями.
- SVG имеет `aria-hidden="true"`.
- Фото, тексты, кнопки, фон, палитра и основная композиция Hero не менялись.
- Цитатный блок получил более устойчивую адаптацию на tablet: текст не обрезается и не перекрывается иконкой.

## 4. Выравнивание блока «Когда стоит обратиться»

- Блок переведен на общий `Container`.
- Заголовок и вводный текст выровнены через тот же внутренний отступ, который используется в Hero.
- Карточки остались внутри общего контейнера и не смещаются за его пределы.

## 5. Дипломы и сертификаты

| Карточка | Реализация |
| --- | --- |
| Гештальт-терапевт | `https://disk.yandex.ru/i/N86LaG0kj-B7Pw` |
| Специалист по РПП | 9 документов Яндекс.Диска, галерея с предыдущий/следующий и счетчиком |
| Автор и преподаватель | `https://disk.yandex.ru/i/iGPCpLeOQuL6mQ` |

- Используются стабильные id карточек: `gestalt-therapy`, `eating-disorders`, `course-author`.
- Добавлена поддержка `externalUrl` в существующий тип `CertificatePreview`.
- При внешнем документе lightbox показывает аккуратный экран с кнопкой открытия документа в новой вкладке.
- Пустые изображения не показываются.

## 6. Якорь онлайн-записи

- Блок онлайн-записи на `/contacts` получил `id="booking"` и `scroll-mt-28`.
- CTA остаются связанными с `/contacts#booking`, что соответствует фактическому расположению формы и сохраняет текущую аналитику.

## 7. Отзывы

Причина ошибки категорий:

- Категории сохранялись в админке, но публичная страница и главная могли отдавать кэшированные данные.
- Страница `/reviews` не была явно динамической.
- API изменения отзывов и категорий не вызывали revalidate публичных страниц.

Исправление:

- `/reviews` переведена в `force-dynamic`.
- После изменения/удаления отзывов выполняется `revalidatePath("/")` и `revalidatePath("/reviews")`.
- После создания/изменения/удаления категорий выполняется `revalidatePath("/reviews")`.
- Фильтры отзывов получили аналитику `review_filter_click`.

## 8. Контакты

Новый порядок `/contacts`:

1. заголовок страницы;
2. основные способы связи;
3. социальные сети;
4. карты;
5. онлайн-запись;
6. контакты и реквизиты исполнителя;
7. футер.

- Блок «Контакты и реквизиты исполнителя» перенесен в конец содержательной части.
- Кнопка «Смотреть реквизиты» сохранена.
- Текст «Быстрая связь» удален.

## 9. Социальные сети

Создан единый типизированный массив `socialLinks`.

| Соцсеть | URL |
| --- | --- |
| MAX | `https://max.ru/join/f7dCzkGb4bRwAjVhhtjfP7qfQwmJa-cwCcHzqkQmD1A` |
| Telegram | `https://t.me/aleksandrapsy` |
| ВКонтакте | `https://vk.ru/club188501100` |
| YouTube | `https://youtube.com/@lunevapsy?si=YTIakRJyaWEh2Mm4` |
| TikTok | `https://www.tiktok.com/@lunevapsy?_r=1&_t=ZN-98bDu840qEY` |
| Threads | `https://www.threads.com/@lunevapsy?igshid=NTc4MTIwNjQ2YQ==` |
| Instagram | `https://www.instagram.com/lunevapsy?igsh=MTdvb2lwcHpsYnJpbQ%3D%3D&utm_source=qr` |

- Иконки монохромные, в приглушенной палитре сайта.
- `target="_blank"` и `rel="noopener noreferrer"` добавлены.
- Instagram и Threads отмечены `*`.
- Сноска выводится один раз и видна на mobile.

## 10. Mobile fixes

- В карточках блока «Когда стоит обратиться» добавлены `min-w-0` и `[overflow-wrap:anywhere]`.
- Текст «Утрата и жизненные кризисы, психологическая травма и ПТСР» больше не должен выходить за границы карточки.
- В карточках квалификаций исправлен перенос текста «Посмотреть сертификат →».

## 11. Tablet fixes

- Hero-цитата больше не завязана на жесткое горизонтальное размещение текста и иконки.
- `/blog` на tablet использует 2 колонки.
- `/blog/category/[category]` на tablet использует 2 колонки, 3 колонки включаются только на `xl`.
- Описание карточек статей на tablet ограничено `line-clamp-4`; полная статья не обрезается.

## 12. Навигация

- Источник меню: `src/lib/navigation.ts`.
- `Контакты` имеет `href="/contacts"`.
- `Статьи` имеет `href="/blog"`.
- Добавлены тесты на эти href.

## 13. Проверки ссылок

HTTP-проверка внешних ссылок:

- Telegram: `200`
- ВКонтакте: `200`
- YouTube: `200`
- TikTok: `200`
- Threads: `200`
- Instagram: `200`
- Все 11 ссылок Яндекс.Диска: `200`
- MAX: `403` для автоматического `curl`; URL оставлен по ТЗ, вероятная причина — антибот-ограничение сервиса.

## 14. Автоматические проверки

- `npm.cmd run lint`: passed
- `npm.cmd run typecheck`: passed
- `npm.cmd test`: passed
- `npm.cmd run build` локально: blocked by local PostgreSQL auth error `28P01` when reading SEO pages from `.env`. Требуется повторить на production VPS с рабочим `.env`.

## 15. Ограничения

- Автоматическое скачивание документов с Яндекс.Диска не выполнялось; подключены внешние fallback-ссылки через существующий lightbox.
- Локальный production build невозможен без корректного локального `DATABASE_URL`.
- Полная viewport-проверка должна быть выполнена после деплоя на VPS.

## 16. Финальный статус

Статус до server build и production smoke-test: `NOT READY`.
