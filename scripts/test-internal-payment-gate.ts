import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
import ts from "typescript";

async function main() {
  const require = createRequire(import.meta.url);
  const exports: Record<string, (request: Request) => Promise<Response>> = {};
  let payments = 0;
  let holds = 0;
  let fail = false;
  const product = { priceKopeks: 10000 };
  const mocks: Record<string, unknown> = {
    "@/src/db": { db: { select: () => ({ from: () => ({ where: () => ({ limit: async () => [product] }) }) }) } },
    "@/src/db/schema": { consultationProducts: { id: "id" } },
    "drizzle-orm": { eq: () => true },
    "@/src/lib/appointment-payments": { createOrReuseAppointmentPayment: async () => {
      payments++;
      if (fail) throw new Error("private-provider-detail");
      return { paymentUrl: "https://example.test/payment", status: "pending", amountRub: 100, currency: "RUB", reused: false };
    } },
    "@/src/lib/booking-holds": {
      expireStalePaymentHolds: async () => { holds++; },
      beginAppointmentPaymentHold: async (id: string) => ({ id, productId: "test", priceKopeks: 10000 }),
      failAppointmentPaymentHold: async () => {}, getPaymentHoldMinutes: () => 60,
    },
  };
  const source = readFileSync("app/api/internal/telegram/payments/route.ts", "utf8");
  runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, {
    exports, Buffer, process: { env: { TELEGRAM_INTERNAL_API_SECRET: "test-secret", EMERGENCY_BOOKING_DISABLED: "true" } },
    require: (name: string) => name in mocks ? mocks[name] : require(name),
  });
  const request = (secret?: string, body: unknown = {}) => new Request("http://localhost/api/internal/telegram/payments", {
    method: "POST", headers: { "content-type": "application/json", ...(secret ? { "x-telegram-internal-secret": secret } : {}) }, body: JSON.stringify(body),
  });
  for (const secret of [undefined, "wrong", "ééééééééééé"]) assert.equal((await exports.POST(request(secret))).status, 401);
  for (const body of [{}, { appointment_id: 123 }, { appointment_id: "invalid" }, null]) assert.equal((await exports.POST(request("test-secret", body))).status, 400);
  assert.equal(holds, 0); assert.equal(payments, 0);
  const body = { appointment_id: "00000000-0000-4000-8000-000000000001" };
  assert.equal((await exports.POST(request("test-secret", body))).status, 200);
  assert.equal(payments, 1);
  fail = true;
  const response = await exports.POST(request("test-secret", body));
  assert.equal(response.status, 400);
  assert.ok(!(await response.text()).includes("private-provider-detail"));
  console.log("Internal payment route auth/payload/emergency/error isolation PASS; providers mocked");
}
main().catch(() => { console.error("Internal payment gate FAIL"); process.exitCode = 1; });
