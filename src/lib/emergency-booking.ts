export const EMERGENCY_BOOKING_MESSAGE =
  "Онлайн-запись временно недоступна из-за технических работ. Пожалуйста, свяжитесь с Александрой напрямую.";

export function isEmergencyBookingDisabled() {
  return process.env.EMERGENCY_BOOKING_DISABLED?.trim().toLowerCase() === "true";
}
