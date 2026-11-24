# Admin Panel Fixes - 2026-11-24

## Baseline

- Site branch/commit before changes: `feat/contacts-real-maps-57a-20261119` / `6ff10e0`.
- Publisher branch/commit before changes: `feat/telegram-client-parity-54-20261119` / `71ebdfe`.
- No production database rows, Telegram messages, payments, Direct campaigns, or scheduled campaign records were changed.

## Causes and fixes

1. Articles exposed `created_at` in the API and used it for public ordering, but the admin form had no editor for it. The form and protected article API now use that canonical field as the publication date; no duplicate column or migration was introduced. The public article also displays the selected Moscow date.
2. The channel publisher rendered only `body` before adding its CTA. It now composes `title`, a blank line, and `body` exactly once for text, caption, and preview rendering. Existing CTA text links and the lack of an inline keyboard are preserved.
3. Payments linked to an appointments-page fragment rather than a route. A protected, read-only `/admin/payments` page and API now list existing YooKassa payment data without confirmation URLs or provider secrets.
4. Advertising and funnel navigation already pointed to query-string tabs, but the target page ignored them and only accepted two analytics events. The page now handles its tabs and 1/7/30-day periods; consent-gated existing funnel goals are retained as first-party events. Historic missing events remain zero rather than being inferred. UTM campaign values are not displayed because this schema does not persist them.

## Changed files

- Site: admin article form/API/date helper; public article date; payments route/page/API; analytics tabs, funnel queries, event allowlist; sidebar route and targeted tests.
- Publisher API: canonical title/body composition and payload regression tests.

## Tests

- Site typecheck: PASS.
- Site lint: PASS.
- Site navigation/content targeted tests: PASS.
- Site production build with `LOCAL_BUILD_NO_DB=1`: PASS. A normal local build cannot use production DB credentials and is intentionally not attempted against production.
- Publisher channel-post tests: `18 passed, 4 skipped`.
- Publisher ruff: PASS.

## Deployment and validation

- Database migration: NO.
- Real Telegram posts sent: NO.
- Real payments performed: NO.
- Yandex Direct changed: NO.
- Railway CLI authentication is unavailable in this Codex process, so its deployment status must be verified from GitHub/Railway deployment output and public/admin checks after the commits are pushed.

## Remaining production checks

- Verify the Railway deployment for both commits.
- In the protected admin UI, create/edit a non-published test article and confirm its date persists; then remove it.
- Confirm payment list and analytics tabs load for an authorized admin. No real payment or Telegram send is needed.
