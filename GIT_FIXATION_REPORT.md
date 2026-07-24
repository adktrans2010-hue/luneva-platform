# Отчёт о безопасной Git-фиксации этапа «Меню + Энциклопедия РПП»

Дата и время проверки: 22.07.2026 20:43 MSK  
Итоговый статус: **RED — remote подключён, но локальная и GitHub-истории не имеют общего базового commit; commit и push выполнять небезопасно.**

## 1. Исходное состояние Git

- Текущая ветка: `master`.
- Текущий commit: `45673cc Add production healthcheck script`.
- Upstream: отсутствует.
- Remote: отсутствует; `git remote -v` не вернул записей.
- Staged-файлы: отсутствуют.
- Незавершённые merge, rebase, cherry-pick, revert и bisect: не обнаружены.
- Изменённых отслеживаемых файлов: 65.
- Неотслеживаемых файлов до создания этого отчёта: 165.
- Всего локальных файлов с изменениями до создания отчёта: 230.

Команда `git fetch --prune` не могла получить удалённое состояние, поскольку remote не настроен. Сравнение `HEAD...@{upstream}` также невозможно: upstream для `master` отсутствует.

## 2. Причины остановки

Commit и push не выполнялись по двум независимым причинам:

1. Нет ни одного remote и нет upstream. Невозможно однозначно определить репозиторий и удалённую ветку, а задание прямо запрещает придумывать назначение push.
2. Несколько файлов содержат одновременно изменения этапа меню/RPP и несвязанные изменения. Добавление этих файлов целиком включило бы в commit чужую функциональность.

До устранения обоих условий обычный безопасный push невозможен.

## 3. Состав этапа, подтверждённый локальным кодом и отчётом

Файлы, полностью или преимущественно относящиеся к этапу:

| Файл | Назначение |
| --- | --- |
| `app/[...slug]/page.tsx` | Строгий catch-all, настоящие 404, placeholder и `noindex`, хлебные крошки |
| `components/Header.tsx` | Новое desktop/mobile-меню, мегаменю RPP, активные состояния и доступность |
| `app/blog/category/[category]/page.tsx` | Маршруты категорий блога, 404 и `noindex` пустых категорий |
| `app/rpp/[[...slug]]/page.tsx` | Опубликованные страницы энциклопедии РПП и 404 неизвестных slug |
| `components/Breadcrumbs.tsx` | Видимые хлебные крошки и навигационная структура |
| `src/lib/navigation.ts` | Централизованная конфигурация меню и фильтрация публичных ссылок |
| `src/lib/placeholder-pages.ts` | Белый список placeholder-страниц |
| `src/lib/publication-status.ts` | Реестр `published`, `draft`, `placeholder` |
| `src/lib/rpp-pages.ts` | Карта страниц и секций RPP |
| `src/content/rpp-document.json` | Импортированный контент энциклопедии РПП |
| `scripts/import-rpp-document.py` | Воспроизводимый импорт исходного RPP-документа |
| `tests/e2e/navigation-rpp.spec.ts` | Регрессия меню, 404, redirect, sitemap, `noindex` и адаптивности |
| `playwright.config.ts` | Конфигурация E2E-проверок этапа |
| `package-lock.json` | Добавление пакетов Playwright; diff содержит только соответствующие lock-записи |
| `MENU_IMPLEMENTATION_REPORT.md` | Приёмка, публикация и результаты проверок этапа |
| `audit/menu-rpp/stage-2/*.png` | Шесть контрольных скриншотов 320–1440 px |

Эти файлы не были staged, поскольку общая операция остановлена до staging из-за критической неоднозначности remote и смешанных файлов.

## 4. Смешанные файлы, требующие выборочного staging

Следующие файлы нельзя добавлять целиком:

### `components/Footer.tsx`

К этапу относится переход на `footerNavigation`. Одновременно присутствуют несвязанные изменения телефона, WhatsApp и ссылки на реквизиты.

### `app/sitemap.ts`

К этапу относятся опубликованные RPP-страницы и непустые категории блога. Одновременно добавлена несвязанная страница `/requisites`.

### `next.config.ts`

К этапу относится постоянный редирект `/about/education` на `/certificates`. Одновременно изменены CDN, `assetPrefix`, CSP и Яндекс.Метрика.

### `package.json`

