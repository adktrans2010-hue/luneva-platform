#!/usr/bin/env bash
set -Eeuo pipefail

usage() {
  echo "Usage: $0 --site-env PATH --bot-env PATH --app-dir PATH --expected-site-db NAME [--expected-site-host HOST] [--pm2-app NAME] [--check-only]" >&2
  exit 64
}

site_env=""; bot_env=""; app_dir=""; expected_site_db=""; expected_site_host=""
pm2_app="luneva-platform"; check_only=false
while (($#)); do
  case "$1" in
    --site-env) site_env=${2:-}; shift 2 ;;
    --bot-env) bot_env=${2:-}; shift 2 ;;
    --app-dir) app_dir=${2:-}; shift 2 ;;
    --expected-site-db) expected_site_db=${2:-}; shift 2 ;;
    --expected-site-host) expected_site_host=${2:-}; shift 2 ;;
    --pm2-app) pm2_app=${2:-}; shift 2 ;;
    --check-only) check_only=true; shift ;;
    *) usage ;;
  esac
done
[[ -n "$site_env" && -f "$site_env" ]] || usage
[[ -n "$bot_env" && -f "$bot_env" ]] || usage
[[ -n "$app_dir" && -d "$app_dir" ]] || usage
[[ -n "$expected_site_db" ]] || usage

identity_from_env() {
  local env_file=$1
  env -i PATH="$PATH" HOME="${HOME:-/root}" ENV_FILE="$env_file" python3 - <<'PY'
import os
import shlex
from pathlib import Path
from urllib.parse import urlsplit

values = {}
for raw in Path(os.environ["ENV_FILE"]).read_text(encoding="utf-8").splitlines():
    line = raw.strip()
    if not line or line.startswith("#") or "=" not in line:
        continue
    key, value = line.split("=", 1)
    try:
        parsed = shlex.split(value, posix=True)
        values[key.removeprefix("export ").strip()] = parsed[0] if parsed else ""
    except ValueError:
        raise SystemExit(f"invalid env syntax for {key.strip()}")
dsn = values.get("DATABASE_URL", "")
if not dsn:
    raise SystemExit("DATABASE_URL is missing")
parts = urlsplit(dsn.replace("postgresql+asyncpg://", "postgresql://", 1))
if not parts.hostname or not parts.path.strip("/"):
    raise SystemExit("DATABASE_URL identity is incomplete")
print(f"{parts.hostname}\t{parts.path.strip('/')}\t{parts.username or ''}")
PY
}

IFS=$'\t' read -r site_host site_db site_user < <(identity_from_env "$site_env")
IFS=$'\t' read -r bot_host bot_db bot_user < <(identity_from_env "$bot_env")
[[ "$site_db" == "$expected_site_db" ]] || { echo "ABORT: site DB name does not match the approved identity" >&2; exit 70; }
[[ -z "$expected_site_host" || "$site_host" == "$expected_site_host" ]] || { echo "ABORT: site DB host does not match the approved identity" >&2; exit 70; }
[[ "$site_host/$site_db" != "$bot_host/$bot_db" ]] || { echo "ABORT: site and bot resolve to the same database" >&2; exit 70; }
[[ "${site_db,,}" != *alexandra_bot* && "${site_db,,}" != *alexandra-bot* ]] || { echo "ABORT: bot database identifier detected in site DATABASE_URL" >&2; exit 70; }

printf 'site DB: host=%s db=%s user=%s source=%s\n' "$site_host" "$site_db" "${site_user:0:2}***" "$site_env"
printf 'bot DB: host=%s db=%s user=%s source=%s\n' "$bot_host" "$bot_db" "${bot_user:0:2}***" "$bot_env"
echo "environment isolation guard: PASS"
$check_only && exit 0

exec env -i PATH="$PATH" HOME="${HOME:-/root}" PM2_HOME="${PM2_HOME:-${HOME:-/root}/.pm2}" \
  SITE_ENV="$site_env" APP_DIR="$app_dir" PM2_APP="$pm2_app" \
  bash -Eeuo pipefail -c '
    set -a
    source "$SITE_ENV"
    set +a
    cd "$APP_DIR"
    exec pm2 restart "$PM2_APP" --update-env
  '
