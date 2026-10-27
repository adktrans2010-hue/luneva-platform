import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

export const canonicalSiteOrigin = "https://luneva-psy.ru";

// NEXT_PUBLIC_* is baked into Next.js server/client bundles at build time.
// Override stale build-shell values without modifying credential-bearing env files.
export function buildSiteCanonical({ env = process.env, run = spawnSync } = {}) {
  const buildEnv = { ...env, NEXT_PUBLIC_SITE_URL: canonicalSiteOrigin };
  // Do not inherit npm_execpath from a long-running PM2 process: on this host
  // that wrapper aborts after Next has completed its build. Invoke the project's
  // pinned Next CLI directly instead.
  const nextCli = join(process.cwd(), "node_modules", "next", "dist", "bin", "next");
  const result = run(process.execPath, [nextCli, "build", "--webpack"], { env: buildEnv, stdio: "inherit" });
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
