import { ADMIN_CSRF_COOKIE_NAME } from "@/src/lib/admin-security-constants";

function readCsrfToken() {
  if (typeof document === "undefined") return "";
  const prefix = `${ADMIN_CSRF_COOKIE_NAME}=`;
  const entry = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith(prefix));
  return entry ? decodeURIComponent(entry.slice(prefix.length)) : "";
}

export function adminFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  const method = (init.method ?? "GET").toUpperCase();

  if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    headers.set("x-csrf-token", readCsrfToken());
  }

  return fetch(input, { ...init, headers, credentials: "same-origin" });
}
