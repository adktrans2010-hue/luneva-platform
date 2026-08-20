import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  evaluatePromotion,
  normalizePromotionCode,
} from "../src/lib/consultation-promotions";
import {
  createPromotionQuoteFallback,
  readPromotionQuoteResponse,
} from "../src/lib/promotion-quote";

const singleSession = { code: "single-session", priceKopeks: 700000 };
const packageProduct = { code: "package-7", priceKopeks: 4200000 };
const ludmila = {
  code: "LUDMILA",
  campaign: "ludmila",
  targetProductCode: "single-session",
  finalPriceKopeks: 500000,
  isActive: true,
  validFrom: null,
  validUntil: null,
  maxUses: null,
};

assert.equal(normalizePromotionCode(" ludmila "), "LUDMILA");
assert.equal(evaluatePromotion(singleSession, ludmila, "ludmila").finalPriceKopeks, 500000);
assert.equal(evaluatePromotion(singleSession, ludmila, " Ludmila ").discountKopeks, 200000);
assert.equal(evaluatePromotion(singleSession, null, "invalid").finalPriceKopeks, 700000);
assert.equal(evaluatePromotion(packageProduct, ludmila, "LUDMILA").finalPriceKopeks, 4200000);
assert.equal(evaluatePromotion(packageProduct, ludmila, "LUDMILA").applied, false);
assert.equal(evaluatePromotion(singleSession, { ...ludmila, isActive: false }, "LUDMILA").applied, false);

const zeroPriceQuote = evaluatePromotion(
  singleSession,
  { ...ludmila, finalPriceKopeks: 0 },
  "LUDMILA"
);
assert.equal(zeroPriceQuote.applied, false);
assert.equal(zeroPriceQuote.finalPriceKopeks, singleSession.priceKopeks);

const aboveBaseQuote = evaluatePromotion(
  singleSession,
  { ...ludmila, finalPriceKopeks: singleSession.priceKopeks + 1 },
  "LUDMILA"
);
assert.equal(aboveBaseQuote.applied, false);
assert.equal(aboveBaseQuote.finalPriceKopeks, singleSession.priceKopeks);

const unsupportedLimitedQuote = evaluatePromotion(
  singleSession,
  { ...ludmila, maxUses: 1 },
  "LUDMILA"
);
assert.equal(unsupportedLimitedQuote.applied, false);

async function runAsyncTests() {
  const validQuote = evaluatePromotion(singleSession, ludmila, "LUDMILA");
  const parsedQuote = await readPromotionQuoteResponse(
  new Response(JSON.stringify(validQuote), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  }),
  singleSession.priceKopeks
);
  assert.deepEqual(parsedQuote, validQuote);

  await assert.rejects(() =>
    readPromotionQuoteResponse(
    new Response(
      JSON.stringify({
        error: {
          code: "QUOTE_UNAVAILABLE",
          message: "Не удалось проверить промокод",
          retryable: true,
        },
      }),
      { status: 503 }
    ),
    singleSession.priceKopeks
    )
  );

  await assert.rejects(() =>
    readPromotionQuoteResponse(
    new Response(JSON.stringify({ applied: true, finalPriceKopeks: 0 }), {
      status: 200,
    }),
    singleSession.priceKopeks
    )
  );

  assert.deepEqual(createPromotionQuoteFallback(singleSession.priceKopeks), {
    code: null,
    campaign: null,
    basePriceKopeks: singleSession.priceKopeks,
    discountKopeks: 0,
    finalPriceKopeks: singleSession.priceKopeks,
    applied: false,
    message: "Не удалось проверить промокод. Попробуйте ещё раз.",
  });

  const migration0034 = readFileSync(
    new URL("../drizzle/0034_ludmila_promotions.sql", import.meta.url),
    "utf8"
  );
  assert.match(migration0034, /ON CONFLICT \("code"\) DO NOTHING;/);
  assert.doesNotMatch(migration0034, /ON CONFLICT[\s\S]*DO UPDATE/i);
  assert.match(migration0034, /500000, true, NULL/);
}

void runAsyncTests().then(() => {
  console.log("Ludmila promotion rules: PASS");
});
