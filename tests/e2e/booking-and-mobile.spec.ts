import { expect, test } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";

type AppointmentPayload = {
  appointmentTime?: string;
  legalConsent?: boolean;
  attribution?: {
    first?: Record<string, string>;
    last?: Record<string, string>;
  };
};

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("luneva_cookie_consent", "accepted");
  });

  await page.route("**/api/analytics", async (route) => {
    await route.fulfill({ status: 204, body: "" });
  });

  await page.route("**/api/appointments/availability**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ slots: ["10:00", "12:00"] }),
    });
  });

  await page.route("https://yandex.ru/**", async (route) => {
    await route.abort();
  });

  await page.route("https://yookassa.example.test/**", async (route) => {
    await route.fulfill({ status: 200, contentType: "text/html", body: "<p>Test payment page</p>" });
  });
});

test("public booking path creates appointment with attribution and without external side effects", async ({
  page,
}) => {
  let appointmentPayload: AppointmentPayload = {};
  let appointmentRequestReceived = false;

  await page.route("**/api/appointments", async (route) => {
    const request = route.request();

    if (request.method() !== "POST") {
      await route.continue();
      return;
    }

    appointmentPayload = request.postDataJSON() as AppointmentPayload;
    appointmentRequestReceived = true;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: "appointment-e2e",
        paymentUrl: "https://yookassa.example.test/payment/appointment-e2e",
      }),
    });
  });

  await page.goto(
    "/contacts?utm_source=yandex&utm_medium=cpc&utm_campaign=launch&yclid=123456",
    { waitUntil: "domcontentloaded" },
  );

  const form = page.locator("form").last();
  await expect(form).toBeVisible();

  await form.getByPlaceholder("Ваше имя").fill("Test Client");
  await form.getByPlaceholder("email@example.ru").fill("test-client@example.test");

  const date = new Date();
  date.setDate(date.getDate() + 7);
  await Promise.all([
    page.waitForResponse((response) =>
      response.url().includes("/api/appointments/availability"),
    ),
    form.locator('input[type="date"]').fill(date.toISOString().slice(0, 10)),
  ]);

  await form.getByRole("button", { name: "10:00" }).click();
  await form.locator('input[name="legalConsent"]').check();
  const submit = form.getByRole("button", { name: "Оплатить и записаться" });
  await expect(submit).toBeEnabled();
  await submit.click();

  await expect(page).toHaveURL("https://yookassa.example.test/payment/appointment-e2e");

  expect(appointmentRequestReceived).toBe(true);

  expect(appointmentPayload).toMatchObject({
    appointmentTime: "10:00",
    legalConsent: true,
  });

  expect(appointmentPayload.attribution).toMatchObject({
    first: {
      utm_source: "yandex",
      utm_medium: "cpc",
      utm_campaign: "launch",
      yclid: "123456",
    },
    last: {
      utm_source: "yandex",
      utm_medium: "cpc",
      utm_campaign: "launch",
      yclid: "123456",
    },
  });
});

test("key public pages render without horizontal overflow on mobile and desktop", async ({
  page,
}) => {
  const screenshotDir = path.join(process.cwd(), "audit", "screenshots-final");
  await fs.mkdir(screenshotDir, { recursive: true });

  const routes = [
    { path: "/", name: "home" },
    { path: "/contacts", name: "contacts" },
    { path: "/reviews", name: "reviews" },
    { path: "/blog", name: "blog" },
    { path: "/payment/status", name: "payment-status" },
  ];
  const viewports = [
    { width: 390, height: 844, name: "mobile" },
    { width: 1440, height: 1000, name: "desktop" },
  ];

  for (const viewport of viewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });

    for (const route of routes) {
      await page.goto(route.path, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(300);

      const metrics = await page.evaluate(() => ({
        bodyTextLength: document.body.innerText.trim().length,
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));

      expect(metrics.bodyTextLength).toBeGreaterThan(50);
      expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 2);

      await page.screenshot({
        path: path.join(screenshotDir, `${route.name}-${viewport.name}.png`),
        fullPage: false,
      });
    }
  }
});
