import assert from "node:assert/strict";
import nodeModule from "node:module";
import { readFile } from "node:fs/promises";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextRequest } from "next/server";
import { getVisibleAdminNavigation } from "../src/lib/admin-navigation";
import { publisherDate } from "../src/lib/publisher-admin-contract";
import { TelegramQueueView, TelegramQueue } from "../components/admin/telegram-queue";

async function main() {
  // Node 24 runtime API; this project's older @types/node does not declare it yet.
  type Resolve = (specifier: string, context: unknown) => { url: string; shortCircuit?: boolean };
  type Load = (url: string, context: unknown) => { format?: string; source?: string | ArrayBufferView; shortCircuit?: boolean };
  const { registerHooks } = nodeModule as typeof nodeModule & { registerHooks: (hooks: {
    resolve: (specifier: string, context: unknown, next: Resolve) => ReturnType<Resolve>;
    load: (url: string, context: unknown, next: Load) => ReturnType<Load>;
  }) => { deregister(): void } };
  const state = globalThis as unknown as { publisherTestRole?: string };
  const hooks = registerHooks({ resolve(specifier, context, next) {
    if (specifier === "server-only") return { url: "data:text/javascript,module.exports={}", shortCircuit: true };
    if (specifier === "@/src/lib/admin-auth") return { url: "data:text/javascript," + encodeURIComponent(`
      exports.ADMIN_COOKIE_NAME = 'test';
      exports.authorizeAdminSession = async (token, roles) => {
        const role = globalThis.publisherTestRole;
        return !role ? { authorized:false,reason:'unauthenticated' } : roles.includes(role)
          ? {authorized:true,session:{role}} : {authorized:false,reason:'forbidden'};
      };`), shortCircuit: true };
    return next(specifier, context);
  }, load(url, context, next) {
    if (url.startsWith("data:text/javascript,")) return { format: "commonjs", source: decodeURIComponent(url.slice("data:text/javascript,".length)), shortCircuit: true };
    return next(url, context);
  } });
  const { readPublisherQueue } = await import("../src/lib/publisher-admin-server");
  const { GET } = await import("../app/api/admin/telegram/route");
  const originalFetch = globalThis.fetch;
  const oldUrl = process.env.PUBLISHER_ADMIN_API_URL;
  const oldToken = process.env.PUBLISHER_ADMIN_API_TOKEN;
  const token = "synthetic-publisher-token-for-tests-only";
  const post = { sequence: 3, source: "recovery:telegram-series-2026-11:03", title: "Тестовый пост", excerpt: "Текст",
    status: "approved" as const, scheduled_at: "2026-11-06T08:00:00+00:00", published_at: null, telegram_message_id: null, media: true };
  const payload = { posts: [post], summary: { total: 1, published: 0, scheduled: 1, overdue: 0, next: post } };
  let calls = 0;
  try {
    process.env.PUBLISHER_ADMIN_API_URL = "https://publisher.example.test";
    process.env.PUBLISHER_ADMIN_API_TOKEN = token;
    globalThis.fetch = async (url, options) => {
      calls++;
      assert.equal(String(url), "https://publisher.example.test/internal/admin/channel-posts");
      assert.equal(new Headers(options?.headers).get("X-Publisher-Admin-Token"), token);
      assert.equal(options?.method, "GET"); assert.equal(options?.redirect, "error");
      return Response.json({ ...payload, extra_private_config: "must-be-stripped" });
    };
    for (const [role, status] of [[undefined, 401], ["editor", 403], ["assistant", 403]] as const) {
      state.publisherTestRole = role;
      assert.equal((await GET(new NextRequest("https://site.test/api/admin/telegram"))).status, status);
    }
    assert.equal(calls, 0);
    for (const role of ["admin", "clinical_admin"]) {
      state.publisherTestRole = role;
      const response = await GET(new NextRequest("https://site.test/api/admin/telegram"));
      assert.equal(response.status, 200);
      const body = await response.text();
      assert.ok(!body.includes(token)); assert.ok(!body.includes("must-be-stripped"));
    }
    for (const role of ["admin", "clinical_admin"] as const) assert.ok(getVisibleAdminNavigation(role).some(group => group.label === "Контент" && group.items.some(item => item.href === "/admin/telegram")));
    assert.equal(publisherDate(post.scheduled_at), "06.11.2026 11:00 МСК");
    const html = renderToStaticMarkup(<TelegramQueueView queue={payload} />);
    for (const expected of ["Следующая публикация", "Опубликовано", "Запланирован", "06.11.2026 11:00 МСК", "Есть", post.source]) assert.ok(html.includes(expected));
    assert.ok(renderToStaticMarkup(<TelegramQueueView queue={{ posts: [], summary: { total: 0, published: 0, scheduled: 0, overdue: 0, next: null } }} />).includes("Очередь публикаций пуста"));
    assert.ok(renderToStaticMarkup(<TelegramQueue />).includes("Загрузка публикаций"));
    assert.deepEqual(await readPublisherQueue(async () => { throw new Error(token); }), { state: "unavailable" });
    assert.deepEqual(await readPublisherQueue(async () => new Response(token, { status: 500 })), { state: "unavailable" });
    assert.deepEqual(await readPublisherQueue(async () => Response.json({ ...payload, secret: token })), { state: "unavailable" });
    assert.deepEqual(await readPublisherQueue(async () => Response.json({ invalid: true })), { state: "unavailable" });
    delete process.env.PUBLISHER_ADMIN_API_TOKEN;
    assert.deepEqual(await readPublisherQueue(), { state: "not-configured" });
    const page = await readFile("app/admin/telegram/page.tsx", "utf8");
    assert.ok(page.includes("if (!auth.authorized) redirect"));
    const ui = await readFile("components/admin/telegram-queue.tsx", "utf8");
    assert.ok(ui.includes("Publisher пока недоступен"));
    assert.ok(!ui.includes("PUBLISHER_ADMIN_API_TOKEN"));
    console.log("Publisher admin: navigation/RBAC, protected GET, safe proxy/failure, empty/summary rendering, Moscow dates: PASS");
  } finally {
    globalThis.fetch = originalFetch; hooks.deregister(); delete state.publisherTestRole;
    if (oldUrl === undefined) delete process.env.PUBLISHER_ADMIN_API_URL; else process.env.PUBLISHER_ADMIN_API_URL = oldUrl;
    if (oldToken === undefined) delete process.env.PUBLISHER_ADMIN_API_TOKEN; else process.env.PUBLISHER_ADMIN_API_TOKEN = oldToken;
  }
}
void main();
