export type PublicConsultationProduct = {
  id: string;
  code: string;
  name: string;
  shortDescription: string;
  fullDescription: string;
  sessionsCount: number;
  priceKopeks: number;
  currency: string;
  durationMinutes: number;
  sortOrder: number;
  badge: string | null;
  oldPriceKopeks: number | null;
  receiptDescription: string;
  savingsKopeks: number | null;
  fiscalConfigComplete: boolean;
};

export function formatKopeks(amountKopeks: number) {
  return new Intl.NumberFormat("ru-RU").format(Math.round(amountKopeks) / 100);
}
