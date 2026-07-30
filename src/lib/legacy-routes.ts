export type LegacyRouteAction = "redirect" | "gone";

type LegacyRouteBase = {
  action: LegacyRouteAction;
  reason: string;
};

export type LegacyRedirectRoute = LegacyRouteBase & {
  action: "redirect";
  destination: string;
};

export type LegacyGoneRoute = LegacyRouteBase & {
  action: "gone";
};

export type LegacyRoute = LegacyRedirectRoute | LegacyGoneRoute;

const wordpressPreviewParameters = new Set([
  "elementor-preview",
  "ver",
  "preview",
  "preview_id",
  "preview_nonce",
]);

const exactRoutes: Record<string, LegacyRoute> = {
  "/contact-us": {
    action: "redirect",
    destination: "/contacts",
    reason: "Legacy contact page has a canonical replacement.",
  },
  "/useful-articles": {
    action: "redirect",
    destination: "/blog",
    reason: "Legacy article index has a canonical replacement.",
  },
  "/luneva-psy-biography": {
    action: "redirect",
    destination: "/about",
    reason: "Legacy biography has a canonical replacement.",
  },
  "/psychological-help": {
    action: "redirect",
    destination: "/help",
    reason: "Legacy help page has a canonical replacement.",
  },
  "/about/education": {
    action: "redirect",
    destination: "/certificates",
    reason: "Legacy education page has a canonical replacement.",
  },
  "/help/eating-disorders": {
    action: "redirect",
    destination: "/rpp",
    reason: "Legacy help topic has a canonical replacement.",
  },
  "/help/trauma-ptsd": {
    action: "redirect",
    destination: "/help/grief-crisis",
    reason: "Legacy help topic has a canonical replacement.",
  },
  "/sample-page": { action: "gone", reason: "WordPress test page." },
  "/sample-page-2": { action: "gone", reason: "WordPress test page." },
  "/hello-world": { action: "gone", reason: "WordPress test post." },
  "/feed": { action: "gone", reason: "Legacy WordPress RSS feed." },
  "/comments/feed": { action: "gone", reason: "Legacy WordPress comments feed." },
  "/wp-json": { action: "gone", reason: "Legacy WordPress API endpoint." },
  "/xmlrpc.php": { action: "gone", reason: "Legacy WordPress XML-RPC endpoint." },
  "/2023/07/17/как-фэтшейминг-влияет-на-пищевое-пове": {
    action: "redirect",
    destination: "/blog/rasstroystva-pischevogo-povedeniya-i-vliyanie-sredy",
    reason: "Exact modern article about fat-shaming and eating disorders.",
  },
};

const GONE_PREFIXES = ["/author/", "/category/", "/tag/", "/wp-admin/"];
const REDIRECT_PREFIXES: Array<[string, LegacyRedirectRoute]> = [
  ["/contact-us/", { action: "redirect", destination: "/contacts", reason: "Legacy contact page has a canonical replacement." }],
  ["/useful-articles/", { action: "redirect", destination: "/blog", reason: "Legacy article index has a canonical replacement." }],
  ["/luneva-psy-biography/", { action: "redirect", destination: "/about", reason: "Legacy biography has a canonical replacement." }],
  ["/psychological-help/", { action: "redirect", destination: "/help", reason: "Legacy help page has a canonical replacement." }],
];
const DATE_ARCHIVE_PATTERN = /^\/\d{4}(?:\/\d{1,2})?(?:\/\d{1,2})?$/;

function normalizePathname(pathname: string) {
  const decoded = decodeURIComponent(pathname);
  return decoded.length > 1 && decoded.endsWith("/")
    ? decoded.slice(0, -1)
    : decoded;
}

export function getLegacyRoute(pathname: string): LegacyRoute | undefined {
  const normalizedPathname = normalizePathname(pathname);
  const exactRoute = exactRoutes[normalizedPathname];

  if (exactRoute) return exactRoute;

  const prefixRoute = REDIRECT_PREFIXES.find(([prefix]) =>
    normalizedPathname.startsWith(prefix),
  );

  if (prefixRoute) return prefixRoute[1];

  if (
    GONE_PREFIXES.some((prefix) => normalizedPathname.startsWith(prefix)) ||
    DATE_ARCHIVE_PATTERN.test(normalizedPathname) ||
    normalizedPathname === "/wp-admin"
  ) {
    return { action: "gone", reason: "Obsolete WordPress archive or service URL." };
  }

  return undefined;
}

export function hasWordPressQuery(url: URL) {
  return ["feed", "p", "page_id", "author", "cat", "m"].some((parameter) =>
    url.searchParams.has(parameter),
  );
}

export function hasWordPressPreviewParameters(url: URL) {
  return [...wordpressPreviewParameters].some((parameter) =>
    url.searchParams.has(parameter),
  );
}

export function stripWordPressPreviewParameters(url: URL) {
  for (const parameter of wordpressPreviewParameters) {
    url.searchParams.delete(parameter);
  }
}
