# Luneva Platform — Railway disaster recovery runbook

Baseline documented: **2026-11-06, Europe/Moscow**. Scope: emergency public site,
clinical administration and isolated Telegram publisher. Booking/payment remain disabled.

## 1. Provenance and limits

Code, commands, paths and commits below were checked locally against site `f3efd51`
and publisher recovery `a6572ca`. Railway names, domains, DNS, token rotation and the
latest live queue checkpoint are **owner-supplied acceptance facts in the 2026-11-06
runbook specification**, not a live inspection performed while writing this document.
External orchestration must revalidate them before treating this as a current live baseline.
No secrets belong in this document. All commands below are future operator instructions,
not evidence that deployment, DB restore, DNS changes or publication were performed.

## 2. Service map

| Component | Project / environment | Service / source |
| --- | --- | --- |
| Site | `luneva-platform-recovery` / `production` | `web`; `adktrans2010-hue/luneva-platform`, branch `recovery/railway-emergency-20261105` |
| Site DB | same site project/environment | separate PostgreSQL service; actual service name must be checked in Railway |
| Publisher worker | `alexandra-publisher-recovery` / `production` | `alexandra-publisher` |
| Publisher read-only API | same publisher project/environment | `publisher-admin-api` |
| Publisher DB | same publisher project/environment | `Postgres`, separate from site DB |
| Publisher source | GitHub | `adktrans2010-hue/alexandra-bot-platform-recovery-20261105`, branch `main` |

Site domains: `https://luneva-psy.ru`, `https://www.luneva-psy.ru`.
Temporary site domain: `web-production-6f2a8.up.railway.app`.
Publisher API domain: `https://publisher-admin-api-production.up.railway.app`.

Browser → authenticated site BFF → publisher-admin-api → publisher DB.
Worker → same publisher DB → Telegram. Never move the publisher queue into site PostgreSQL.
Worker and API are distinct processes/services, not two commands in one container.

## 3. Site environment inventory

Names only; provision secrets through protected Railway variables/password manager:

- `DATABASE_URL`, `ADMIN_SESSION_SECRET`
- `SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_FROM`
- `NEXT_PUBLIC_SITE_URL`, `NODE_ENV`, `PORT`
- `EMERGENCY_BOOKING_DISABLED`, `EMERGENCY_PUBLIC_SEED`
- `PUBLISHER_ADMIN_API_URL`, `PUBLISHER_ADMIN_API_TOKEN`
- `RECOVERY_CLINICAL_ADMIN_BOOTSTRAP`, `RECOVERY_CLINICAL_ADMIN_EMAIL`
- `RECOVERY_CLINICAL_ADMIN_TEMP_PASSWORD`
- `RECOVERY_CLINICAL_ADMIN_ALLOW_ROLE_UPDATE` (only for explicitly approved existing-role conversion)
- `ADMIN_ACCEPTANCE_BASE_URL` (HTTPS login link required by email delivery mode)
- `NEXT_PUBLIC_YANDEX_METRIKA_ID` (optional public analytics configuration)

Steady state: bootstrap guard **false**; temporary password variable absent.
Emergency policy: `EMERGENCY_BOOKING_DISABLED=true`, `EMERGENCY_PUBLIC_SEED=true`.
Public canonical domain remains luneva-psy.ru, not the temporary Railway hostname.
No production secret values, credentials-bearing URLs or temporary passwords are recorded here.

## 4. Publisher environment inventory

Worker names confirmed in `apps/api/app/config.py` and `apps/api/app/publisher.py`:

- `DATABASE_URL`
- `TELEGRAM_BOT_TOKEN`
- **`TELEGRAM_PUBLIC_CHANNEL_ID`**, not `TELEGRAM_CHANNEL_ID`
- `TELEGRAM_CHANNEL_PUBLISHER_ENABLED`
- `TELEGRAM_CHANNEL_PUBLISHER_POLL_SECONDS`
- `TELEGRAM_CHANNEL_PUBLISHER_TIMEZONE`
- `CHANNEL_POST_MEDIA_DIR`
- `PUBLISHER_HEALTH_FILE`
- `LOG_LEVEL` (optional), `TZ` (optional process timezone; not the scheduling authority)

