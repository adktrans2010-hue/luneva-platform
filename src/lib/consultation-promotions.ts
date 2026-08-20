import { and, eq, gte, isNull, lte, or } from "drizzle-orm";

import { db } from "@/src/db";
import { consultationPromotions } from "@/src/db/schema";
import { consultationProductCodes, type ConsultationProduct } from "@/src/lib/consultation-products";
import type { PromotionQuote } from "@/src/lib/promotion-quote";

export type { PromotionQuote } from "@/src/lib/promotion-quote";

export const ludmilaPromotionCode = "LUDMILA";
export const ludmilaCampaign = "ludmila";

type PromotionLike = {
  code: string;
  campaign: string | null;
  targetProductCode: string;
  finalPriceKopeks: number;
  isActive: boolean;
  validFrom: Date | null;
  validUntil: Date | null;
  maxUses?: number | null;
};

export function normalizePromotionCode(value: unknown) {
  return String(value ?? "").trim().toUpperCase().slice(0, 64);
}

export function evaluatePromotion(
  product: Pick<ConsultationProduct, "code" | "priceKopeks">,
  promotion: PromotionLike | null | undefined,
  requestedCode: unknown
): PromotionQuote {
  const code = normalizePromotionCode(requestedCode);
  const basePriceKopeks = product.priceKopeks;

  if (!code) {
    return {
      code: null,
      campaign: null,
      basePriceKopeks,
      discountKopeks: 0,
      finalPriceKopeks: basePriceKopeks,
      applied: false,
      message: null,
    };
  }

  if (!promotion || !promotion.isActive) {
    return {
      code,
      campaign: null,
      basePriceKopeks,
      discountKopeks: 0,
      finalPriceKopeks: basePriceKopeks,
      applied: false,
      message: "Промокод не найден или больше не действует",
    };
  }

  if (promotion.targetProductCode !== product.code) {
    return {
      code: promotion.code,
      campaign: promotion.campaign,
      basePriceKopeks,
      discountKopeks: 0,
      finalPriceKopeks: basePriceKopeks,
      applied: false,
      message: "Промокод действует на индивидуальную сессию",
    };
  }

  if (
    promotion.maxUses != null ||
    !Number.isInteger(promotion.finalPriceKopeks) ||
    promotion.finalPriceKopeks <= 0 ||
    promotion.finalPriceKopeks > basePriceKopeks
  ) {
    return {
      code: promotion.code,
      campaign: promotion.campaign,
      basePriceKopeks,
      discountKopeks: 0,
      finalPriceKopeks: basePriceKopeks,
      applied: false,
      message: "Промокод временно недоступен",
    };
  }

  const finalPriceKopeks = promotion.finalPriceKopeks;

  return {
    code: promotion.code,
    campaign: promotion.campaign,
    basePriceKopeks,
    discountKopeks: basePriceKopeks - finalPriceKopeks,
    finalPriceKopeks,
    applied: true,
    message: "Промокод применён",
  };
}

export async function resolvePromotionQuote(
  product: Pick<ConsultationProduct, "code" | "priceKopeks">,
  requestedCode: unknown,
  now = new Date()
) {
  const code = normalizePromotionCode(requestedCode);

  if (!code) {
    return evaluatePromotion(product, null, code);
  }

  const [promotion] = await db
    .select()
    .from(consultationPromotions)
    .where(
      and(
        eq(consultationPromotions.code, code),
        eq(consultationPromotions.isActive, true),
        or(isNull(consultationPromotions.validFrom), lte(consultationPromotions.validFrom, now)),
        or(isNull(consultationPromotions.validUntil), gte(consultationPromotions.validUntil, now))
      )
    )
    .limit(1);

  return evaluatePromotion(product, promotion, code);
}

export function isLudmilaCampaign(value: unknown) {
  return String(value ?? "").trim().toLowerCase() === ludmilaCampaign;
}

export function isDiscountedSingleSession(productCode: string) {
  return productCode === consultationProductCodes.singleSession;
}
