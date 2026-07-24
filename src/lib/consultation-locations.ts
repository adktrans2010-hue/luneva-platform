export const consultationLocations = [
  { value: "online", label: "Онлайн" },
  { value: "moscow", label: "Москва" },
  { value: "vidnoye", label: "Видное" },
] as const;

export type ConsultationLocation =
  (typeof consultationLocations)[number]["value"];

export const consultationLocationLabels: Record<ConsultationLocation, string> = {
  online: "Онлайн",
  moscow: "Москва",
  vidnoye: "Видное",
};

export function isConsultationLocation(
  value: string
): value is ConsultationLocation {
  return consultationLocations.some((location) => location.value === value);
}

export function normalizeConsultationLocation(
  format: string,
  value: unknown
): ConsultationLocation | null {
  if (format === "online" || format === "discuss_with_psychologist") {
    return "online";
  }

  const location = String(value ?? "").trim();
  return location === "moscow" || location === "vidnoye" ? location : null;
}

export function getConsultationPlaceLabel(
  format: string,
  location: string
) {
  if (format === "online") {
    return consultationLocationLabels.online;
  }

  if (format === "discuss_with_psychologist") {
    return "Обсудить с психологом";
  }

  return consultationLocationLabels[
    isConsultationLocation(location) ? location : "moscow"
  ];
}

export function getConsultationAddress(location: string) {
  if (location === "moscow") {
    return "Москва, Кожевнический проезд, дом 4/5, строение 5";
  }

  if (location === "vidnoye") {
    return "Видное. Точный адрес будет направлен после подтверждения записи.";
  }

  return "Онлайн";
}
