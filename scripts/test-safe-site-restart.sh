#!/usr/bin/env bash
set -Eeuo pipefail

repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
tmp_dir=$(mktemp -d)
trap 'rm -rf "$tmp_dir"' EXIT
mkdir -p "$tmp_dir/bin" "$tmp_dir/app"

printf '%s\n' 'DATABASE_URL=postgresql://site_user:site_secret@127.0.0.1/luneva_site' 'NODE_ENV=production' "CAPTURE_FILE=$tmp_dir/captured-db" >"$tmp_dir/site.env"
printf '%s\n' 'DATABASE_URL=postgresql+asyncpg://bot_user:bot_secret@127.0.0.1/alexandra_bot' >"$tmp_dir/bot.env"
cat >"$tmp_dir/bin/pm2" <<'EOF'
#!/usr/bin/env bash
python3 - "$DATABASE_URL" "$CAPTURE_FILE" <<'PY'
import sys
from urllib.parse import urlsplit
dsn = sys.argv[1].replace("postgresql+asyncpg://", "postgresql://", 1)
open(sys.argv[2], "w", encoding="utf-8").write(urlsplit(dsn).path.strip("/"))
PY
EOF
chmod +x "$tmp_dir/bin/pm2" "$repo_root/deploy/restart-site-safe.sh"

export DATABASE_URL=postgresql://bot_user:parent_secret@127.0.0.1/alexandra_bot
export PATH="$tmp_dir/bin:$PATH"
"$repo_root/deploy/restart-site-safe.sh" --site-env "$tmp_dir/site.env" --bot-env "$tmp_dir/bot.env" \
  --app-dir "$tmp_dir/app" --expected-site-db luneva_site
[[ $(cat "$tmp_dir/captured-db") == luneva_site ]]

if "$repo_root/deploy/restart-site-safe.sh" --site-env "$tmp_dir/bot.env" --bot-env "$tmp_dir/bot.env" \
  --app-dir "$tmp_dir/app" --expected-site-db luneva_site --check-only >/dev/null 2>&1; then
  echo "guard accepted a bot DATABASE_URL as the site database" >&2
  exit 1
fi
echo "safe site restart regression: PASS"