К этапу относятся `@playwright/test` и команда `typecheck`. Одновременно добавлены команды аудита, платежной сверки, возвратов и миграции продуктов.

Для этих файлов нужен ручной `git add -p` после настройки remote и повторной проверки каждого hunk. Несвязанные части должны остаться в рабочей директории.

## 5. Несвязанные изменения, намеренно не включённые

Ничего из перечисленного ниже не было staged или изменено в рамках Git-фиксации:

- личный кабинет и приглашения: `app/account/**`, `app/api/account/**`, `components/Account*`, `src/lib/account-invitations.ts`, `src/lib/client-notifications.ts`;
- админ-панель и клиенты: `app/admin/**`, `app/api/admin/**`, `components/Admin*`, `src/lib/admin-api.ts`, `src/lib/client-analytics.ts`;
- запись и расписание: `app/api/appointments/**`, `components/AppointmentForm.tsx`, `src/lib/appointment-slots.ts`, `src/lib/consultation-locations.ts`;
- платежи и возвраты: `app/payment/**`, `app/api/yookassa/**`, `src/lib/yookassa*`, `src/lib/appointment-payments.ts`, `src/lib/payment-contact.ts`;
- продукты консультаций: `app/admin/products/**`, `src/lib/consultation-product*`, связанные миграции и документы;
- авторизация: `app/api/auth/**`, `src/lib/auth-user.ts`, `proxy.ts`;
- отзывы: `components/ReviewForm.tsx`, `components/Reviews*.tsx`, `src/lib/reviews.ts`, `src/lib/format-review-date.ts`;
- аналитика: `components/AnalyticsTracker.tsx`, `components/YandexMetrika.tsx`, `components/PaymentStatusAnalytics.tsx`, `src/lib/attribution.ts`;
- дизайн главной страницы: `app/page.tsx`, `components/Symptoms*`, `components/Pricing.tsx`, `components/Process.tsx`;
- контакты, юридические документы и Schema.org: `app/contacts/page.tsx`, `content/legal/**`, `components/legal/**`, `src/lib/site-contacts.ts`, `src/lib/schema-org.ts`;
- база данных: `src/db/schema.ts`, `drizzle/**`;
- Telegram и прочие серверные интеграции: `src/lib/telegram.ts`;
- остальные файлы аудита и документации вне `audit/menu-rpp/stage-2/` и `MENU_IMPLEMENTATION_REPORT.md`.

Все эти локальные изменения сохранены на месте. Откат, удаление или перезапись не выполнялись.

## 6. Служебные и чувствительные артефакты, исключённые из commit

Обнаружены и не добавлялись:

- `test-results/**`;
- `debug.log`;
- `backups/**` и `rollback-artifacts/**`;
- `deploy/*.tar.gz`;
- `deploy/*.dump` и локальные `*.dump`;
- локальные журналы и PID-файлы в `audit/results/**`;
- shell-скрипты настройки секретов и production;
- архив релиза `deploy/menu-rpp-release-20260722.tar.gz`.

Часть этих артефактов не закрыта текущим `.gitignore`. Правила `.gitignore` автоматически не менялись, чтобы не скрыть важные исходники широким шаблоном в грязной рабочей директории.

## 7. Проверка секретов

По подтверждённому набору исходников этапа выполнен поиск следующих типов данных: Telegram-токены и chat ID, YooKassa credentials, `DATABASE_URL`, auth/session secrets, Bearer-токены, приватные SSH-ключи и присваивания паролей.

Результат: совпадений в кандидатах этапа не обнаружено. Значения секретов не выводились и в отчёт не помещались.

При этом в рабочей директории присутствуют дампы, резервные копии, deploy-архивы и служебные скрипты. Они классифицированы как потенциально чувствительные и должны оставаться вне commit.

## 8. Staging и commit

- `git add .` и `git add -A` не выполнялись.
- `git add -p` не выполнялся, поскольку задача остановлена до staging.
- Staged diff пуст.
- Commit message не использовался.
- Commit hash не создан.

## 9. Проверки

В рамках предыдущей приёмки этого же этапа зафиксированы результаты:

| Проверка | Результат предыдущей приёмки |
| --- | --- |
| `npm run lint` | PASS |
| `npm run typecheck` | PASS |
| `npm test` | PASS |
| `npm run build` | PASS, Next.js 16.2.9 |
| `npx playwright test` | PASS, 15 из 15 |