API names: `DATABASE_URL`, `PUBLISHER_ADMIN_API_TOKEN`, `PORT`.
API must use the publisher DB, not site DB; it needs no Telegram token.
Shared API token must be a strong random secret of **at least 32 characters**, identical
on the site and API. Store it only server-side; never use a NEXT_PUBLIC variable.

The worker's shared configuration expects an asyncpg SQLAlchemy URL; inject the protected
connection reference in the correct driver format without displaying its value.
The standalone API accepts ordinary PostgreSQL URLs and normalizes the driver itself.

## 5. DNS / Cloudflare

Owner-reported authoritative nameservers:
`elle.ns.cloudflare.com`, `piotr.ns.cloudflare.com`.

- Root `luneva-psy.ru` → Railway web custom domain; DNS only.
- `www.luneva-psy.ru` → Railway web custom domain; DNS only.
- Use Railway's current custom-domain target/verification instructions, not a guessed or
  historical CNAME target. Recheck live delegation, DNS resolution and TLS after approval.
- **Do not change mail MX/TXT/DKIM/SPF/DMARC records during website cutover.**
- This runbook does not authorize DNS edits.

## 6. Site build, public seed and articles

From the site repository root (Node/npm versions compatible with its lockfile):

```sh
npm ci
npm run db:migrate
npm run db:seed:emergency-public
npm run build
npm run start
```

`next start` consumes Railway `PORT`; no PM2/VPS paths are required.
Current `railway.toml` build command is migration → emergency-public seed → build.
Current preDeployCommand array runs, in order:

```sh
npm run db:migrate
npm run db:seed:emergency-public
npm run db:seed:articles:recovery
npm run db:restore:article-statuses
```

Build-time prerender reads PostgreSQL; migrations must finish before build. Confirm actual
Railway logs include all four predeploy scripts and that the build has DB connectivity.
Public seed guards require both emergency flags above; it only upserts public consultation
products, not users, clients, appointments, payments or publisher records.

Article canonical data: `data/recovery/articles/articles_manifest.json`,
`data/recovery/articles/articles_markdown/`, `articles-seo.json`,
`published-statuses.json`, `published-status-evidence.json` (all under that data directory).
Expected recovered article rows: **26**. Jane Doe remains `/blog/ya-dzheyn-dou`.
Only confirmed publication evidence is applied; do not publish unknown articles wholesale.

Offline validations (no DB writes):

```sh
npm run db:seed:articles:recovery -- --dry-run
npm run test:articles:recovery
npm run test:articles:status-recovery
```

Live read-only article validation, using an approved SQL console without exporting content:

```sql
SELECT count(*) AS total,
       count(*) FILTER (WHERE published) AS published,
       count(*) FILTER (WHERE NOT published) AS draft
FROM articles;
SELECT slug, published FROM articles ORDER BY slug;
```

Do not treat a historical expected published count as current live truth. Confirm totals,
listing and Jane Doe HTTP 200/canonical against the restored DB. Seeds upsert content and
statuses, so back up later editorial work before rerunning them on a non-fresh DB.

## 7. Clinical admin recovery

Identity: `luneva.shura@yandex.ru`, role `clinical_admin`. Do not create another administrator
or elevate an ordinary admin as an incidental recovery action.
Mechanism: `scripts/bootstrap-clinical-admin-recovery.ts` and
`scripts/clinical-admin-recovery-bootstrap.ts`.

```sh
npm run admin:bootstrap:clinical-recovery -- --dry-run
npm run admin:bootstrap:clinical-recovery
```

Before the one-time command, set the guarded recovery variables through a protected UI:
bootstrap guard true, intended email, and preferred temporary password variable.
Temporary password minimum: **16 characters**. Never put its value on a shell command line,
in logs, screenshots, chat, Git or this document. With this variable supplied SMTP is skipped;
only the normal password hash is stored. Existing clinical admin is idempotently left unchanged.
Changing an existing non-clinical role still needs its separate ALLOW_ROLE_UPDATE guard.

New-account flags: `must_change_password=true`, `totp_enabled=false`,
`role=clinical_admin`, `is_active=true`. MFA is not globally disabled.
First login: `/admin/login` → `/admin/password` → `/admin/mfa-enroll` → `/admin/ai/knowledge`.

