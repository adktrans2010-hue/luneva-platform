import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { Client } from "pg";

async function main() {
  assert.equal(process.env.DATABASE_URL, "postgresql://recovery_local@127.0.0.1:5432/luneva_gate35");
  process.env.EMERGENCY_BOOKING_DISABLED = "true";
  process.env.TELEGRAM_INTERNAL_API_SECRET = "synthetic-test-secret";
  process.env.YOOKASSA_SHOP_ID = "mock";
  process.env.YOOKASSA_SECRET_KEY = "mock";
  const c = new Client({ connectionString: process.env.DATABASE_URL }); await c.connect();
  const id = randomUUID(); const product = randomUUID(); let calls = 0;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    assert.equal(String(url), "https://api.yookassa.ru/v3/payments");
    const body = JSON.parse(String(init?.body)); assert.equal(body.amount.value, "5000.00");
    calls++;
    return Response.json({ id: "mock-gate38-payment", status: "pending", paid: false, amount: body.amount, confirmation: { confirmation_url: "https://example.invalid/mock-payment" } });
  };
  const { POST } = await import("../app/api/internal/telegram/payments/route");
  const { closeDatabase } = await import("../src/db");
  const request = (secret: string, payload: unknown) => new Request("http://localhost/api/internal/telegram/payments", { method: "POST", headers: { "content-type": "application/json", "x-telegram-internal-secret": secret }, body: JSON.stringify(payload) });
  try {
    await c.query("insert into consultation_products(id,code,name,sessions_count,price_kopeks,duration_minutes,receipt_description) values($1,$2,'Synthetic QA',1,500000,60,'Synthetic QA')", [product, `gate38-${product}`]);
    await c.query("insert into appointment_requests(id,product_id,name,contact,contact_method,message,status,payment_status,scheduled_at,idempotency_key,idempotency_request_hash) values($1,$2,'Synthetic QA','test@example.invalid','telegram','gate38 synthetic','new','not_required',now()+interval '1 day',$3,'hash-a')", [id, product, `gate38:${id}`]);
    for (const secret of ["", "wrong"]) assert.equal((await POST(request(secret, { appointment_id: id }))).status, 401);
    assert.equal((await POST(request("synthetic-test-secret", {}))).status, 400);
    const first = await POST(request("synthetic-test-secret", { appointment_id: id }));
    if (first.status !== 200) console.error("FIRST_RESPONSE", first.status, await first.clone().text());
    assert.equal(first.status, 200);
    const a = await first.json(); assert.equal(a.final_price, 5000);
    const second = await POST(request("synthetic-test-secret", { appointment_id: id })); assert.equal(second.status, 200);
    const b = await second.json(); assert.equal(b.payment_url, a.payment_url); assert.equal(b.reused, true); assert.equal(calls, 1);
    const payment = await c.query("select status,provider_status,amount_kopeks from yookassa_payments where appointment_id=$1", [id]);
    assert.equal(payment.rowCount, 1); assert.equal(payment.rows[0].provider_status, "pending"); assert.equal(payment.rows[0].amount_kopeks, 500000);
    const booking = await c.query("select status,hold_expires_at from appointment_requests where id=$1", [id]);
    assert.equal(booking.rows[0].status, "awaiting_payment"); assert.ok(booking.rows[0].hold_expires_at);
    console.log("REAL_ROUTE_DB_HOLD_PAYMENT_REUSE PASS; PROVIDER MOCK ONLY");
  } finally {
    globalThis.fetch = originalFetch;
    await c.query("delete from appointment_history where appointment_id=$1", [id]);
    await c.query("delete from yookassa_payments where appointment_id=$1", [id]);
    await c.query("delete from appointment_requests where id=$1", [id]);
    await c.query("delete from consultation_products where id=$1", [product]);
    await closeDatabase(); await c.end();
  }
}
main().catch((error) => { console.error("ISOLATED_PAYMENT_TEST_FAILED", error instanceof Error ? error.message : "unknown"); process.exitCode = 1; });
