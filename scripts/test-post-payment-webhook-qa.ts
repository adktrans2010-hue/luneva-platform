/*
 * Isolated QA acceptance only.  It calls the real Next.js webhook route and
 * the real QA PostgreSQL database, while a process-local fetch interceptor
 * and SMTP catcher prevent all external provider traffic.
 */
import assert from "node:assert/strict";
import { createServer } from "node:net";
import { config } from "dotenv";
import { eq, sql } from "drizzle-orm";

config({ path: ".env.local" });

const qaUrl = process.env.DATABASE_URL ?? "";
assert.match(qaUrl, /127\.0\.0\.1:55432\/luneva_qa(?:$|[?])/);

type Mode = "ok" | "email-failure" | "telegram-failure" | "owner-failure";
type CapturedMail = { recipient: string; source: string };
type Counters = { clientEmail: number; clientTelegram: number; ownerTelegram: number };

const originalFetch = globalThis.fetch;
const capturedMail: CapturedMail[] = [];
let mode: Mode = "ok";
let activeProviderPayment: Record<string, unknown> = {};
let activeClientEmail = "";
const counters: Counters = { clientEmail: 0, clientTelegram: 0, ownerTelegram: 0 };
const clientTelegramMessages: string[] = [];
const clientChatId = "900002";
const ownerChatId = "900001";

function smtpCatcher() {
  const server = createServer((socket) => {
    let stage = 0;
    let recipient = "";
    let data = "";
    socket.write("220 qa-smtp.local ESMTP\r\n");
    socket.on("data", (chunk) => {
      data += chunk.toString("utf8");
      if (stage === 5) {
        const marker = "\r\n.\r\n";
        if (!data.includes(marker)) return;
        capturedMail.push({ recipient, source: data });
        data = "";
        stage = 0;
        socket.write("250 queued\r\n");
        return;
      }
      const lines = data.split(/\r?\n/).filter(Boolean);
      data = "";
      for (const line of lines) {
        if (/^EHLO /i.test(line)) socket.write("250 qa-smtp.local\r\n");
        else if (line === "AUTH LOGIN" || stage === 1 || stage === 2) {
          stage += 1;
          socket.write(stage >= 3 ? "235 authenticated\r\n" : "334 continue\r\n");
        } else if (/^MAIL FROM:/i.test(line)) socket.write("250 sender ok\r\n");
        else if (/^RCPT TO:/i.test(line)) {
          recipient = line.match(/<([^>]+)>/i)?.[1]?.toLowerCase() ?? "";
          const fail =
            (mode === "email-failure" && recipient === activeClientEmail) ||
            (mode === "owner-failure" && recipient !== activeClientEmail);
          socket.write(fail ? "550 forced QA failure\r\n" : "250 recipient ok\r\n");
        } else if (line === "DATA") {
          stage = 5;
          socket.write("354 send data\r\n");
        } else if (line === "QUIT") socket.write("221 bye\r\n");
      }
    });
  });
  return new Promise<{ server: ReturnType<typeof createServer>; port: number }>((resolve) =>
    server.listen(0, "127.0.0.1", () => resolve({ server, port: (server.address() as { port: number }).port }))
  );
}

function installFetchMock() {
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url.startsWith("https://api.yookassa.ru/v3/payments/")) {
      return new Response(JSON.stringify(activeProviderPayment), { status: 200, headers: { "content-type": "application/json" } });
    }
    if (url.startsWith("https://api.telegram.org/")) {
      const body = JSON.parse(String(init?.body ?? "{}")) as { chat_id?: string; text?: string };
      if ((mode === "telegram-failure" && body.chat_id === clientChatId) || (mode === "owner-failure" && body.chat_id === ownerChatId)) {
        throw new Error("forced QA Telegram failure");
      }
      if (body.chat_id === clientChatId) {
        counters.clientTelegram += 1;
        clientTelegramMessages.push(body.text ?? "");
      }
      if (body.chat_id === ownerChatId) counters.ownerTelegram += 1;
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "content-type": "application/json" } });
    }
    throw new Error(`Unexpected network request in QA harness: ${url}`);
  }) as typeof fetch;
}