After successful login: change temporary password, complete MFA, remove temporary password
env and return bootstrap guard to false. Keep the ordinary login/MFA workflow intact.
Without env-password mode, bootstrap uses SMTP and removes the new account on delivery failure.
Owner reported Railway → smtp.yandex.ru TCP timeouts on 465 and 587; SMTP authentication
was not reached. SMTP is therefore not a guaranteed recovery delivery path.

## 8. Admin schema checkpoint

Required migrations in `drizzle/meta/_journal.json`:
`0035_multi_admin_accounts`, `0036_admin_mfa_enrollment`.
Past failure: migration journal ended at 0034 although application code selected newer fields.
Restoring journal entries, not ad-hoc ALTER TABLE, fixed the mismatch.

Expected `admin_settings`: `role`, `is_active`, `must_change_password`, `totp_secret`,
`totp_enabled`. Legacy defaults: role `admin`, active true, must-change-password false.
Use `npm run db:migrate`; do not edit production schema manually or infer completion solely
from an exit code. Check journal/schema and bootstrap logs. Never SELECT password hashes/TOTP
secrets for a report.

## 9. Publisher dataset and schedule

Publisher-repository paths:
`content/recovery/telegram-series-2026-11/` with manifest, state, schedule, texts and media.
Importer: `scripts/restore_publisher_series_2026_11.py`.
Verifier: `scripts/verify_publisher_series_2026_11.py`.
Stable keys: `recovery:telegram-series-2026-11:01` through `:20`.

Canonical schedule: Wednesday / Friday / Sunday, **11:00 Europe/Moscow**.

| Post | Date | Post | Date |
| --- | --- | --- | --- |
| 1 | 01.11.2026 | 11 | 25.11.2026 |
| 2 | 04.11.2026 | 12 | 27.11.2026 |
| 3 | 06.11.2026 | 13 | 29.11.2026 |
| 4 | 08.11.2026 | 14 | 02.12.2026 |
| 5 | 11.11.2026 | 15 | 04.12.2026 |
| 6 | 13.11.2026 | 16 | 06.12.2026 |
| 7 | 15.11.2026 | 17 | 09.12.2026 |
| 8 | 18.11.2026 | 18 | 11.12.2026 |
| 9 | 20.11.2026 | 19 | 13.12.2026 |
| 10 | 22.11.2026 | 20 | 16.12.2026 |

10 PNG files: posts 1,3,5,7,9,11,13,15,17,19 only. Container media directory:
`/app/content/recovery/telegram-series-2026-11/media`.

## 10. Publication checkpoint versus saved dataset — critical

Owner-confirmed live acceptance checkpoint supplied for this runbook:

- Post 1: published 01.11.2026, Telegram message ID 322.
- Post 2: manually published 05.11.2026 20:28 MSK; message ID unknown/null.
- Post 3: published automatically after Railway recovery; exact ID/time not supplied.
- Latest supplied queue: published 3, approved/unpublished 17, past_due 0.
- Next: `recovery:telegram-series-2026-11:04`, 08.11.2026 11:00 MSK.

This is a dated checkpoint, not a permanent assertion; the automatic worker advances it.
**The committed recovery-state.json and verifier still encode the earlier baseline:
published 1, draft/manual 1, approved 18.** They do not prove the later live state.
The verifier will correctly reject the later state according to its older contract; do not
change live rows to make that verifier green.

Importer is for an isolated fresh DB, not continuous deployment. It refuses to overwrite an
already-published post after post 1 and otherwise writes content/schedule/status and clears locks.
Do not rerun it against the working queue. On a fresh restore it would recreate post 3 as approved:
**do not enable the worker until later publication history is restored/reconciled**, or post 3
could be sent again. Post 2's manual publication must also be preserved without inventing an ID.
Prefer a current protected publisher DB backup. If absent, stop for an explicitly approved
reconciliation from the documented checkpoint plus channel/worker evidence. No automatic status
patch is supplied here; unknown post 3 metadata remains unknown.

## 11. Publisher runtime recovery commands

Use `Dockerfile.publisher-recovery` from repository root; it includes API code, importer and
recovery media. Worker entrypoint: `python -m app.publisher`, Python 3.12; dependencies:
`apps/api/requirements.txt`. Never launch two enabled workers on old and new platforms.

