export type PromotionQuote = {
  code: string | null;
  campaign: string | null;
  basePriceKopeks: number;
  discountKopeks: number;
  finalPriceKopeks: number;
  applied: boolean;
  message: string | null;
};

export const promotionQuoteFallbackMessage =
  "Не удалось проверить промокод. Попробуйте ещё раз.";

export function createPromotionQuoteFallback(
  basePriceKopeks: number,
  message = promotionQuoteFallbackMessage
): PromotionQuote {
  return {
    code: null,
    campaign: null,
    basePriceKopeks,
    discountKopeks: 0,
    finalPriceKopeks: basePriceKopeks,
    applied: false,
    message,
  };
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

export function isPromotionQuote(
  value: unknown,
  expectedBasePriceKopeks: number
): value is PromotionQuote {
  if (!value || typeof value !== "object") return false;

  const quote = value as Record<string, unknown>;
  const basePriceKopeks = quote.basePriceKopeks;
  const discountKopeks = quote.discountKopeks;
  const finalPriceKopeks = quote.finalPriceKopeks;

  return (
    isNullableString(quote.code) &&
    isNullableString(quote.campaign) &&
    typeof quote.applied === "boolean" &&
    isNullableString(quote.message) &&
    Number.isInteger(basePriceKopeks) &&
    basePriceKopeks === expectedBasePriceKopeks &&
    Number.isInteger(discountKopeks) &&
    (discountKopeks as number) >= 0 &&
    Number.isInteger(finalPriceKopeks) &&
    (finalPriceKopeks as number) > 0 &&
    (finalPriceKopeks as number) <= expectedBasePriceKopeks &&
    (discountKopeks as number) + (finalPriceKopeks as number) ===
      expectedBasePriceKopeks
  );
}

export async function readPromotionQuoteResponse(
  response: Response,
  expectedBasePriceKopeks: number
): Promise<PromotionQuote> {
  if (!response.ok) {
    throw new Error(`Promotion quote request failed with HTTP ${response.status}`);
  }

  const payload: unknown = await response.json();

  if (!isPromotionQuote(payload, expectedBasePriceKopeks)) {
    throw new Error("Promotion quote response is invalid");
  }

  return payload;
}
