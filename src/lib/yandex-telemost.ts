import { validTelemostUrl } from "./consultation-access";

const endpoint = "https://cloud-api.yandex.net/v1/telemost-api/conferences";
export class TelemostError extends Error {
  constructor(public readonly code: string) {
    super(code); this.name = "TelemostError";
  }
}
export function isTelemostEnabled() {
  return process.env.YANDEX_TELEMOST_ENABLED === "true";
}
async function request(method: "GET" | "POST", id?: string) {
  if (!isTelemostEnabled()) throw new TelemostError("DISABLED");
  const token = process.env.YANDEX_TELEMOST_OAUTH_TOKEN?.trim();
  if (!token) throw new TelemostError("TOKEN_MISSING");
  let response: Response;
  try {
    response = await fetch(id ? `${endpoint}/${encodeURIComponent(id)}` : endpoint, {
      method, headers: { Authorization: `OAuth ${token}`, "Content-Type": "application/json" },
      ...(method === "POST" ? { body: JSON.stringify({ waiting_room_level: "PUBLIC" }) } : {}),
      redirect: "error", signal: AbortSignal.timeout(10_000), cache: "no-store",
    });
  } catch { throw new TelemostError("OUTCOME_UNKNOWN"); }
  // Do not store/log provider bodies: they may echo credentials or private URLs.
  if (!response.ok) throw new TelemostError(`HTTP_${response.status}`);
  const data = await response.json().catch(() => null);
  if (!data || typeof data.id !== "string" || !/^[\w-]{1,256}$/.test(data.id) ||
      typeof data.join_url !== "string" || data.join_url.length > 2048 || !validTelemostUrl(data.join_url)) {
    throw new TelemostError("INVALID_RESPONSE");
  }
  if (id && data.id !== id) throw new TelemostError("IDENTITY_MISMATCH");
  return { id: data.id as string, joinUrl: data.join_url as string };
}
export function createTelemostConference() { return request("POST"); }
export function getTelemostConference(id: string) { return request("GET", id); }
