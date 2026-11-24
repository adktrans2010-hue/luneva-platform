import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { parsePublicationDate, publicationDateToInput } from "../src/lib/article-publication-date";

async function main() {
  const date = parsePublicationDate("2026-11-24");
  assert.ok(date);
  assert.equal(publicationDateToInput(date), "2026-11-24");
  assert.equal(parsePublicationDate("2026-02-30"), null);
  assert.equal(parsePublicationDate("24.11.2026"), null);

  const [articleCreate, articleUpdate, payments, analytics, navigation] = await Promise.all([
    readFile(new URL("../app/api/admin/articles/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/admin/articles/[id]/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/admin/payments/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/analytics/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/lib/admin-navigation.ts", import.meta.url), "utf8"),
  ]);

  assert.match(articleCreate, /createdAt: publicationDate/u);
  assert.match(articleUpdate, /createdAt: publicationDate/u);
  assert.match(articleCreate, /requireAdminApiSession/u);
  assert.match(articleUpdate, /requireAdminApiSession/u);
  assert.match(payments, /requireAdminApiSession/u);
  assert.doesNotMatch(payments, /confirmationUrl/u, "The payment response must not select provider confirmation URLs.");
  assert.match(analytics, /"payment_success"/u);
  assert.match(navigation, /href: "\/admin\/payments"/u);
  console.log("admin content fixes checks: PASS");
}

void main();
