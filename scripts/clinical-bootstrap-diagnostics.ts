/** Diagnostics are deliberately allowlisted: never serialize errors/configuration. */
export function bootstrapRedactor(env: Record<string, string | undefined>, additional: string[] = []) {
  const values = [...additional, ...Object.entries(env)
    .filter(([key]) => /password|secret|token|credential|database_url|smtp_(host|user|from)/iu.test(key))
    .map(([, value]) => value ?? "")].filter(Boolean);
  const user = env.SMTP_USER?.trim() ?? "";
  const password = env.SMTP_PASSWORD?.trim() ?? "";
  if (user && password) values.push(`${user}:${password}`, `\0${user}\0${password}`);
  const variants = [...new Set(values.flatMap((value) => [value, value.trim(),
    encodeURIComponent(value), Buffer.from(value).toString("base64")]).filter(Boolean))]
    .sort((a, b) => b.length - a.length);
  return (input: string) => {
    let safe = input;
    for (const value of variants) safe = safe.split(value).join("[REDACTED]");
    return safe
      .replace(/\b[a-z][a-z\d+.-]*:\/\/[^\s/]*@/giu, "[REDACTED-URL]@")
      .replace(/\b(AUTH\s+(?:PLAIN|LOGIN)|Bearer|Basic)\s+[^\r\n]+/giu, "$1 [REDACTED]")
      .replace(/((?:password|passwd|pwd|token|secret|credential|authorization)[\w-]*\s*[=:]\s*)[^\s,;]+/giu, "$1[REDACTED]")
      .replace(/\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}/gu, "[REDACTED-HASH]")
      .replace(/[A-Za-z0-9_+\/-]{24,}={0,2}/gu, "[REDACTED-TOKEN]")
      .replace(/[\r\n\x00-\x1f\x7f]/gu, " ")
      .slice(0, 1000);
  };
}

export function smtpFailureLines(error: unknown, redact: (value: string) => string) {
  const record = error && typeof error === "object" ? error as Record<string, unknown> : {};
  return ["BOOTSTRAP SMTP FAILURE", ...["name", "code", "command", "responseCode", "response", "message"].map((key) => {
    const value = record[key];
    return `${key}: ${typeof value === "string" || typeof value === "number" ? redact(String(value)) : "unavailable"}`;
  })];
}

export function smtpPresence(env: Record<string, string | undefined>) {
  const present = (key: string) => Boolean(env[key]?.trim());
  const port = Number(env.SMTP_PORT ?? 465);
  return `SMTP CONFIG: host=${present("SMTP_HOST")} user=${present("SMTP_USER")} password=${present("SMTP_PASSWORD")} port=${Number.isInteger(port) && port > 0 && port <= 65535 ? port : "unset"} secure=${String(env.SMTP_SECURE ?? "true") !== "false"} from=${present("SMTP_FROM")}`;
}