В текущем запуске проверки повторно не запускались: безопасный процесс остановлен до staging из-за отсутствия remote/upstream и смешанных изменений. Это предотвращает ошибочное утверждение, что проверки выполнялись именно над будущим staged-набором.

Предыдущая приёмка также подтверждает:

- неизвестные URL возвращают HTTP 404;
- `/about/education` возвращает один 301 на `/certificates`;
- `/account` без авторизации сохраняет защитный redirect;
- placeholder имеют `noindex`;
- placeholder и draft отсутствуют в sitemap;
- menu links не возвращают 404/5xx;
- desktop/mobile-меню работают;
- «Помощь» является прямой ссылкой без пустого подменю;
- горизонтального переполнения на проверенных ширинах нет.

## 10. Push

- Push не выполнялся.
- Remote для push отсутствует.
- Upstream ветки `master` отсутствует.
- Force push, изменение истории, merge и rebase не выполнялись.

Для продолжения владелец должен предоставить точный URL существующего удалённого репозитория и подтвердить целевую ветку. После настройки remote необходимо выполнить `git fetch --prune`, сравнить историю, вручную подготовить смешанные hunks, повторить проверки и только затем создать commit.

## 11. Production

Подключение по SSH/SCP к VPS не выполнялось. Deploy, сборка на сервере, PM2/nginx/PostgreSQL, DNS, переменные окружения и база данных не изменялись.

## 12. Итог

**RED.** Состав этапа установлен, посторонние и служебные изменения сохранены, кандидаты этапа проверены на типичные секреты. Первая попытка фиксации была остановлена безопасно, потому что remote/upstream отсутствовали, а четыре общих файла требуют ручного разделения hunks.

## 13. Подключение предоставленного GitHub-репозитория

Повторная проверка выполнена 22.07.2026 после получения точного URL от владельца.

### Настройка remote

- Имя remote: `origin`.
- URL: `https://github.com/adktrans2010-hue/luneva-platform.git`.
- URL для fetch и push совпадает с предоставленным владельцем.
- Проверка доступа через `git ls-remote` — PASS.
- Авторизация для чтения репозитория работает.
- Remote оставлен подключённым; URL не изменялся.

### Фактическое состояние GitHub

- Default branch: `main`.
- Remote branches: только `origin/main`.
- Remote HEAD: `d4ba9ef32cffeee2034092c9dc620f3b45b5dc35`.
- История GitHub: один commit `d4ba9ef Initial commit`.
- Корень `origin/main` содержит только `.gitignore` и `README.md`.
- `README.md` описывает Luneva Platform, поэтому репозиторий по назначению соответствует проекту, но не содержит локальную историю разработки.

### Сравнение историй

- Локальная ветка: `master`.
- Локальный HEAD: `45673cc Add production healthcheck script`.
- Merge-base между `HEAD` и `origin/main`: отсутствует.
- Расхождение `HEAD...origin/main`: 93 локальных commit и 1 удалённый commit.
- Известный локальный commit `45673cc` и его предки отсутствуют в GitHub-истории.
- Истории являются несвязанными.

Это соответствует сценарию D из задания. Запрещённые операции `--allow-unrelated-histories`, force push, автоматический merge, rebase, переименование ветки и переписывание remote не выполнялись.

### Staging, проверки и commit после подключения

- Staged-файлов: 0.
- Выбранных hunks из смешанных файлов: 0.
- Все hunks `components/Footer.tsx`, `app/sitemap.ts`, `next.config.ts` и `package.json` оставлены unstaged.
- Изолированный worktree будущего commit не создавался, поскольку процесс обязан остановиться до staging при несвязанных историях.
- `lint`, `typecheck`, `test`, `build` и Playwright в этой повторной попытке не запускались.
- Результаты предыдущей приёмки остаются справочными и не выдаются за проверку будущего commit.
- Commit message не применялся.
- Новый commit hash отсутствует.
- Push не выполнялся.
- Upstream локальной `master` по-прежнему отсутствует.

### Сохранность рабочей директории

- Несвязанные локальные изменения не удалялись и не откатывались.
- `git add .`, `git add -A`, `git reset`, `git clean`, `git restore`, stash, merge и rebase не выполнялись.
- Служебные файлы, дампы, архивы, логи и резервные копии не добавлялись.
- Production, VPS, PM2, nginx, PostgreSQL, DNS, env и база данных не изменялись.

