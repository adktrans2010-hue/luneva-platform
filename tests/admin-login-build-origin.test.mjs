import assert from "node:assert/strict";
import test from "node:test";
import { buildSiteCanonical, canonicalSiteOrigin } from "../deploy/build-site-canonical.mjs";

for (const staleOrigin of [undefined, "https://luneva-osy.ru", "http://localhost:3000"]) {
  test(`build replaces ${staleOrigin ?? "missing origin"} before Next.js inlining`, () => {
    const env = { NEXT_PUBLIC_SITE_URL: staleOrigin, NEXT_PUBLIC_YANDEX_METRIKA_ID: "test-counter" };
    const before = { ...env };
    let calls = 0;
    buildSiteCanonical({ env, run: (command, args, options) => {
      calls += 1;
      assert.equal(command, "npm");
      assert.deepEqual(args, ["run", "build"]);
      assert.equal(options.env.NEXT_PUBLIC_SITE_URL, canonicalSiteOrigin);
      assert.equal(options.env.NEXT_PUBLIC_YANDEX_METRIKA_ID, env.NEXT_PUBLIC_YANDEX_METRIKA_ID);
      for (const path of ["/admin", "/admin/appointments", "/admin/login?error=totp"]) {
        assert.equal(new URL(path, options.env.NEXT_PUBLIC_SITE_URL).origin, canonicalSiteOrigin);
      }
      return { status: 0 };
    } });
    assert.equal(calls, 1);
    assert.deepEqual(env, before);
  });
}

test("failed build is not reported as a deployable artifact", () => {
  assert.throws(() => buildSiteCanonical({ env: {}, run: () => ({ status: 1 }) }), /do not activate/);
});

test("signal or launch failure is not reported as a deployable artifact", () => {
  for (const result of [{ status: null, signal: "SIGTERM" }, { error: new Error("unavailable") }]) {
    assert.throws(() => buildSiteCanonical({ env: {}, run: () => result }), /do not activate/);
  }
});
