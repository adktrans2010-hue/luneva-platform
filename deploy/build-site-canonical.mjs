import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

export const canonicalSiteOrigin = "https://luneva-psy.ru";

// NEXT_PUBLIC_* is baked into Next.js server/client bundles at build time.
// Override stale build-shell values without modifying credential-bearing env files.
export function buildSiteCanonical({ env = process.env, run = spawnSync } = {}) {
  const buildEnv = { ...env, NEXT_PUBLIC_SITE_URL: canonicalSiteOrigin };
  const npmCli = env.npm_execpath;
  const result = npmCli
    ? run(process.execPath, [npmCli, "run", "build"], { env: buildEnv, stdio: "inherit" })
    : run("npm", ["run", "build"], { env: buildEnv, stdio: "inherit" });
  if (result.error || result.signal || result.status !== 0) {
    throw new Error("Canonical site build failed; do not activate this release.");
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    buildSiteCanonical();
  } catch {
    console.error("Canonical site build failed; active release must remain unchanged.");
    process.exitCode = 1;
  }
}
