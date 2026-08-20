import { PurchasableProductError } from "@/src/lib/consultation-products";

type AppointmentApiError = {
  error: {
    code: "INVALID_PRODUCT" | "BOOKING_UNAVAILABLE" | "QUOTE_UNAVAILABLE";
    message: string;
    retryable: boolean;
  };
};

export function classifyAppointmentPreparationError(
  error: unknown,
  stage: "product" | "quote"
): { status: 400 | 503; body: AppointmentApiError } {
  if (stage === "product" && error instanceof PurchasableProductError) {
    return {
      status: 400,
      body: {
        error: {
          code: "INVALID_PRODUCT",
          message: error.message,
          retryable: false,
        },
      },
    };
  }

  if (stage === "quote") {
    return {
      status: 503,
      body: {
        error: {
          code: "QUOTE_UNAVAILABLE",
          message: "Не удалось проверить промокод",
          retryable: true,
        },
      },
    };
  }

  return {
    status: 503,
    body: {
      error: {
        code: "BOOKING_UNAVAILABLE",
        message: "Онлайн-запись временно недоступна. Попробуйте позже.",
        retryable: true,
      },
    },
  };
}
