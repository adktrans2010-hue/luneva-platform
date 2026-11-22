// Public URL helpers shared by metadata and client-rendered structured data.
export const siteUrl = "https://luneva-psy.ru";

export function normalizePath(path: string) {
  return path.startsWith("/") ? path : `/${path}`;
}

export function absoluteUrl(path: string) {
  return new URL(normalizePath(path), siteUrl).toString();
}
