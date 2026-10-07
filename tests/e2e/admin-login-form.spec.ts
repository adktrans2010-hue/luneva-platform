import { expect, test } from "@playwright/test";

const email = "luneva.shura@yandex.ru";

test("admin login enables submit only for complete password and six-digit MFA", async ({ page }) => {
  await page.goto("/admin/login", { waitUntil: "networkidle" });

  const submit = page.getByRole("button", { name: "Войти" });
  await expect(submit).toBeDisabled();

  await page.locator("#admin-email").fill(`  ${email}  `);
  await page.locator("#admin-password").fill("test-password-only");
  await page.locator("#admin-totp").fill("123456");
  await expect(submit).toBeEnabled();

  await page.locator("#admin-totp").fill("12345x");
  await expect(submit).toBeDisabled();
  await expect(page.locator("#admin-totp-error")).toContainText("шестизначный код");

  await page.locator("#admin-totp").fill("123456");
  await page.locator("#admin-password").fill("");
  await expect(submit).toBeDisabled();
});

test("admin login synchronizes autofill-like native input changes", async ({ page }) => {
  await page.goto("/admin/login", { waitUntil: "networkidle" });

  await page.evaluate(({ email: autofillEmail }) => {
    const setValue = (selector: string, value: string) => {
      const input = document.querySelector<HTMLInputElement>(selector);
      if (!input) throw new Error(`Missing ${selector}`);
      input.value = value;
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
      input.dispatchEvent(new FocusEvent("blur", { bubbles: true }));
    };

    setValue("#admin-email", ` ${autofillEmail} `);
    setValue("#admin-password", "browser-autofill-value");
    setValue("#admin-totp", "654321");
  }, { email });

  await expect(page.getByRole("button", { name: "Войти" })).toBeEnabled();
});