### Решение, необходимое от владельца

Нужно отдельно выбрать стратегию первичного наполнения GitHub-репозитория. Обычный push `master` в существующую `main` невозможен без объединения или переписывания несвязанных историй. Допустимую стратегию нельзя выбирать автоматически при грязной рабочей директории и запрете на force push.

Итог повторной попытки: **RED — remote подключён успешно, но продолжение остановлено из-за несвязанных историй local и remote.**

## Отправка локальной истории в origin/production

Проверка и попытка отправки выполнены 22.07.2026 в 21:50 по московскому времени.

1. Локальная ветка: `master`.
2. Локальный HEAD до push: `45673cc78632caf3a09309085235af3aff321929` (`45673cc Add production healthcheck script`).
3. Remote: `origin`, URL `https://github.com/adktrans2010-hue/luneva-platform.git`.
4. Default branch GitHub: `main`.
5. `origin/main` до и после операции: `d4ba9ef32cffeee2034092c9dc620f3b45b5dc35`; ветка не изменялась и не перезаписывалась.
6. До операции `origin/production` отсутствовала. Это подтверждено `git fetch --prune origin`, `git remote show origin`, `git branch -r` и `git ls-remote --heads origin`.
7. Выполнена команда `git push origin master:production` без `--force` и без `--force-with-lease`.
8. Push не завершился успешно: клиентская команда завершена таймаутом через 184 секунды без ответа GitHub.
9. После таймаута выполнена отдельная проверка `git ls-remote --heads origin main production`: `origin/production` не создана, `origin/main` осталась на прежнем hash.
10. Hash локальной `master` после попытки push: `45673cc78632caf3a09309085235af3aff321929`.
11. Hash `origin/production`: отсутствует, поэтому сравнение hashes и настройка upstream невозможны.
12. Upstream локальной `master` не настроен; локальная ветка не переименовывалась.
13. Текущий заголовок `git status --short --branch`: `## master`.
14. Количество commit в локальной истории `master`: 93.
15. Новый commit не создавался.
16. Незакоммиченные изменения сохранены. До и после попытки push совпадают SHA-256 снимков: status `34db9f1b99ae1e38ebd279c7eb7dd44f447c30cdeea3079bbaf41be3e72fc1f0`, tracked diff `9d5b23de0d3e38c116cbaee17220fecca491e627b699dc8ab6be89385371fe48`, untracked list `41791876d53f365dac77337eede81885879f69b1d565f30f7be3bea918810200`.
17. До обновления данного отчёта рабочее дерево содержало 65 изменённых tracked-файлов и 166 неотслеживаемых файлов при полном раскрытии каталогов; состав не изменился из-за fetch/push.
18. Staged-область до и после операции пуста: 0 файлов.
19. Force push, merge, rebase, stash, reset, clean и restore не использовались.
20. Рабочие файлы сайта этой Git-операцией не изменялись.
21. Production VPS, deploy, PM2, nginx, PostgreSQL, DNS, env и база данных не затрагивались.
22. Default branch GitHub автоматически не менялась. После успешного создания и проверки `production` владелец сможет вручную выбрать её через GitHub `Settings -> Branches -> Default branch`; удалять `main` не требуется.
23. Критическая проблема: сетевой таймаут не позволил создать удалённую ветку. В соответствии с заданием push не повторялся, force не применялся, upstream не настраивался.

Итоговый статус этапа: **YELLOW — remote и исходные условия проверены, но push и upstream не завершены из-за сетевого таймаута; локальные данные сохранены.**

## Диагностика и повторный push origin/production

Диагностика и повторная отправка выполнены 22.07.2026 в 22:18 по московскому времени.

### Исходное состояние

- Локальная ветка: `master`.
- Исходный HEAD: `45673cc78632caf3a09309085235af3aff321929`.
- Количество commit: 93.
- Remote `origin`: `https://github.com/adktrans2010-hue/luneva-platform.git`.
- `origin/main`: `d4ba9ef32cffeee2034092c9dc620f3b45b5dc35`.
- `origin/production` до повторной попытки отсутствовала.
- Staged-область была пуста; незавершённых merge, rebase, cherry-pick, revert и bisect не обнаружено.
- Контрольные SHA-256 до операции: status `34db9f1b99ae1e38ebd279c7eb7dd44f447c30cdeea3079bbaf41be3e72fc1f0`, binary diff `72201c5178d4471d61f24259923f69bf2689e96e71dea2c013877c5065bea744`, untracked list `41791876d53f365dac77337eede81885879f69b1d565f30f7be3bea918810200`.

