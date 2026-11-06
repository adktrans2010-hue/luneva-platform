import assert from "node:assert/strict";
import { bootstrapRedactor, smtpFailureLines, smtpPresence } from "./clinical-bootstrap-diagnostics";

const env = { SMTP_PASSWORD: "smtp-pw-!@test", SMTP_USER: "smtp-user", SMTP_HOST: "mail.local.test",
  SMTP_FROM: "sender@local.test", ADMIN_SESSION_SECRET: "session-secret-sentinel", SMTP_PORT: "465", SMTP_SECURE: "true" };
const temporary = "temporary-password-sentinel";
const redact = bootstrapRedactor(env, [temporary]);
for (const secret of [...Object.values(env).slice(0, 5), temporary]) {
  for (const encoded of [secret, encodeURIComponent(secret), Buffer.from(secret).toString("base64")]) {
    assert.ok(!redact(`error ${encoded}`).includes(encoded), "Sensitive value was not redacted");
  }
}
const error = Object.assign(new Error(`535 password=unknown-password smtp://other:other-pass@host AUTH PLAIN encoded-auth\r\n${temporary}`), {
  code: "EAUTH", command: "AUTH LOGIN", responseCode: 535, response: `535 ${env.SMTP_PASSWORD}`, config: env,
});
const lines = smtpFailureLines(error, redact);
assert.equal(lines.length, 7);
assert.ok(lines.includes("code: EAUTH"));
assert.ok(lines.includes("responseCode: 535"));
for (const secret of ["unknown-password", "other-pass", "encoded-auth", temporary, env.SMTP_PASSWORD]) assert.ok(!lines.join("\n").includes(secret));
assert.ok(lines.every((line) => !/[\r\n]/u.test(line)));
assert.equal(smtpPresence(env), "SMTP CONFIG: host=true user=true password=true port=465 secure=true from=true");
assert.ok(smtpPresence({ SMTP_PORT: "bad-secret" }).includes("port=unset"));
assert.equal(smtpFailureLines(null, redact).length, 7);
console.log("Clinical bootstrap safe diagnostics: PASS");
