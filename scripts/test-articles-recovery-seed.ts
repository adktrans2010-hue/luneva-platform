import assert from "node:assert/strict";

import { loadRecoveryArticleSource } from "@/scripts/recovery-article-source";

const { articles, report } = loadRecoveryArticleSource();

assert.equal(report.manifestCount, 25);
assert.equal(report.markdownCount, 25);
assert.equal(report.seoCount, 38);
assert.equal(report.exactSeoMatches, 18);
assert.equal(report.seoOnly.length, 13);
assert.equal(report.aliases.length, 7);
assert.deepEqual(report.conflicts, []);
assert.equal(articles.length, 25);
assert.equal(new Set(articles.map((article) => article.slug)).size, articles.length);
assert.ok(articles.every((article) => article.status === "draft" || article.status === "published"));

console.log("Recovery article source reconciliation PASS");
