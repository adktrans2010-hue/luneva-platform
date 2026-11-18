export type MailMessage = { to: string; subject: string; text: string; html?: string };

export function emailProvider() {
  return process.env.EMAIL_PROVIDER?.trim().toLowerCase() || "smtp";
}

export function httpsEmailConfigured() {
  return emailProvider() === "postmark" && Boolean(
    process.env.POSTMARK_SERVER_TOKEN?.trim() && process.env.EMAIL_FROM?.trim()
  );
}

export async function sendHttpsEmail(message: MailMessage) {
  if (!httpsEmailConfigured()) throw new Error("EMAIL_PROVIDER_NOT_CONFIGURED");
  let response: Response;
  try {
    response = await fetch("https://api.postmarkapp.com/email", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json",
        "X-Postmark-Server-Token": process.env.POSTMARK_SERVER_TOKEN!.trim() },
      body: JSON.stringify({ From: process.env.EMAIL_FROM!.trim(), To: message.to,
        Subject: message.subject, TextBody: message.text, HtmlBody: message.html,
        MessageStream: "outbound", TrackOpens: false, TrackLinks: "None" }),
      signal: AbortSignal.timeout(15_000), redirect: "error",
    });
  } catch {
    // Never expose request headers/body or retry an ambiguously accepted send.
    throw new Error("EMAIL_PROVIDER_TRANSPORT_FAILED");
  }
  if (!response.ok) throw new Error(`EMAIL_PROVIDER_HTTP_${response.status}`);
  const result = await response.json().catch(() => null);
  if (result?.ErrorCode !== 0 || typeof result?.MessageID !== "string" || !result.MessageID) {
    throw new Error("EMAIL_PROVIDER_REJECTED");
  }
}
