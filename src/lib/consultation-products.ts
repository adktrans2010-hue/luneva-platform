import { asc, eq, isNull } from "drizzle-orm";

import { db } from "@/src/db";
import { consultationProducts } from "@/src/db/schema";
import {
  formatKopeks,
  type PublicConsultationProduct,
} from "@/src/lib/consultation-product-shared";

export { formatKopeks };

export const consultationProductCodes = {
  singleSession: "single-session",
  package7: "package-7",
} as const;

export const consultationFormats = [
  "online",
  "in_person",
  "discuss_with_psychologist",
] as const;

export type ConsultationFormat = (typeof consultationFormats)[number];
export type ConsultationProduct = typeof consultationProducts.$inferSelect;

export type ProductSnapshot = {
  productId: string;
  productCodeSnapshot: string;
  productNameSnapshot: string;
  sessionsCountSnapshot: number;
  priceKopeksSnapshot: number;
  currencySnapshot: string;
  durationMinutesSnapshot: number;
  receiptDescriptionSnapshot: string;
  paymentSubjectSnapshot: string;
  paymentModeSnapshot: string;
  vatCodeSnapshot: number;
};


export function normalizeConsultationFormat(value: unknown): ConsultationFormat {
  const format = String(value ?? "").trim();

  if (format === "office" || format === "in_person") {
    return "in_person";
  }

  if (format === "discuss_with_psychologist") {
    return "discuss_with_psychologist";
  }

  return "online";
}

export function createProductSnapshot(
  product: Pick<
    ConsultationProduct,
    | "id"
    | "code"
    | "name"
    | "sessionsCount"
    | "priceKopeks"
    | "currency"
    | "durationMinutes"
    | "receiptDescription"
    | "paymentSubject"
    | "paymentMode"
    | "vatCode"
  >
): ProductSnapshot {
  return {
    productId: product.id,
    productCodeSnapshot: product.code,
    productNameSnapshot: product.name,
    sessionsCountSnapshot: product.sessionsCount,
    priceKopeksSnapshot: product.priceKopeks,
    currencySnapshot: product.currency,
    durationMinutesSnapshot: product.durationMinutes,
    receiptDescriptionSnapshot:
      product.receiptDescription?.trim() || product.name,
    paymentSubjectSnapshot: product.paymentSubject?.trim() || "service",
    paymentModeSnapshot: product.paymentMode?.trim() || "full_prepayment",
    vatCodeSnapshot: product.vatCode || 1,
  };
}

export function getProductPaymentAmountKopeks(
  product: Pick<ConsultationProduct, "priceKopeks">
) {
  return product.priceKopeks;
}

export class PurchasableProductError extends Error {
  override name = "PurchasableProductError";
}

export function assertProductCanBePurchased(
  product:
    | Pick<
        ConsultationProduct,
        | "isActive"
        | "isPublic"
        | "archivedAt"
        | "sessionsCount"
        | "priceKopeks"
        | "currency"
      >
    | null
    | undefined,
  { publicPurchase = true } = {}
) {
  if (!product) {
    throw new PurchasableProductError("Выберите услугу для записи.");
  }

  if (product.archivedAt) {
    throw new PurchasableProductError("Эта услуга перенесена в архив.");
  }

  if (!product.isActive) {
    throw new PurchasableProductError("Эта услуга временно недоступна.");
  }

  if (publicPurchase && !product.isPublic) {
    throw new PurchasableProductError(
      "Эта услуга недоступна для онлайн-записи."
    );
  }

  if (!Number.isInteger(product.sessionsCount) || product.sessionsCount <= 0) {
    throw new PurchasableProductError(
      "У услуги некорректное количество консультаций."
    );
  }

  if (!Number.isInteger(product.priceKopeks) || product.priceKopeks <= 0) {
    throw new PurchasableProductError("У услуги некорректная стоимость.");
  }

  if (product.currency !== "RUB") {
    throw new PurchasableProductError(
      "Для онлайн-оплаты сейчас доступна только валюта RUB."
    );
  }
}

export function calculateSavingsKopeks(
  product: Pick<ConsultationProduct, "sessionsCount" | "priceKopeks">,
  singleSessionPriceKopeks: number | null
) {
  if (!singleSessionPriceKopeks || product.sessionsCount <= 1) {
    return null;
  }

  const basePrice = singleSessionPriceKopeks * product.sessionsCount;
  const savings = basePrice - product.priceKopeks;

  return savings > 0 ? savings : null;
}

export function deriveRemainingSessions(totalSessions: number, usedSessions: number) {
  return Math.max(totalSessions - usedSessions, 0);
}

export function isFiscalConfigComplete(
  product: Pick<
    ConsultationProduct,
    "receiptDescription" | "paymentSubject" | "paymentMode" | "vatCode"
  >
) {
  return Boolean(
    product.receiptDescription?.trim() &&
      product.paymentSubject?.trim() &&
      product.paymentMode?.trim() &&
      product.vatCode
  );
}

export function mapPublicProduct(
  product: ConsultationProduct,
  singleSessionPriceKopeks: number | null
): PublicConsultationProduct {
  return {
    id: product.id,
    code: product.code,
    name: product.name,
    shortDescription: product.shortDescription ?? "",
    fullDescription: product.fullDescription ?? "",
    sessionsCount: product.sessionsCount,
    priceKopeks: product.priceKopeks,
    currency: product.currency,
    durationMinutes: product.durationMinutes,
    sortOrder: product.sortOrder,
    badge: product.badge,
    oldPriceKopeks: product.oldPriceKopeks,
    receiptDescription: product.receiptDescription ?? product.name,
    savingsKopeks: calculateSavingsKopeks(product, singleSessionPriceKopeks),
    fiscalConfigComplete: isFiscalConfigComplete(product),
  };
}

export async function getPublicConsultationProducts() {
  if (process.env.LOCAL_BUILD_NO_DB === "1") {
    return [];
  }

  const products = await db
    .select()
    .from(consultationProducts)
    .where(eq(consultationProducts.isActive, true))
    .orderBy(asc(consultationProducts.sortOrder), asc(consultationProducts.createdAt));

  const publicProducts = products.filter(
    (product) => product.isPublic && !product.archivedAt
  );
  const singleSessionPriceKopeks =
    publicProducts.find(
      (product) => product.code === consultationProductCodes.singleSession
    )?.priceKopeks ?? null;

  return publicProducts.map((product) =>
    mapPublicProduct(product, singleSessionPriceKopeks)
  );
}

export async function findPurchasableProduct({
  productId,
  productCode,
  publicPurchase = true,
}: {
  productId?: string | null;
  productCode?: string | null;
  publicPurchase?: boolean;
}) {
  const where = productId
    ? eq(consultationProducts.id, productId)
    : eq(
        consultationProducts.code,
        productCode?.trim() || consultationProductCodes.singleSession
      );

  const [product] = await db
    .select()
    .from(consultationProducts)
    .where(where)
    .limit(1);

  assertProductCanBePurchased(product, { publicPurchase });

  return product;
}

export async function getDefaultPublicProduct() {
  return findPurchasableProduct({
    productCode: consultationProductCodes.singleSession,
    publicPurchase: true,
  });
}

export async function getAllConsultationProductsForAdmin() {
  return db
    .select()
    .from(consultationProducts)
    .where(isNull(consultationProducts.archivedAt))
    .orderBy(asc(consultationProducts.sortOrder), asc(consultationProducts.createdAt));
}
