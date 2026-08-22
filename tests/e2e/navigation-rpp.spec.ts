import { expect, test } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";

import { navigationItems } from "../../src/lib/navigation";

const screenshotDir = path.join(process.cwd(), "audit", "menu-rpp", "stage-2");
const hiddenDrafts = [
  "/rpp/podrostki",
  "/rpp/blizkim",
  "/rpp/slovar",
  "/help/anxiety",
  "/help/trauma-ptsd",
  "/help/eating-disorders",
  "/help/relationships",
  "/help/self-esteem",
  "/help/grief-crisis",
  "/help/teenagers",
  "/help/gestalt",
  "/help/faq",
];
const publishedRppRoutes = [
  "/rpp",
  "/rpp/chto-takoe-rpp",
  "/rpp/priznaki",
  "/rpp/prichiny",
  "/rpp/telo",
  "/rpp/pereedanie",
  "/rpp/diety",
  "/rpp/vidy",
  "/rpp/anoreksiya",
  "/rpp/bulimiya",
  "/rpp/kompulsivnoe-pereedanie",
  "/rpp/arfid",
  "/rpp/drugie-formy",
  "/rpp/lechenie",
  "/rpp/samopomosh",
  "/rpp/faq",
];

test.beforeAll(async () => {
  await fs.mkdir(screenshotDir, { recursive: true });
});

test("desktop menus expose only published destinations and close correctly", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/rpp", { waitUntil: "domcontentloaded" });

  await expect(page.getByRole("button", { name: /меню «Помощь»/ })).toHaveCount(0);
  await page.getByRole("button", { name: "Открыть меню «Энциклопедия РПП»" }).click();
  await expect(page.getByRole("link", { name: "Нервная анорексия" }).first()).toBeVisible();
  for (const href of hiddenDrafts) {
    await expect(page.locator(`header a[href="${href}"]`)).toHaveCount(0);
  }

  await page.keyboard.press("Escape");
  await expect(page.locator('header a[href="/rpp/anoreksiya"]')).toHaveCount(0);
  await page.getByRole("button", { name: "Открыть меню «Статьи»" }).click();
  await expect(page.locator('header a[href="/blog/category/crisis-self-help"]')).toBeVisible();
  await expect(page.locator('header a[href^="/blog/category/"]')).toHaveCount(1);
  await page.locator("main").click({ position: { x: 10, y: 10 } });
  await expect(page.locator('header a[href="/blog/category/crisis-self-help"]')).toBeHidden();
});

test("mobile menu has one open main group, hides drafts and closes after navigation", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/rpp", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Открыть меню" }).click();
  await expect(page.getByRole("button", { name: /раздел «Помощь»/ })).toHaveCount(0);

  await page.getByRole("button", { name: "Развернуть раздел «Энциклопедия РПП»" }).click();
  await page.getByRole("button", { name: "Виды РПП", exact: true }).click();
  const mobileNavigation = page.getByRole("navigation", { name: "Мобильная навигация" });
  await expect(mobileNavigation.getByRole("link", { name: "Нервная булимия" })).toBeVisible();
  for (const href of hiddenDrafts) {
    await expect(mobileNavigation.locator(`a[href="${href}"]`)).toHaveCount(0);
  }

  await mobileNavigation.getByRole("link", { name: "Нервная булимия" }).click();
  await expect(page).toHaveURL(/\/rpp\/bulimiya$/);
  await expect(mobileNavigation).toHaveCount(0);
});

test("desktop and mobile certificates navigation uses the canonical route", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Открыть меню «Обо мне»" }).click();
  const desktopLink = page.locator('header a[href="/certificates"]', { hasText: "Дипломы и сертификаты" });
  await expect(desktopLink).toBeVisible();
  await desktopLink.click();
  await expect(page).toHaveURL(/\/certificates$/);
  await expect(page.getByRole("heading", { name: "Дипломы и сертификаты", level: 1 })).toBeVisible();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Открыть меню" }).click();
  await page.getByRole("button", { name: "Развернуть раздел «Обо мне»" }).click();
  const mobileNavigation = page.getByRole("navigation", { name: "Мобильная навигация" });
  const mobileLink = mobileNavigation.getByRole("link", { name: "Дипломы и сертификаты" });
  await expect(mobileLink).toHaveAttribute("href", "/certificates");
  await mobileLink.click();
  await expect(page).toHaveURL(/\/certificates$/);
  await expect(page.getByRole("heading", { name: "Дипломы и сертификаты", level: 1 })).toBeVisible();
});

test("unknown nested routes return true HTTP 404", async ({ request }) => {
  const routes = [
    "/proverka-neizvestnoy-stranitsy",
    "/help/neizvestnaya-stranitsa",
    "/help/anxiety/neizvestnyy-vlozhennyy-put",
    "/rpp/neizvestnaya-stranitsa",
    "/rpp/vidy/neizvestnaya-forma",
    "/blog/category/neizvestnaya-kategoriya",
    "/about/neizvestnaya-stranitsa",
  ];
  for (const route of routes) {
    expect((await request.get(route)).status(), route).toBe(404);
  }
});

test("published RPP pages and every visible menu link avoid 404 and 5xx", async ({ request }) => {
  for (const route of publishedRppRoutes) {
    expect((await request.get(route)).status(), route).toBe(200);
  }

  const hrefs = new Set<string>();
  for (const item of navigationItems) {
    hrefs.add(item.href);
    item.groups?.forEach((group) => group.links.forEach((link) => hrefs.add(link.href)));
    if (item.menuCta) hrefs.add(item.menuCta.href);
  }
  for (const href of hrefs) {
    const response = await request.get(href, { maxRedirects: 0 });
    expect(response.status(), href).toBeLessThan(400);
  }
});

test("draft placeholders remain directly available and noindex", async ({ page }) => {
  for (const route of hiddenDrafts) {
    const response = await page.goto(route, { waitUntil: "domcontentloaded" });
    expect(response?.status(), route).toBe(200);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/i);
  }
});

test("empty blog categories are noindex and excluded from sitemap", async ({ page, request }) => {
  await page.goto("/blog/category/anxiety", { waitUntil: "domcontentloaded" });
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/i);
  await page.goto("/blog/category/crisis-self-help", { waitUntil: "domcontentloaded" });
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /index/i);

  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).toContain("/blog/category/crisis-self-help");
  expect(sitemap).not.toContain("/blog/category/anxiety");
  for (const route of hiddenDrafts) expect(sitemap).not.toContain(route);
});

test("section active state and permanent redirect remain correct", async ({ page, request }) => {
  for (const [route, href] of [
    ["/rpp/anoreksiya", "/rpp"],
    ["/blog/category/crisis-self-help", "/blog"],
    ["/about", "/about"],
    ["/help", "/help"],
  ]) {
    await page.goto(route, { waitUntil: "domcontentloaded" });
    await page.setViewportSize({ width: 1440, height: 900 });
    await expect(page.locator(`nav[aria-label="Основная навигация"] a[href="${href}"]`)).toHaveClass(/text-\[#332725\]/);
  }

  const redirect = await request.get("/about/education", { maxRedirects: 0 });
  expect(redirect.status()).toBe(301);
  expect(redirect.headers().location).toBe("/certificates");
});

for (const width of [320, 375, 768, 1024, 1280, 1440]) {
  test(`layout has no horizontal overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width < 768 ? 812 : 900 });
    await page.goto("/rpp", { waitUntil: "networkidle" });
    const hasOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(hasOverflow).toBe(false);
    await page.screenshot({
      path: path.join(screenshotDir, `rpp-${width}.png`),
      fullPage: false,
    });
  });
}
