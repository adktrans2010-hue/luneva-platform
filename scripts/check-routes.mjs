const baseUrl = process.env.CHECK_ROUTES_BASE_URL ?? "http://localhost:3000";

const routes = [
  { path: "/", h1: false },
  { path: "/about" },
  { path: "/help" },
  { path: "/reviews" },
  { path: "/blog" },
  { path: "/contacts" },
  { path: "/certificates" },
  { path: "/faq" },
  { path: "/login" },
  { path: "/account", redirect: "/login?next=/account", h1: false },
  { path: "/legal/terms" },
  { path: "/legal/privacy" },
  { path: "/legal/consent" },
  { path: "/legal/cookies" },
  { path: "/register" },
  { path: "/forgot-password" },
  { path: "/videos" },
];

function stripTags(html) {
  return html.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "");
}

function hasTitle(html) {
  return /<title[^>]*>\s*[^<]+\s*<\/title>/i.test(html);
}

function h1Count(html) {
  return (stripTags(html).match(/<h1(\s|>)/gi) ?? []).length;
}

function locationMatchesRedirect(location, expectedRedirect) {
  if (location.includes(expectedRedirect)) return true;

  try {
    const locationUrl = new URL(location, baseUrl);
    const expectedUrl = new URL(expectedRedirect, baseUrl);

    return (
      locationUrl.pathname === expectedUrl.pathname &&
      locationUrl.searchParams.get("next") === expectedUrl.searchParams.get("next")
    );
  } catch {
    return false;
  }
}

async function checkRoute(route) {
  const url = new URL(route.path, baseUrl);
  const response = await fetch(url, { redirect: "manual" });
  const location = response.headers.get("location") ?? "";

  if (route.redirect) {
    if (![301, 302, 303, 307, 308].includes(response.status)) {
      throw new Error(`${route.path}: expected redirect, got HTTP ${response.status}`);
    }

    if (!locationMatchesRedirect(location, route.redirect)) {
      throw new Error(`${route.path}: expected redirect to ${route.redirect}, got ${location}`);
    }

    return;
  }

  if (response.status === 404 || response.status >= 500) {
    throw new Error(`${route.path}: unexpected HTTP ${response.status}`);
  }

  if (response.status >= 300 && response.status < 400) {
    throw new Error(`${route.path}: unexpected redirect to ${location}`);
  }

  const html = await response.text();

  if (html.trim().length < 100) {
    throw new Error(`${route.path}: empty or too small HTML response`);
  }

  if (/Internal Server Error/i.test(html)) {
    throw new Error(`${route.path}: response contains Internal Server Error`);
  }

  if (!hasTitle(html)) {
    throw new Error(`${route.path}: missing title`);
  }

  if (route.h1 !== false && h1Count(html) < 1) {
    throw new Error(`${route.path}: missing h1`);
  }
}

const failures = [];

for (const route of routes) {
  try {
    await checkRoute(route);
    console.info(`OK ${route.path}`);
  } catch (error) {
    failures.push(error instanceof Error ? error.message : String(error));
  }
}

if (failures.length > 0) {
  console.error("Route check failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.info("Route check passed.");
