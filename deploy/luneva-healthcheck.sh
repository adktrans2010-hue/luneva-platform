#!/usr/bin/env bash
set -euo pipefail

STATUS="$(pm2 jlist | node -e 'let s="";process.stdin.on("data",d=>s+=d);process.stdin.on("end",()=>{const p=JSON.parse(s).find(x=>x.name==="luneva-platform"); console.log(p?.pm2_env?.status || "missing")})')"

if [ "$STATUS" != "online" ]; then
  cd /var/www/luneva-platform
  pm2 start luneva-platform || pm2 start npm --name luneva-platform -- start
  pm2 save
fi
