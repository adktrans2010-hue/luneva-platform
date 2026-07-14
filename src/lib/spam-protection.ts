import { consumeRateLimit, getRequestClientIp } from "@/src/lib/rate-limit";

type SpamCheckOptions = {
  body: Record<string, unknown>;
  request: Request;
  scope: string;
  limit: number;
  windowMs: number;
  minFillMs?: number;
};

export async function checkPublicFormSpam({
  body,
  request,
  scope,
  limit,
  windowMs,
  minFillMs = 2500,
}: SpamCheckOptions) {
  const honeypot = String(body.website ?? "").trim();

  if (honeypot) {
    return "spam";
  }

  const formStartedAt = Number(body.formStartedAt);

  if (
    !Number.isFinite(formStartedAt) ||
    Date.now() - formStartedAt < minFillMs ||
    Date.now() - formStartedAt > 1000 * 60 * 60 * 6
  ) {
    return "timer";
  }

  const rate = await consumeRateLimit({
    scope,
    identifier: getRequestClientIp(request.headers),
    limit,
    windowMs,
  });

  if (!rate.allowed) {
    return "rate";
  }

  return null;
}

export function getSpamErrorMessage(reason: string) {
  if (reason === "rate") {
    return "Слишком много отправок подряд. Попробуйте ещё раз чуть позже.";
  }

  return "Не удалось отправить форму. Обновите страницу и попробуйте ещё раз.";
}
