import "dotenv/config";

import { db } from "@/src/db";
import { consultationProducts } from "@/src/db/schema";
import { consultationProductCodes } from "@/src/lib/consultation-products";
import { isEmergencyBookingDisabled } from "@/src/lib/emergency-booking";

const emergencyPublicProducts = [
  {
    code: consultationProductCodes.singleSession,
    name: "Индивидуальная консультация",
    sessionsCount: 1,
    priceKopeks: 500_000,
    durationMinutes: 55,
  },
  {
    code: consultationProductCodes.package7,
    name: "Пакет из 7 консультаций",
    sessionsCount: 7,
    priceKopeks: 3_000_000,
    durationMinutes: 55,
  },
] as const;

async function seedEmergencyPublicData() {
  if (!isEmergencyBookingDisabled()) {
    throw new Error("EMERGENCY_BOOKING_DISABLED=true is required for this seed.");
  }

  if (process.env.EMERGENCY_PUBLIC_SEED !== "true") {
    throw new Error("EMERGENCY_PUBLIC_SEED=true is required for this seed.");
  }

  for (const [sortOrder, product] of emergencyPublicProducts.entries()) {
    await db
      .insert(consultationProducts)
      .values({
        ...product,
        shortDescription:
          "Публичная emergency-витрина. Онлайн-запись временно отключена.",
        fullDescription:
          "Публичная emergency-витрина. Актуальная запись согласуется напрямую с Александрой.",
        currency: "RUB",
        isActive: true,
        isPublic: true,
        sortOrder,
        receiptDescription: product.name,
        paymentSubject: "service",
        paymentMode: "full_prepayment",
        vatCode: 1,
      })
      .onConflictDoUpdate({
        target: consultationProducts.code,
        set: {
          ...product,
          shortDescription:
            "Публичная emergency-витрина. Онлайн-запись временно отключена.",
          fullDescription:
            "Публичная emergency-витрина. Актуальная запись согласуется напрямую с Александрой.",
          currency: "RUB",
          isActive: true,
          isPublic: true,
          sortOrder,
          receiptDescription: product.name,
          paymentSubject: "service",
          paymentMode: "full_prepayment",
          vatCode: 1,
          archivedAt: null,
          updatedAt: new Date(),
        },
      });
  }

  console.log("Emergency public seed completed.");
}

seedEmergencyPublicData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Emergency public seed failed.", error);
    process.exit(1);
  });
