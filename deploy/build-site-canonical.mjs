import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

export const canonicalSiteOrigin = "https://luneva-psy.ru";

// NEXT_PUBLIC_* is baked into Next.js server/client bundles at build time.
// Override stale build-shell values without modifying credential-bearing env files.
export function buildSiteCanonical({ env = process.env, run = spawnSync } = {}) {
  const buildEnv = { ...env, NEXT_PUBLIC_SITE_URL: canonicalSiteOrigin };
  const result = run("bash", ["deploy/build-site-canonical.sh"], { env: buildEnv, stdio: "inherit" });
  if (result.error || result.signal || result.status !== 0) {
    throw new Error("Canonical site build failed; do not activate this release.");
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  let exitCode = 0;
  try {
    buildSiteCanonical();
  } catch {
    console.error("Canonical site build failed; active release must remain unchanged.");
    exitCode = 1;
  }

  // On the production host, ordinary Node shutdown after a completed
  // spawnSync build can abort even though Next itself exited successfully.
  // The build result is already checked above, so exit without running the
  // problematic parent-process teardown path.
  process.reallyExit(exitCode);
}
