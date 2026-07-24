import { mkdir, writeFile } from "node:fs/promises";

const baseUrl = process.env.AUDIT_BASE_URL ?? "http://localhost:3000";

const publicRoutes = [
  "/",
  "/about",
  "/help",
  "/reviews",
  "/blog",
  "/contacts",
  "/certificates",
  "/faq",
  "/videos",
  "/login",
  "/register",
  "/forgot-password",
  "/account",
  "/legal/terms",
  "/legal/privacy",
  "/legal/consent",
  "/legal/cookies",
  "/robots.txt",
  "/sitemap.xml",
  "/manifest.webmanifest",
  "/payment/status",
  "/requisites",
];

const legacyRoutes = [
  { path: "/contact-us/", expected: "/contacts" },
  { path: "/useful-articles/", expected: "/blog" },
  { path: "/luneva-psy-biography/", expected: "/about" },
  { path: "/psychological-help/", expected: "/help" },
  { path: "/?page_id=812", expected: "/blog" },
];

function absolute(path) {
  return new URL(path, baseUrl).toString();
}

function cleanHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "");
}

function firstMatch(html, regex) {
  return html.match(regex)?.[1]?.trim() ?? null;
}

function metaContent(html, name) {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return (
    firstMatch(
      html,
      new RegExp(`<meta[^>]+name=["']${escapedName}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i"),
    ) ??
    firstMatch(
      html,
      new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${escapedName}["'][^>]*>`, "i"),
    )
  );
}

function linkHref(html, rel) {
  const escapedRel = rel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return (
    firstMatch(
      html,
      new RegExp(`<link[^>]+rel=["']${escapedRel}["'][^>]+href=["']([^"']+)["'][^>]*>`, "i"),
    ) ??
    firstMatch(
      html,
      new RegExp(`<link[^>]+href=["']([^"']+)["'][^>]+rel=["']${escapedRel}["'][^>]*>`, "i"),
    )
  );
}

function h1List(html) {
  return Array.from(cleanHtml(html).matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)).map((match) =>
    match[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
  );
}

function internalLinks(html) {
  return Array.from(html.matchAll(/<a[^>]+href=["']([^"']+)["'][^>]*>/gi))
    .map((match) => match[1])
    .filter((href) => href.startsWith("/") && !href.startsWith("//"))
    .slice(0, 200);
}

function imageSources(html) {
  return Array.from(html.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi))
    .map((match) => match[1])
    .filter((src) => src.startsWith("/") && !src.startsWith("//"))
    .slice(0, 200);
}

async function auditPage(path) {
  const response = await fetch(absolute(path), { redirect: "manual" });
  const location = response.headers.get("location");
  const contentType = response.headers.get("content-type") ?? "";
  const html = contentType.includes("text/html") ? await response.text() : "";
  const h1 = html ? h1List(html) : [];
  const issues = [];

  if (response.status === 404 || response.status >= 500) {
    issues.push({ priority: "P0", message: `Unexpected HTTP ${response.status}` });
  }

  if (contentType.includes("text/html")) {
    if (html.trim().length < 100) issues.push({ priority: "P0", message: "Empty or too small HTML" });
    if (!firstMatch(html, /<title[^>]*>([^<]+)<\/title>/i)) {
      issues.push({ priority: "P1", message: "Missing title" });
    }
    if (!metaContent(html, "description")) {
      issues.push({ priority: "P1", message: "Missing meta description" });
    }
    if (path !== "/" && h1.length < 1) {
      issues.push({ priority: "P1", message: "Missing h1" });
    }
  }

  return {
    path,
    status: response.status,
    finalUrl: absolute(path),
    location,
    contentType,
    title: html ? firstMatch(html, /<title[^>]*>([^<]+)<\/title>/i) : null,
    description: html ? metaContent(html, "description") : null,
    canonical: html ? linkHref(html, "canonical") : null,
    robots: html ? metaContent(html, "robots") : null,
    h1,
    internalLinkCount: html ? internalLinks(html).length : 0,
    imageCount: html ? imageSources(html).length : 0,
    issues,
  };
}

function samePath(location, expectedPath) {
  if (!location) return false;
  const actualUrl = new URL(location, baseUrl);
  const expectedUrl = new URL(expectedPath, baseUrl);
  return actualUrl.pathname === expectedUrl.pathname;
}

async function auditLegacyRedirect(route) {
  const response = await fetch(absolute(route.path), { redirect: "manual" });
  const location = response.headers.get("location");
  const permanent = response.status === 301 || response.status === 308;
  const targetOk = samePath(location, route.expected);
  const issues = [];

  if (!permanent) issues.push({ priority: "P1", message: `Expected 301/308, got ${response.status}` });
  if (!targetOk) issues.push({ priority: "P1", message: `Expected redirect to ${route.expected}, got ${location}` });

  return {
    path: route.path,
    expected: route.expected,
    status: response.status,
    location,
    permanent,
    targetOk,
    issues,
  };
}

const pages = [];
for (const route of publicRoutes) {
  pages.push(await auditPage(route));
}

const legacy = [];
for (const route of legacyRoutes) {
  legacy.push(await auditLegacyRedirect(route));
}

const criticalIssues = [...pages, ...legacy].flatMap((item) =>
  item.issues.filter((issue) => issue.priority === "P0").map((issue) => ({ path: item.path, ...issue })),
);

const result = {
  auditedAt: new Date().toISOString(),
  baseUrl,
  pages,
  legacy,
  criticalIssues,
};

await mkdir("audit/results", { recursive: true });
await writeFile("audit/results/routes.json", `${JSON.stringify(result, null, 2)}\n`, "utf8");

console.info(`Audited ${pages.length} public routes and ${legacy.length} legacy redirects.`);
console.info(`Critical issues: ${criticalIssues.length}`);

if (criticalIssues.length > 0) {
  for (const issue of criticalIssues) {
    console.error(`${issue.priority} ${issue.path}: ${issue.message}`);
  }
  process.exit(1);
}