### Авторизация и dry-run

- Credential helper: системный Git Credential Manager (`manager`, источник `C:/Program Files/Git/etc/gitconfig`).
- Git identity: `Luneva Dev`; email настроен локально.
- GitHub CLI `gh` не установлен, поэтому `gh auth status` не запускался.
- `GIT_TERMINAL_PROMPT=0` использован для исключения скрытого интерактивного запроса.
- Команда `git push --dry-run --porcelain origin master:production` завершилась успешно.
- Exit code dry-run: `0`.
- Продолжительность dry-run: около 154,9 секунды.
- Результат dry-run: создание новой ветки `production` разрешено; ошибок Authentication failed, Permission denied, Repository not found или protected branch нет.

### Git и транспорт

- Git: `git version 2.55.0.windows.2`.
- HTTPS backend: `schannel`.
- Пользовательские `core.compression` и `pack.*` не настроены; используются значения Git по умолчанию.
- `git ls-remote origin` завершился с exit code `0` примерно за 0,87 секунды.
- Публичный `curl.exe -I https://github.com` вернул `HTTP/1.1 200 OK`.
- Полная трассировка с заголовками не потребовалась: dry-run и повторный push завершились успешно.

### Размер истории и pack

Результат `git count-objects -vH`:

- loose objects: 484, 474,71 KiB;
- packed objects: 988;
- packs: 2;
- локальный суммарный `size-pack`: 291,02 MiB;
- garbage: 0.

Отдельно создан оценочный pack только ветки `master` во временной системной папке:

- размер pack с индексом и reverse index: 36 960 291 байт, или 35,25 MiB;
- собственно `.pack`: 36 913 279 байт;
- время локальной упаковки: около 0,92 секунды;
- временные pack-файлы удалены после измерения.

Крупнейшие 20 blobs истории `master`:

| # | Hash | Размер, байт | Исторический путь |
|---:|---|---:|---|
| 1 | `bdbe38f085e705be319280f050c042601a3127c9` | 5 111 747 | `public/sasha-about.jpg` |
| 2 | `6b9eaa0ce137c5244c2a4750de9985348b1540ce` | 4 604 402 | `public/sasha-hero.jpg` |
| 3 | `735624477151bcfcbaa54ee33f5dcabdafb218a0` | 3 780 308 | `public/sasha-about-portrait.jpg` |
| 4 | `7c4828d34b5bb479e3044baee4b55e01bc87952d` | 2 641 035 | `public/sasha-about-page.jpg` |
| 5 | `739cd80b34094c322d25bb5c90e4b1b20747bb5d` | 2 126 091 | `public/certificates/cert-1.jpg` |
| 6 | `a82e7714e0597a12cd435e1082b7fe6080d33ebe` | 2 019 754 | `public/therapy-process.jpg` |
| 7 | `b187ed15221fce040edd34a9a07d730a01e050db` | 1 894 949 | `public/certificates/cert-2.jpg` |
| 8 | `0b6bad8d95b0bb94b46ab4a9b7313b4aa71997be` | 1 637 752 | `public/certificates/imported/Психосоматика.jpg` |
| 9 | `e0aa9f8b200d25628561676b430b81c91d1a44d2` | 1 391 668 | `public/certificates/imported/Диплом о переподготовке.jpg` |
| 10 | `ddad414dc74949ab385238e5292aac57affb8bf3` | 1 282 130 | `public/certificates/imported/cert-2.jpg` |
| 11 | `59bd514919a32671fe45eeacf58744864d60de26` | 1 000 502 | `public/sasha-about-2.jpg` |
| 12 | `f0c93c5a9c5d2aa7dd0f0565ef7878e5241ba4eb` | 953 916 | `public/luneva-alexandra-logo-transparent.png` |
| 13 | `c402cede07e5b6be7232ad73a98b7ca5c9f3bf45` | 942 536 | `public/luneva-alexandra-logo.png` |
| 14 | `4e182b67a40f4880ebd2d080c3227371e7779c1a` | 915 884 | `public/certificates/imported/cert-1.jpg` |
| 15 | `f4ac9267e9f7fc6396de717948259b22b1186d74` | 818 812 | `public/certificates/cert-1.jpg` |
| 16 | `5cfa9580258e0d9f2855cbecb6374870059de361` | 742 824 | `public/images/cta/consultation-cta-vase.png` |
| 17 | `e1105bcc1974b7d5e725d7197406aa2763c17370` | 563 942 | `public/certificates/imported/cert-4.jpg` |
| 18 | `b6ab474bbce1141a35e8999809723100feef5552` | 545 824 | `public/certificates/cert-4.jpg` |
| 19 | `802538be08b6a48f4168b1538ca35a3f69cb559f` | 503 583 | `public/certificates/imported/сертификат по рпп_page-0001.jpg` |
| 20 | `24e7b9ac844ff23e436c6561202a96cc31f3d040` | 501 824 | `public/certificates/imported/Лунева Александра Александровна2_page-0001.jpg` |

