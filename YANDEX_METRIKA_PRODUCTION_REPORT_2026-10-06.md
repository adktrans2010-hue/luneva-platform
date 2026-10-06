# Yandex Metrika production deployment — 2026-10-06

## Scope

- Production counter: `113474556`.
- Active release: `/var/www/releases/luneva-metrika-20261006T1225Z`.
- Public build variable: `NEXT_PUBLIC_YANDEX_METRIKA_ID=113474556`.
- Previous release and PM2 state backup: `/var/backups/luneva-metrika-20261006T1225Z`.
- No database migration, nginx change, booking/payment semantic change, AI, Telegram, or publisher change was performed.

## Implemented controls

- Analytics is disabled when the counter ID is absent and defaults to OFF until an explicit consent decision.
- The cookie dialog has explicit Accept and Reject actions; the footer exposes Cookie settings for later withdrawal.
- Withdrawal destroys the active counter and a rejected decision remains effective after reload.
- `/admin`, `/account`, and authentication routes do not load or initialize Metrika.
- Webvisor, click map, link tracking, and accurate bounce tracking are enabled after consent.
- Booking and review inputs are masked from session replay.
- Application page-view and goal payloads contain no names, email addresses, phone numbers, message text, client IDs, appointment IDs, or payment IDs.
- SPA page-view calls use pathname only. UTM attribution is retained separately by the existing first-party mechanism.

## Goals

`view_service`, `click_book`, `booking_started`, `slot_selected`, `booking_created`, `payment_started`, `payment_success`, `telegram_click`, and `help_bot_click` are allowlisted through the shared `trackGoal` helper.

`booking_created` is emitted only after appointment creation succeeds. `payment_started` is emitted only after payment creation succeeds. `payment_success` is rendered only from a backend-confirmed paid state and is deduplicated per browser session. No real YooKassa payment was made for analytics acceptance.

## Verification

- Cookie-consent targeted tests: PASS.
- Yandex Metrika/goal/privacy targeted tests: PASS.
- TypeScript: PASS.
- Scoped ESLint: PASS.
- `git diff --check`: PASS.
- Production build: PASS.
- Fresh browser context before consent: no Yandex requests, consent dialog visible.
- Reject and reload: no Yandex requests, decision preserved.
- Accept: tag loaded once, counter `113474556` initialized, Webvisor enabled.
- Withdraw and reload: counter inactive, rejected decision preserved.
- Private routes: counter inactive and tag absent.
- Public routes `/`, `/about`, `/certificates`, `/help`, and `/contacts`: HTTP 200.
- Nginx, PostgreSQL, and PM2 `luneva-platform`: healthy after activation.

Headless Chromium reported third-party CORS retry diagnostics from the Yandex collection endpoint; no first-party application exception was observed. The Metrika tag itself loaded with HTTP 200 and collection requests were initiated only after consent.

## Rollback

Restore the symlink recorded in `/var/backups/luneva-metrika-20261006T1225Z/previous_release`, reload only `luneva-platform`, and restore the saved PM2 state if required. No database rollback is needed.
