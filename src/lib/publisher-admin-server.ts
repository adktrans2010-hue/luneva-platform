import "server-only";
import { publisherQueueSchema, type PublisherQueue } from "./publisher-admin-contract";

export type PublisherResult = { state: "ready"; queue: PublisherQueue } | { state: "unavailable" | "not-configured" };

export async function readPublisherQueue(fetcher: typeof fetch = fetch): Promise<PublisherResult> {
  const base = process.env.PUBLISHER_ADMIN_API_URL;
  const token = process.env.PUBLISHER_ADMIN_API_TOKEN;
  if (!base || !token || token.length < 32) return { state: "not-configured" };
  try {
    const url = new URL(base);
    const privateHost = url.hostname.endsWith(".railway.internal") || ["127.0.0.1", "localhost", "[::1]"].includes(url.hostname);
    if ((url.protocol !== "https:" && !(url.protocol === "http:" && privateHost)) || url.username || url.password || url.search || url.hash) return { state: "not-configured" };
    url.pathname = "/internal/admin/channel-posts";
    const response = await fetcher(url, { method: "GET", headers: { "X-Publisher-Admin-Token": token },
      redirect: "error", cache: "no-store", signal: AbortSignal.timeout(8000) });
    if (!response.ok) return { state: "unavailable" };
    const body = await response.text();
    if (body.length > 2_000_000 || body.includes(token)) return { state: "unavailable" };
    return { state: "ready", queue: publisherQueueSchema.parse(JSON.parse(body)) };
  } catch {
    // Do not forward upstream bodies, exception messages or credentials to browser/logs.
    return { state: "unavailable" };
  }
}
