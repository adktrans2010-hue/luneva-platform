# Admin login canonical redirect recovery — 2026-10-07

## Production acceptance

- Active release: `/var/www/releases/luneva-login-canonical-20261007`.
- Build: `deploy/build-site-canonical.mjs`, using the active site's PM2 environment.
- Canonical build origin: `https://luneva-psy.ru`.
- Cause: old build env contained `https://luneva-osy.ru`; Next.js embedded it in `publicUrl`, despite the correct runtime environment.
- Bundle inspection: 2314 output files checked; zero occurrences of the wrong domain. Compiled login success and error redirects resolve to the canonical domain.
- Human acceptance confirmed; audit at 2026-10-07 09:58:08 UTC records successful authentication. Nginx: POST `/api/admin/login` 303, followed by GET `/admin` 200 at the same second.
- Frontend production tests: 2/2 passed. Build-origin tests: 5/5 passed. Existing MFA bootstrap contracts passed.
- Error page `/admin/login?error=totp`: HTTP 200, expected error text present. Invalid MFA format is blocked by frontend tests; no additional real invalid-code login was sent against the production account.
- Nginx, PostgreSQL, site PM2, API, both bots and publisher healthy.

## Scope and recovery

- Intended source: admin login page, client form, focused tests and canonical build wrapper.
- Backend auth, passwords, MFA secrets, roles, schema and other service configurations were not changed.
- Before this finalization, `DEPLOYED_GIT_HEAD` still described the previous committed base `c0d6f2c`; the pending frontend changes were already deployed. Final marker is set to the commit containing this report and those changes.
- Previous release: `/var/www/releases/luneva-admin-login-mfa-20261007T1000Z` (contains the old redirect defect; retained for emergency release rollback).
- Config/process baseline: `/root/luneva-login-canonical-backup-20261007/` (protected, kept outside Git).
- Build/verification helpers and logs are in that protected directory.
- Annotated recovery tag: `production-admin-login-canonical-20261007`.
- Portable recovery artifacts: `C:\Projects\_RECOVERY\luneva-login-canonical-20261007`.
- Rebuild future releases with the canonical wrapper. Do not rely on restarting PM2 to change an inlined `NEXT_PUBLIC_*` value.
