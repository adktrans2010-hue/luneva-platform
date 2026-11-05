import assert from "node:assert/strict";

import { loadPublishedArticleStatusSlugs } from "@/scripts/article-status-recovery";
import { loadRecoveryArticleSource } from "@/scripts/recovery-article-source";

const { articles, report } = loadRecoveryArticleSource();
const { slugs, conflicts } = loadPublishedArticleStatusSlugs();

assert.equal(report.conflicts.length, 0);
assert.equal(articles.length, 25);
assert.equal(conflicts.length, 0);
assert.equal(slugs.length, 13);
assert.ok(slugs.includes("chto-nuzhno-delat-esli-vy-popali-v-krizisnuyu-situatsiyu"));
assert.ok(slugs.includes("prover-est-li-u-tebya-rasstroystvo-pischevogo-povedeniya"));
assert.ok(!slugs.includes("ya-dzheyn-dou"));
assert.ok(articles.every((article) => article.status === "draft"));

console.log("Article publication status recovery guard PASS");
