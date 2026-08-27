import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { validKnowledgePath } from "@/src/lib/ai-admin-bridge";

const root = process.cwd();
const collectionRoute = readFileSync(
  join(root, "app/api/admin/ai/knowledge/route.ts"),
  "utf8"
);
const actionRoute = readFileSync(
  join(root, "app/api/admin/ai/knowledge/[id]/[action]/route.ts"),
  "utf8"
);
const bridge = readFileSync(join(root, "src/lib/ai-admin-bridge.ts"), "utf8");
const manager = readFileSync(
  join(root, "components/admin/ai-knowledge-manager.tsx"),
  "utf8"
);

assert.match(collectionRoute, /authorizeKnowledgeRequest\(request\)/u);
assert.match(actionRoute, /authorizeKnowledgeRequest\(request\)/u);
assert.match(bridge, /requireAdminApiSession\(request, \["admin"\]\)/u);
assert.match(bridge, /hasValidRequestSource\(request\)/u);
assert.match(bridge, /hasValidCsrfToken\(request\)/u);
assert.match(bridge, /X-Site-Admin-Secret/u);
assert.doesNotMatch(manager, /checksum|raw UUID|traceback/iu);
for (const label of [
  "Загрузить документ",
  "Активировать",
  "В архив",
  "Обработать заново",
  "Ошибка обработки",
]) {
  assert.match(manager, new RegExp(label, "u"));
}

const id = "123e4567-e89b-42d3-a456-426614174000";
assert.equal(validKnowledgePath(id, "activate"), true);
assert.equal(validKnowledgePath(id, "archive"), true);
assert.equal(validKnowledgePath(id, "reprocess"), true);
assert.equal(validKnowledgePath("../../admin", "activate"), false);
assert.equal(validKnowledgePath(id, "delete"), false);

console.log("AI knowledge admin security contracts: PASS");
