# Guarded Telemost creation

Phase A adds code only. No existing appointments are backfilled.

Environment names: `YANDEX_TELEMOST_ENABLED` (default disabled; only exact `true`
enables calls), `YANDEX_TELEMOST_OAUTH_TOKEN`. Owner failure notifications use the
existing server-side Telegram transport. Never expose credentials or meeting URLs.

Apply only `drizzle/0040_telemost_auto.sql` before deploying this schema version.
It adds four nullable columns to `appointment_requests`; no defaults, row updates,
indexes, or destructive operations. Record the migration using the project's
migration ledger. Do not run recovery seeders. Keep the production flag false
until a separate approved synthetic smoke gate passes.

Creation runs after a committed new paid transition, a new scheduled package
booking, or an admin transition into confirmed/scheduled. Existing manual meeting
URLs are preserved. An authenticated admin can explicitly request creation/retry.
Office, unpaid-online, cancelled, expired and payment-conflict appointments are
excluded. The client continues through the authenticated T-30 join route.

The row lock commits a durable pending claim before the external request. Parallel
calls and duplicate webhooks cannot create a second meeting. A process crash,
network timeout, invalid successful response or uncertain persistence requires
manual reconciliation; pending/unknown outcomes are never automatically retried.
This is not provider-side exactly-once delivery: Yandex has no documented create
idempotency key. A known HTTP rejection permits an explicit admin retry. Verify
provider state before retrying a server error. Successful calls do not notify the
owner; failures send a safe date/time-only message. Payment and email remain
independent of Telemost outcome.

Rollback: disable the feature, revert the application code, and retain the nullable
columns and meeting metadata. Dropping the columns is unnecessary and would lose
reconciliation evidence; export affected metadata before any separately approved
schema removal. No payment or appointment business fields need rollback.

Local checks:

- `node scripts/test-telemost.cjs` uses only the hard-coded loopback disposable DB
  `gate50b_disposable`; external APIs and notifications are mocked. Apply 0040 to
  a production-compatible local baseline first. Synthetic rows are cleaned.
- `node scripts/test-consultation-access.cjs email`
- `node scripts/test-consultation-access.cjs admin`
- `node scripts/test-appointment-time.cjs`
- `npx tsc --noEmit`, scoped ESLint, `npx next build --webpack` with local DB.

Do not run the fixture against production or substitute production credentials.
