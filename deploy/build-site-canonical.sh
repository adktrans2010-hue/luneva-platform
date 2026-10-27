#!/usr/bin/env bash
set -Eeuo pipefail

# Keep the browser-visible origin canonical without changing secret-bearing env
# files. exec avoids the npm/Node wrapper abort seen after Turbopack finalization
# on the production host.
export NEXT_PUBLIC_SITE_URL="https://luneva-psy.ru"
exec ./node_modules/.bin/next build --webpack
