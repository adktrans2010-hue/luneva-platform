import assert from "node:assert/strict";

import { loadRecoveryArticleSource } from "@/scripts/recovery-article-source";

const { articles, report } = loadRecoveryArticleSource();

assert.equal(report.manifestCount, 26);
assert.equal(report.markdownCount, 26);
assert.equal(report.seoCount, 39);
assert.equal(report.exactSeoMatches, 19);
assert.equal(report.seoOnly.length, 13);
assert.equal(report.aliases.length, 7);
assert.deepEqual(report.conflicts, []);
assert.equal(articles.length, 26);
assert.equal(new Set(articles.map((article) => article.slug)).size, articles.length);
assert.ok(articles.every((article) => article.status === "draft" || article.status === "published"));
const janeDoe = articles.find((article) => article.slug === "ya-dzheyn-dou");
assert.ok(janeDoe);
assert.equal(janeDoe.status, "published");
assert.equal(janeDoe.category, "Травма и ПТСР");
assert.equal(janeDoe.seoTitle, "Я — Джейн Доу: флешмоб, насилие, поддержка и помощь");
assert.equal(janeDoe.seoDescription, "Что означает флешмоб «Я — Джейн Доу», почему женщины рассказывают о пережитом насилии, как поддержать человека, помочь себе и куда обращаться за помощью.");

console.log("Recovery article source reconciliation PASS");
