const DATE_INPUT_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

function moscowParts(value: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Moscow",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(value);
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return { year: read("year"), month: read("month"), day: read("day") };
}

export function publicationDateToInput(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const { year, month, day } = moscowParts(date);
  return `${year}-${month}-${day}`;
}

export function parsePublicationDate(value: unknown) {
  if (typeof value !== "string") return null;
  const match = DATE_INPUT_PATTERN.exec(value.trim());
  if (!match) return null;

  const [, year, month, day] = match;
  // Midday UTC prevents the selected Moscow calendar day from shifting when
  // rendered in either the admin interface or the public article page.
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), 12));
  return publicationDateToInput(date) === value.trim() ? date : null;
}