For a fresh isolated DB only, with worker disabled and protected DB reference configured:

```sh
cd /app/apps/api
alembic upgrade head
cd /app
PYTHONPATH=/app/apps/api python scripts/restore_publisher_series_2026_11.py --dry-run
PYTHONPATH=/app/apps/api python scripts/restore_publisher_series_2026_11.py
PYTHONPATH=/app/apps/api python scripts/verify_publisher_series_2026_11.py
```

Alembic source: `apps/api/alembic/`, `apps/api/alembic.ini`. Do not use this chain on site DB.
The final command validates only the initial historical dataset (see section 10), not the
current live publication history. Resolve that difference before enabling any restored worker.
With publisher disabled, worker writes its health marker but does not call Telegram or recover
DB locks. After explicit approval, enable only one worker with verified queue, media and current
credentials. Health marker alone does not prove a successful channel publication.

## 12. Publishing bot and cutover boundary

Owner-confirmed publisher bot: `@luneva_psy_bot`, bot ID `8780396334`;
channel `@aleksandrapsy`. CTA bot `@alexandra_ai_test_bot` is a different bot.
Owner reports old publishing token was rotated after cutover to prevent the old Beget worker
from publishing accidentally. Never restore an old token from a historical env backup.
Provision current credentials securely and confirm channel administrator rights through an
approved operational check. No token values or Telegram calls are part of this runbook change.

## 13. Read-only publisher API and site integration

Separate `publisher-admin-api` service: `Dockerfile.publisher-admin`, command
`python -m app.publisher_admin_api`. No migration/importer/predeploy worker command needed.
`GET /internal/admin/channel-posts` reads `scheduled_channel_posts` via direct SELECT,
with PostgreSQL connections configured read-only. **No SQL VIEW is required.**
Auth header: `X-Publisher-Admin-Token`.

Error meanings at `a6572ca`:

- 503 `Publisher view is not configured`: API token absent or shorter than 32 characters;
  occurs before token comparison and before any DB access. Presence alone is insufficient.
- 401 `Unauthorized`: configured token exists but supplied header does not match.
- 503 `Publisher view unavailable`: DB/read/serialization failure (generic safe response).

Endpoint returns queue plus total/published/scheduled/overdue/next summary; approved includes
both future and overdue posts. Next means earliest future approved post. Queue view limit 1000;
larger queues fail closed rather than silently truncate. No mutation methods exist.

Site: `/admin/telegram`, navigation Контент → Telegram. Roles admin and clinical_admin.
Server proxy: `app/api/admin/telegram/route.ts`; browser sees neither token nor DB connection.
UI dates are Moscow time. No editing, retries, uploads, publish-now, deletion or schedule changes.

Private networking is scoped to the same Railway project/environment. For the current separate
projects use HTTPS API origin + shared secret, with private API→publisher-DB connection.
If services are later colocated under separate authorization, private HTTP is supported.
Reference: https://docs.railway.com/networking/private-networking/how-it-works
See publisher repo `PUBLISHER_ADMIN_API.md`; site `deploy/publisher-admin.env.example`.
Keep worker deployment pinned/automatic deployment controlled when deploying API-only changes.

## 14. Booking/payment safety

Keep `EMERGENCY_BOOKING_DISABLED=true`. Do not enable booking or YooKassa automatically.
An old July 2026 dump is not current production booking/payment state. A fresh public-render
DB is not a restored customer ledger. Never reconstruct clients/payments from guesses.
Before re-enable, separately confirm Alexandra's current schedule, availability, appointments,
credentials, payment callbacks and controlled end-to-end acceptance. Public seed prices do not
constitute confirmation that real scheduling/payment is safe. Do not change AI or publisher
credentials to address a booking issue.

## 15. Recovery order and stop gates

1. **DNS/web preparation:** obtain repositories and verified commit IDs; create isolated web
   target and inventory domains. Do not redirect public DNS to an unverified fresh deployment.
