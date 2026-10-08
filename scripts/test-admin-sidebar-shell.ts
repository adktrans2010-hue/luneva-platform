import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";

import {
  getVisibleAdminNavigation,
  isAdminAuthPath,
  isAdminNavigationItemActive,
} from "../src/lib/admin-navigation";

const allItems = (role: "admin" | "clinical_admin") => getVisibleAdminNavigation(role).flatMap((group) => group.items);
const byHref = (role: "admin" | "clinical_admin", href: string) => {
  const item = allItems(role).find((candidate) => candidate.href === href);
  assert.ok(item, `Missing ${href} for ${role}`);
  return item;
};

async function main() {
  const adminItems = allItems("admin");
  const clinicalItems = allItems("clinical_admin");

  assert.ok(adminItems.some((item) => item.href === "/admin/appointments"));
  assert.ok(!adminItems.some((item) => item.href === "/admin/ai/conversations"));
  assert.ok(!adminItems.some((item) => item.href === "/admin/ai/attention"));
  assert.ok(!adminItems.some((item) => item.href === "/admin/ai/pilot"));
  assert.ok(clinicalItems.some((item) => item.href === "/admin/ai/conversations"));
  assert.ok(clinicalItems.some((item) => item.href === "/admin/ai/attention"));
  assert.ok(clinicalItems.some((item) => item.href === "/admin/ai/pilot"));

  assert.ok(isAdminNavigationItemActive(byHref("admin", "/admin/appointments"), "/admin/appointments"));
  assert.ok(isAdminNavigationItemActive(byHref("admin", "/admin/clients"), "/admin/clients"));
  assert.ok(isAdminNavigationItemActive(byHref("admin", "/admin/site-life"), "/admin/site-life"));
  assert.ok(!isAdminNavigationItemActive(byHref("admin", "/admin/site-life"), "/admin/site-life", "?tab=advertising"));
  assert.ok(isAdminNavigationItemActive(byHref("admin", "/admin/site-life?tab=advertising"), "/admin/site-life", "?tab=advertising"));
  assert.ok(isAdminNavigationItemActive(byHref("admin", "/admin/ai/knowledge"), "/admin/ai/knowledge"));
  assert.ok(isAdminNavigationItemActive(byHref("clinical_admin", "/admin/ai/conversations"), "/admin/ai/conversations/example-id"));
  assert.ok(!isAdminNavigationItemActive(byHref("admin", "/admin/appointments#payments"), "/admin/appointments"));

  assert.ok(isAdminAuthPath("/admin/login"));
  assert.ok(isAdminAuthPath("/admin/password"));
  assert.ok(isAdminAuthPath("/admin/mfa-enroll"));
  assert.ok(!isAdminAuthPath("/admin/appointments"));

  const [shell, mobile, sidebar, layout] = await Promise.all([
    readFile(new URL("../components/admin/admin-shell.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/admin/admin-mobile-navigation.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/admin/admin-sidebar.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/admin/layout.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(shell, /isAdminAuthPath\(pathname\)/u);
  assert.match(shell, /<AdminSidebar/u);
  assert.match(shell, /<AdminMobileNavigation/u);
  assert.match(mobile, /event\.key === "Escape"/u);
  assert.match(mobile, /event\.key !== "Tab"/u);
  assert.match(mobile, /onClick=\{\(\) => setOpen\(true\)\}/u);
  assert.match(mobile, /const closeDrawer = \(\) => setOpen\(false\)/u);
  assert.match(mobile, /aria-label="Закрыть навигацию"/u);
  assert.match(mobile, /onNavigate=\{closeDrawer\}/u);
  assert.match(mobile, /aria-modal="true"/u);
  assert.match(sidebar, /w-\[232px\]/u);
  assert.match(layout, /<AdminShell role=\{role\}>/u);

  console.log("admin sidebar shell checks: PASS");
}

void main();
