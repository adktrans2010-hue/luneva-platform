import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  evaluatePromotion,
  normalizePromotionCode,
} from "../src/lib/consultation-promotions";
import {
  createPromotionQuoteRequestKey,
  createPromotionQuoteFallback,
  quoteForCurrentSelection,
  readPromotionQuoteResponse,
} from "../src/lib/promotion-quote";
import { classifyAppointmentPreparationError } from "../src/lib/appointment-api-errors";
import { PurchasableProductError } from "../src/lib/consultation-products";

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

const internalError = new Error(
  "Database driver detail: connection failed for a private internal endpoint"
);
const safeQuoteError = classifyAppointmentPreparationError(internalError, "quote");
assert.equal(safeQuoteError.status, 503);
assert.equal(safeQuoteError.body.error.code, "QUOTE_UNAVAILABLE");
assert.equal(JSON.stringify(safeQuoteError).includes("driver detail"), false);

const safeProductFailure = classifyAppointmentPreparationError(
  internalError,
  "product"
);
assert.equal(safeProductFailure.status, 503);
assert.equal(safeProductFailure.body.error.code, "BOOKING_UNAVAILABLE");
assert.equal(JSON.stringify(safeProductFailure).includes("internal endpoint"), false);

const invalidProduct = classifyAppointmentPreparationError(
  new PurchasableProductError("Выберите услугу для записи."),
  "product"
);
assert.equal(invalidProduct.status, 400);
assert.equal(invalidProduct.body.error.code, "INVALID_PRODUCT");

const quoteA = evaluatePromotion(singleSession, ludmila, "LUDMILA");
const stateA = {
  requestKey: createPromotionQuoteRequestKey(singleSession.code, "LUDMILA"),
  quote: quoteA,
};
assert.equal(
  quoteForCurrentSelection(stateA, singleSession, "LUDMILA")?.finalPriceKopeks,
  500000
);
assert.equal(quoteForCurrentSelection(stateA, packageProduct, "LUDMILA"), null);

const quoteB = evaluatePromotion(packageProduct, ludmila, "LUDMILA");
const stateB = {
  requestKey: createPromotionQuoteRequestKey(packageProduct.code, "LUDMILA"),
  quote: quoteB,
};
assert.equal(
  quoteForCurrentSelection(stateB, packageProduct, "LUDMILA")?.finalPriceKopeks,
  packageProduct.priceKopeks
);

const appointmentRoute = readFileSync(
  new URL("../app/api/appointments/route.ts", import.meta.url),
  "utf8"
);
assert.match(appointmentRoute, /classifyAppointmentPreparationError/);
assert.doesNotMatch(
  appointmentRoute,
  /error instanceof Error \? error\.message/
);

const appointmentForm = readFileSync(
  new URL("../components/AppointmentForm.tsx", import.meta.url),
  "utf8"
);
assert.match(appointmentForm, /quoteForCurrentSelection/);
assert.match(appointmentForm, /setPromotionQuoteState\(\{ requestKey, quote \}\)/);

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