2. **Site PostgreSQL:** separate site DB, current protected backup if available; otherwise public-only DB.
3. **Site migrations:** execute canonical journal chain, inspect admin fields; never publisher migrations.
4. **Public seed:** emergency flags enabled, then render/build public site.
5. **Articles:** restore canonical assets/status evidence; validate rows, blog, Jane Doe and canonical URLs.
6. **Admin:** guarded one-time bootstrap, password change and MFA, remove temp env and disable guard.
7. **Publisher PostgreSQL:** restore current isolated publisher backup or create a fresh isolated DB.
8. **Publisher dataset/history:** fresh import only if needed; reconcile later publication checkpoint;
   **STOP if prior publications cannot be distinguished from unsent posts**.
9. **Worker:** verify media, old-worker fencing/token rotation and schedule; explicitly enable one worker.
10. **Publisher admin API:** deploy separate read-only service with correct DB reference/token.
11. **Site Telegram integration:** server URL/token, authenticated admin access, Russian labels/Moscow dates.
12. **Acceptance:** complete checklist; only after public target/TLS acceptance perform any separately
    authorized DNS cutover, preserving mail DNS. Record timestamp and exact deployed commits.

## 16. Acceptance checklist (not marked complete by this document)

Site:
- [ ] Root HTTP 200, www works, TLS valid.
- [ ] `/rpp`, child routes, `/contacts`, `/blog`, Jane Doe open; canonical content present.
- [ ] Article count/status read-only validation matches intended restore.
- [ ] Admin login, clinical role, password change and MFA work.

Publisher:
- [ ] Worker deployment SUCCESS, enabled only after publication-history reconciliation.
- [ ] Queue count expected, past_due 0 or investigated; next post/date correct for inspection time.
- [ ] Media mapping/count intact; publishing bot is channel administrator.
- [ ] No duplicate enabled old worker; current credentials are used.
- [ ] Automatic scheduled publication confirmed by existing delivery evidence, not a test publish-now.

Admin Telegram:
- [ ] API service SUCCESS; unauthenticated 401 with valid server config, authenticated 200.
- [ ] `/admin/telegram` available to both allowed roles, unauthorized users blocked.
- [ ] 20 series posts shown; summary matches current publisher DB; Moscow dates correct.
- [ ] Browser/network payload contains no service token; unavailable API is handled safely.

Safety:
- [ ] Booking and YooKassa remain disabled.
- [ ] Bootstrap guard false; no unnecessary temp-password env remains.
- [ ] No secrets committed or exposed in logs; no production data copied into test fixtures.

## 17. Backup and restore policy

Outside Railway retain Git repositories/recovery refs, migration history, article canonical
Markdown/manifests, Telegram recovery dataset and PNG media, and this runbook.
Also retain **current encrypted DB backups** separately for site and publisher, including evolving
publication history, and a protected secret inventory. Git content cannot replace either DB's
current operational state. Record backup date, SHA256, source identity and restore validation.
Periodically test restores in fresh isolated databases with no real external delivery.

Never put API/Telegram tokens, SMTP/DB passwords, ADMIN_SESSION_SECRET, temporary admin passwords,
credential URLs, raw customer exports, private keys or DB dumps in Git.
Rollback means a known compatible code version plus verified database state; do not blindly
roll back publication status or restore an old queue while the worker is enabled.

## 18. Critical Git commits

Site repository:

| Commit | Purpose |
| --- | --- |
| af771e5 | Canonical article restore seed |
| ffc3dc5 | Article seed in Railway predeploy |
| 2fbcae9 | Confirmed published article evidence |
| eb02650 | Ensure article status restore predeploy |
| 805de47 | Canonical Jane Doe article |
| 0ab66d25 | Register clinical-admin schema migrations |
| 06bc7c7 | Safe bootstrap diagnostics |
| 649eb76 | Secure env-password bootstrap without SMTP |
| f3efd51 | Read-only Telegram queue in site admin |

Temporary publisher repository:

| Commit | Purpose |
| --- | --- |
| 7155d51 | Harden Telegram media delivery |
| a66754f1 | November publisher recovery series |
| 4c553777 | Railway publisher recovery image |
| 3ae77adf | Historical dataset verifier |
| a6572ca | Isolated read-only publisher admin API |

Verify full commit identities with `git rev-parse`/`git show` in the corresponding repository.
These are source milestones, not a claim that every service currently runs branch HEAD.
No deploy, DNS update, worker restart, data mutation or credential change was performed to
produce this runbook. External orchestration reviews it against live Railway state and records
the next dated, verified baseline.
