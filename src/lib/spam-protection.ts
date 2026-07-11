type SpamCheckOptions = {
  body: Record<string, unknown>;
  request: Request;
  scope: string;
  limit: number;
  windowMs: number;
  minFillMs?: number;
};

type RateEntry = {
  count: number;
  resetAt: number;
};

const rateStore = new Map<string, RateEntry>();

function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");

  return forwardedFor?.split(",")[0]?.trim() || realIp || "unknown";
}

function cleanupRateStore(now: number) {
  for (const [key, entry] of rateStore.entries()) {
    if (entry.resetAt <= now) {
      rateStore.delete(key);
    }
  }
}

function isRateLimited(
  request: Request,
  scope: string,
  limit: number,
  windowMs: number
) {
  const now = Date.now();
  cleanupRateStore(now);

  const key = `${scope}:${getClientIp(request)}`;
  const entry = rateStore.get(key);

  if (!entry || entry.resetAt <= now) {
    rateStore.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  entry.count += 1;

  return entry.count > limit;
}

export function checkPublicFormSpam({
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

  if (isRateLimited(request, scope, limit, windowMs)) {
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