async function main() {
  const { server, port } = await smtpCatcher();
  process.env.YOOKASSA_SHOP_ID = "qa-shop";
  process.env.YOOKASSA_SECRET_KEY = "qa-secret";
  process.env.TELEGRAM_BOT_TOKEN = "qa-test-token";
  process.env.TELEGRAM_OWNER_CHAT_ID = ownerChatId;
  process.env.SMTP_HOST = "127.0.0.1";
  process.env.SMTP_PORT = String(port);
  process.env.SMTP_USER = "qa-user";
  process.env.SMTP_PASSWORD = "qa-password";
  process.env.SMTP_SECURE = "false";
  process.env.SMTP_FROM = "qa-sender@local.test";
  installFetchMock();

  const { POST } = await import("../app/api/yookassa/webhook/route");
  const { db, closeDatabase } = await import("../src/db");
  const schema = await import("../src/db/schema");
  const { getAvailableAppointmentDays } = await import("../src/lib/appointment-slots");
  const { expireStalePaymentHolds } = await import("../src/lib/booking-holds");
  const token = `qa-webhook-${Date.now()}`;
  const fixtureAvailabilityDates: string[] = [];

  const removeFixtures = async () => {
    await db.execute(sql`delete from account_invitations where email like ${`${token}%`}`);
    await db.execute(sql`delete from appointment_requests where contact like ${`${token}%`}`);
    await db.execute(sql`delete from consultation_products where code like ${`${token}%`}`);
    for (const date of fixtureAvailabilityDates) {
      await db.delete(schema.appointmentAvailability).where(eq(schema.appointmentAvailability.date, date));
    }
  };

  const createFixture = async (suffix: string, expiresAt?: Date) => {
    const dayOffset = suffix === "paid" ? 14 : suffix === "expiry" ? 15 : 16;
    const date = new Date(Date.now() + dayOffset * 24 * 60 * 60_000);
    const minute = 10 + (Number(token.slice(-2)) % 40);
    date.setHours(15, minute, 0, 0);
    const day = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    const time = `15:${String(minute).padStart(2, "0")}`;
    const marker = `${token}-${suffix}`;
    const [product] = await db.insert(schema.consultationProducts).values({
      code: marker, name: "QA консультация", sessionsCount: 1, priceKopeks: 350000,
      durationMinutes: 60, receiptDescription: "QA консультация", paymentSubject: "service", paymentMode: "full_payment", vatCode: 1,
    }).returning();
    if (suffix === "paid" || suffix === "expiry") {
      await db.insert(schema.appointmentAvailability).values({ date: day, time, consultationFormat: "online", consultationLocation: "online" });
      fixtureAvailabilityDates.push(day);
    }
    const [appointment] = await db.insert(schema.appointmentRequests).values({
      productId: product.id, name: "QA Webhook Client", contact: `${marker}@local.test`, normalizedEmail: `${marker}@local.test`,
      contactMethod: "telegram", consultationFormat: "online", consultationLocation: "online", message: "synthetic QA only",
      scheduledAt: date, status: "awaiting_payment", paymentMethod: "online", paymentStatus: "waiting",
      holdExpiresAt: expiresAt ?? new Date(Date.now() + 60 * 60_000), attribution: { telegram_user_id: clientChatId },
      basePriceKopeksSnapshot: 350000, finalPriceKopeksSnapshot: 350000,
    }).returning();
    activeClientEmail = appointment.normalizedEmail ?? "";
    const [payment] = await db.insert(schema.yookassaPayments).values({
      appointmentId: appointment.id, provider: "yookassa", providerPaymentId: `qa-provider-${marker}`, idempotenceKey: `qa-idem-${marker}`,
      amountKopeks: 350000, currency: "RUB", productId: product.id, productCodeSnapshot: product.code, productNameSnapshot: product.name,
      sessionsCountSnapshot: 1, priceKopeksSnapshot: 350000, currencySnapshot: "RUB", durationMinutesSnapshot: 60,
      receiptDescriptionSnapshot: "QA консультация", status: "waiting", providerStatus: "pending",
    }).returning();
    return { product, appointment, payment, date, day, time };
  };

  const invoke = async (payment: { id: string; appointmentId: string; providerPaymentId: string | null; productId: string | null; productCodeSnapshot: string | null }) => {
    activeProviderPayment = {
      id: payment.providerPaymentId, status: "succeeded", paid: true,
      amount: { value: "3500.00", currency: "RUB" },
      confirmation: { type: "redirect", confirmation_url: "https://qa.local/payment" },
      metadata: { appointmentId: payment.appointmentId, internalPaymentId: payment.id, productId: payment.productId, productCode: payment.productCodeSnapshot },
    };
    return POST(new Request("http://qa.local/api/yookassa/webhook", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ event: "payment.succeeded", object: { id: payment.providerPaymentId } }) }));
  };

  try {
    await removeFixtures();
    mode = "ok";
    const baseline = await createFixture("paid");
    const first = await invoke(baseline.payment);
    assert.equal(first.status, 200);
    const [paid] = await db.select().from(schema.yookassaPayments).where(eq(schema.yookassaPayments.id, baseline.payment.id));
    const [confirmed] = await db.select().from(schema.appointmentRequests).where(eq(schema.appointmentRequests.id, baseline.appointment.id));
    assert.equal(paid.status, "paid"); assert.equal(confirmed.status, "confirmed"); assert.equal(confirmed.paymentStatus, "paid");
    assert.ok(paid.processedAt); assert.ok(paid.notifiedAt);
    assert.deepEqual(counters, { clientEmail: 0, clientTelegram: 1, ownerTelegram: 1 });
    counters.clientEmail = capturedMail.filter((mail) => mail.recipient === baseline.appointment.normalizedEmail).length;
    assert.equal(counters.clientEmail, 1);
    const clientMail = capturedMail.find((mail) => mail.recipient === baseline.appointment.normalizedEmail)?.source ?? "";
    for (const value of ["QA консультация", baseline.time, "Онлайн", "В ближайшее время Александра свяжется"]) assert.match(clientMail, new RegExp(value));
    assert.doesNotMatch(clientMail, /[0-9a-f]{8}-[0-9a-f]{4}-/i);
    const clientTelegram = clientTelegramMessages.at(-1) ?? "";
    for (const value of ["QA консультация", baseline.time, "Онлайн", "В ближайшее время Александра свяжется"]) assert.match(clientTelegram, new RegExp(value));
    assert.doesNotMatch(clientTelegram, /[0-9a-f]{8}-[0-9a-f]{4}-/i);
    const duplicate = await invoke(baseline.payment);
    assert.equal(duplicate.status, 200);
    assert.equal(capturedMail.filter((mail) => mail.recipient === baseline.appointment.normalizedEmail).length, 1);
    assert.equal(counters.clientTelegram, 1); assert.equal(counters.ownerTelegram, 1);

    for (const failureMode of ["email-failure", "telegram-failure", "owner-failure"] as const) {
      mode = failureMode;
      const fixture = await createFixture(failureMode);
      const beforeFailure = { ...counters };
      const response = await invoke(fixture.payment);
      assert.equal(response.status, 200);
      const [failurePayment] = await db.select().from(schema.yookassaPayments).where(eq(schema.yookassaPayments.id, fixture.payment.id));
      const [failureAppointment] = await db.select().from(schema.appointmentRequests).where(eq(schema.appointmentRequests.id, fixture.appointment.id));
      assert.equal(failurePayment.status, "paid"); assert.equal(failureAppointment.status, "confirmed");
      assert.ok(failurePayment.processedAt);
      if (failureMode === "email-failure") {
        assert.equal(capturedMail.filter((mail) => mail.recipient === fixture.appointment.normalizedEmail).length, 0);
      }
      if (failureMode === "telegram-failure") assert.equal(counters.clientTelegram, beforeFailure.clientTelegram);
      if (failureMode === "owner-failure") {
        assert.equal(counters.ownerTelegram, beforeFailure.ownerTelegram);
        assert.equal(failurePayment.notifiedAt, null);
      }
    }

    mode = "ok";
    // PostgreSQL stores this contract as timestamp without time zone.  Keep the
    // QA hold safely future relative to the local database clock, then advance
    // the same controlled clock by 61 minutes beyond its logical expiry.
    const expiry = await createFixture("expiry", new Date(Date.now() + 4 * 60 * 60_000));
    const before = await getAvailableAppointmentDays(expiry.day, 1, "online", "online");
    assert.equal(before.flatMap((entry) => entry.slots).includes(expiry.time), false, JSON.stringify(before));
    assert.ok(await expireStalePaymentHolds(new Date(Date.now() + 5 * 60 * 60_000 + 60_000)) >= 1);
    const [expired] = await db.select().from(schema.appointmentRequests).where(eq(schema.appointmentRequests.id, expiry.appointment.id));
    assert.equal(expired.status, "expired"); assert.equal(expired.paymentStatus, "failed");
    const after = await getAvailableAppointmentDays(expiry.day, 1, "online", "online");
    assert.equal(after.flatMap((entry) => entry.slots).includes(expiry.time), true, JSON.stringify(after));

    console.log("post-payment webhook QA harness: PASS");
  } finally {
    await removeFixtures().catch(() => undefined);
    globalThis.fetch = originalFetch;
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await closeDatabase();
  }
}

main().catch((error) => {
  console.error("post-payment webhook QA harness: FAIL", error instanceof Error ? error.message : "unknown");
  process.exitCode = 1;
});
