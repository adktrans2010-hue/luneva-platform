# Consultation access — local validation and migration plan

## Scope

`appointment_requests` owns four new nullable fields. `0039_consultation_access.sql`
adds only `meeting_url` (text), `meeting_available_from` (timestamp without time zone),
`office_address` (text), and `office_map_url` (text). No defaults, indexes, backfill,
payment mutations, schedule changes, AI or publisher changes.

The timestamp convention remains the existing application's UTC convention.
Admin date input is explicitly Moscow time; the API requires a timezone-bearing
timestamp. Office Moscow defaults come from the existing location helper.
Vidnoye has no invented address.

Join page and redirect require the current user to own the appointment. The direct
Telemost URL is never included in the client-facing card or email. `/join/go`
rechecks ownership, status, URL and the window, with private/no-store caching.
Duration comes from payment snapshot, then package snapshot, then the appointment's
product. Missing duration fails closed. Window: scheduled time minus 30 minutes
(or explicit admin override) through scheduled time plus duration plus 120 minutes.

Admin save writes sanitized history and an in-app notification for a linked paid
client when the meeting URL changes. Saving never sends email. Sending is a separate
explicit admin action. Invitation completion redirects to the invitation's own
appointment, never a caller-provided appointment ID.

## Local verification (48R1)

Disposable PostgreSQL 18: `127.0.0.1:55447/gate48_current_disposable`.
Schema only from the final recovery snapshot dated 2026-11-17; no client rows copied.
Only migration-history metadata was restored; its sequence was reset to max(id)
locally because a table-only data restore does not restore the sequence position.
The synthetic baseline appointment was preserved across the migration.

The source/snapshot migration history ends at 0036, while the snapshot already
contains the 0038 expiry function and booking idempotency fields. This pre-existing
history/schema difference was not repaired by this task. The dry-run used an isolated
Drizzle migration directory containing only 0039. Production must not blindly rerun
older SQL files outside that history.

Migration inspection verified all four fields nullable with no defaults; all previous
columns, indexes and constraints unchanged; original row content unchanged; table
relfilenodes unchanged (no table rewrite observed). Repeat Drizzle migrate skipped
the recorded migration: identical schema/history and no duplicate columns.

Run each test separately from the repository root:

```text
node scripts/test-consultation-access.cjs db
node scripts/test-consultation-access.cjs email
node scripts/test-consultation-access.cjs account
node scripts/test-consultation-access.cjs admin
```

The runner sets a fixed loopback-only disposable DATABASE_URL; DB modes also check
the connected database and host. Tests use actual ORM queries, handlers and rendered
server components. Session identity and outbound email are test doubles; the unrelated
client notifications widget is excluded from account server rendering. Admin controls
are rendered statically; persistence/history/auth guards are exercised through handlers.
This is not a browser interaction or live delivery acceptance test. Fixture rows are
removed in finally blocks. No YooKassa, Telegram or SMTP/Postmark request is made.

Coverage: no link, T-31/T-30, expiry boundary, cancellation, wrong user, anonymous login,
validated redirect, hidden direct URL, office fallback, HTTPS map validation, sanitized
history, no send on save, explicit send, new/existing invite identity and sequential replay,
email fields and CTA, nearest appointment and cancelled exclusion.

## Controlled production gate — NOT executed

1. Capture and validate a fresh production checkpoint, including appointments and
   migration history. Confirm the intended site DB, baseline counts and effective
   no-op predeploy. Preserve existing backups.
2. Apply only 0039 using a scoped Drizzle migration directory and the normal migration
   history table. Review the actual history first. Do not run seeders or unrelated SQL.
3. Verify column contracts and unchanged business rows before deploying only web.
4. Perform owner-only join/admin acceptance and site smoke. Do not send live email
   without a separate explicit test action; Postmark account approval is still pending.

## Rollback/down plan

Preferred operational rollback: redeploy the previous application commit and retain
the nullable columns. Old code ignores them; no information is lost. No automatic down
migration is provided.

If schema removal is explicitly approved before any access data is entered: verify all
four fields are NULL, export the table/checkpoint, then drop only these four columns in
a transaction and remove only this migration's exact history hash. If any values exist,
stop and export/review them first; never silently drop saved meeting or address data.
This destructive down path was documented, not executed. Unrelated schema and history
must remain untouched.
