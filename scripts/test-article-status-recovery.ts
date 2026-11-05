import assert from "node:assert/strict";

import { loadPublishedArticleStatusSlugs } from "@/scripts/article-status-recovery";
import { loadRecoveryArticleSource } from "@/scripts/recovery-article-source";

const { articles, report } = loadRecoveryArticleSource();
const { slugs, conflicts } = loadPublishedArticleStatusSlugs();

assert.equal(report.conflicts.length, 0);
assert.equal(articles.length, 26);
assert.equal(conflicts.length, 0);
assert.equal(slugs.length, 13);
assert.ok(slugs.includes("chto-nuzhno-delat-esli-vy-popali-v-krizisnuyu-situatsiyu"));
assert.ok(slugs.includes("prover-est-li-u-tebya-rasstroystvo-pischevogo-povedeniya"));
assert.ok(!slugs.includes("ya-dzheyn-dou"));
assert.equal(articles.filter((article) => article.status === "published").length, 1);
assert.equal(articles.filter((article) => article.status === "draft").length, 25);
assert.equal(new Set([...slugs, ...articles.filter((article) => article.status === "published").map((article) => article.slug)]).size, 14);
assert.equal(articles.length - 14, 12);

console.log("Article publication status recovery guard PASS");
