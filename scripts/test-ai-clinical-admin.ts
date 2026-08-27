import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const auth = readFileSync("src/lib/admin-auth.ts", "utf8");
const proxy = readFileSync("proxy.ts", "utf8");
const bridge = readFileSync("src/lib/ai-clinical-bridge.ts", "utf8");
const migration = readFileSync("drizzle/0037_clinical_admin.sql", "utf8");

assert.match(auth, /"clinical_admin"/);
assert.match(auth, /role === "admin" \|\| role === "clinical_admin"/);
assert.match(proxy, /authorization\.session\.role !== "clinical_admin"/);
assert.match(proxy, /\/admin\/ai\/pilot/);
assert.match(bridge, /requireAdminApiSession\(request, \["clinical_admin"\]\)/);
assert.match(bridge, /X-Clinical-Actor/);
assert.match(bridge, /hasValidCsrfToken/);
assert.match(migration, /luneva\.shura@yandex\.ru/);
assert.doesNotMatch(migration, /and-lunev@yandex\.ru/);
const pilotRoute = readFileSync("app/api/admin/ai/clinical/pilot/usage/route.ts", "utf8");
const pilotPage = readFileSync("app/admin/ai/pilot/page.tsx", "utf8");
assert.match(pilotRoute, /proxyClinicalRequest\(request, "\/pilot\/usage"\)/);
assert.match(pilotPage, /AiPilotUsage/);
console.log("AI_CLINICAL_ADMIN_SECURITY=PASS");
