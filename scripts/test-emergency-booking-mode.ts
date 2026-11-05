import assert from "node:assert/strict";

async function run() {
  process.env.DATABASE_URL = "postgres://emergency:disabled@127.0.0.1:1/emergency";
  process.env.EMERGENCY_BOOKING_DISABLED = "true";

  const { POST } = await import("@/app/api/appointments/route");
  const response = await POST(
    new Request("http://localhost/api/appointments", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    })
  );
  const body = (await response.json()) as { error?: string };

  assert.equal(response.status, 503);
  assert.equal(
    body.error,
    "Онлайн-запись временно недоступна из-за технических работ. Пожалуйста, свяжитесь с Александрой напрямую."
  );

  console.log("Emergency booking gate PASS");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