- Blobs более 50 MiB: 0.
- Blobs более 90 MiB: 0.
- Blobs более 100 MiB: 0.
- Исторические `node_modules`, `.next`, видео, крупные архивы, дампы и release-архивы среди блокирующих объектов не обнаружены.
- Ограничений GitHub по размеру отдельных файлов не выявлено; переписывание истории и Git LFS не требуются для этой отправки.

### Повторный push

- Перед стартом повторно подтверждены ожидаемые hashes, отсутствие `origin/production` и пустая staged-область.
- Запущен один процесс: `git push --progress --porcelain origin master:production`.
- Force-флаги не использовались.
- Процесс запущен через `Start-Process`, PID `12248`, с stdout/stderr во временных файлах `%TEMP%`.
- Продолжительность: около 15,14 секунды.
- Свойство ExitCode дочернего процесса оболочка не отобразила, однако управляющая команда завершилась с exit code `0`; stdout содержит `new branch` и `Done`, GitHub завершил resolving deltas `700/700`, а независимая проверка remote подтвердила результат.
- Временные очищенные диагностические логи удалены после чтения; секреты и credential headers не сохранялись в проекте.
- `origin/production` создана успешно.

### Проверка результата и upstream

- Local `master`: `45673cc78632caf3a09309085235af3aff321929`.
- `origin/production`: `45673cc78632caf3a09309085235af3aff321929`.
- Hashes полностью совпадают.
- `origin/main` после операции: `d4ba9ef32cffeee2034092c9dc620f3b45b5dc35`; ветка не изменялась.
- Upstream локальной `master`: `origin/production`.
- Ahead/behind относительно upstream: `0/0`.
- Заголовок статуса: `## master...origin/production`.
- Staged-файлов после операции: 0.
- Новый commit не создавался.

Контрольные SHA-256 после push и настройки upstream полностью совпадают с исходными:

- status: `34db9f1b99ae1e38ebd279c7eb7dd44f447c30cdeea3079bbaf41be3e72fc1f0`;
- binary diff: `72201c5178d4471d61f24259923f69bf2689e96e71dea2c013877c5065bea744`;
- untracked list: `41791876d53f365dac77337eede81885879f69b1d565f30f7be3bea918810200`.

Незакоммиченные изменения сохранены полностью. Рабочие исходники, `origin/main`, default branch GitHub и локальная история не изменялись. SSH/SCP/rsync, deploy, production VPS, PM2, nginx, PostgreSQL, DNS, env и база данных не затрагивались.

Причина предыдущего сбоя: внешний управляющий процесс завершил ожидание по таймауту через 184 секунды во время необычно долгого первого HTTPS-сеанса. Диагностика исключила скрытый prompt, отсутствие прав и ограничения размера: неинтерактивный dry-run успешен, pack составляет 35,25 MiB, а повторный HTTPS-push завершился штатно. Точный внешний сетевой участок, вызвавший разовую задержку, средствами Git после прерванного процесса восстановить невозможно.

После просмотра содержимого ветки владелец при необходимости может вручную изменить default branch: GitHub → `Settings` → `Branches` → `Default branch` → `production`. Автоматически default branch не менялась; `main` удалять не нужно.

Критических нерешённых проблем этого этапа нет.

Итоговый статус этапа: **GREEN — `origin/production` создана, hashes совпадают, upstream настроен, локальные незакоммиченные изменения и production сохранены.**
