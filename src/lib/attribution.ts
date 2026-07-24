export const attributionKeys = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "yclid",
] as const;

export type AttributionKey = (typeof attributionKeys)[number];
export type AttributionValues = Partial<Record<AttributionKey, string>>;

export type AttributionPayload = {
  first?: AttributionValues;
  last?: AttributionValues;
  firstCapturedAt?: string;
  lastCapturedAt?: string;
};

function sanitizeValue(value: unknown) {
  if (typeof value !== "string") return "";

  return value
    .normalize("NFC")
    .replace(/[<>"'`\\]/g, "")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .trim()
    .slice(0, 160);
}

function sanitizeValues(value: unknown): AttributionValues | undefined {
  if (!value || typeof value !== "object") return undefined;

  const source = value as Record<string, unknown>;
  const result = attributionKeys.reduce<AttributionValues>((accumulator, key) => {
    const sanitized = sanitizeValue(source[key]);

    if (sanitized) {
      accumulator[key] = sanitized;
    }

    return accumulator;
  }, {});

  return Object.keys(result).length > 0 ? result : undefined;
}

function sanitizeDate(value: unknown) {
  const text = sanitizeValue(value);
  if (!text) return undefined;

  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

export function sanitizeAttributionPayload(value: unknown): AttributionPayload | null {
  if (!value || typeof value !== "object") return null;

  const source = value as Record<string, unknown>;
  const first = sanitizeValues(source.first);
  const last = sanitizeValues(source.last);

  if (!first && !last) return null;

  return {
    first,
    last,
    firstCapturedAt: sanitizeDate(source.firstCapturedAt),
    lastCapturedAt: sanitizeDate(source.lastCapturedAt),
  };
}
