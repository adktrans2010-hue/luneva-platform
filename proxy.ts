import { NextRequest, NextResponse } from "next/server";

import {
  ADMIN_COOKIE_NAME,
  ADMIN_BOOTSTRAP_COOKIE_NAME,
  ADMIN_SESSION_MAX_AGE,
  authorizeAdminBootstrap,
  authorizeAdminSession,
  renewAdminSessionToken,
} from "@/src/lib/admin-auth";
import {
  getUserIdFromSession,
  USER_COOKIE_NAME,
} from "@/src/lib/user-session";
import {
  ensureAdminCsrfCookie,
  hasValidCsrfToken,
  hasValidRequestSource,
  isUnsafeRequest,
} from "@/src/lib/admin-security";
import { getArticleRedirect } from "@/src/lib/article-archive";
import {
  getLegacyRoute,
  hasWordPressPreviewParameters,
  hasWordPressQuery,
  stripWordPressPreviewParameters,
} from "@/src/lib/legacy-routes";

const publicAdminPaths = new Set([
  "/admin/login",
  "/api/admin/login",
  "/api/admin/google/start",
  "/api/admin/google/callback",
]);
const bootstrapAdminPaths = new Set([
  "/admin/password",
  "/api/admin/password",
  "/admin/mfa-enroll",
  "/api/admin/mfa-enroll",
]);

function legacyPageIdRedirect(request: NextRequest) {
  if (request.nextUrl.pathname !== "/") return null;
  if (request.nextUrl.searchParams.get("page_id") !== "812") return null;

  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = "/blog";
  redirectUrl.searchParams.delete("page_id");

  return NextResponse.redirect(redirectUrl, 301);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const pageIdRedirect = legacyPageIdRedirect(request);

  if (pageIdRedirect) {
    return pageIdRedirect;
  }

  const legacyRoute = getLegacyRoute(pathname);

  if (legacyRoute?.action === "gone") {
    return new NextResponse(null, { status: 410 });
  }

  if (legacyRoute?.action === "redirect") {
    return NextResponse.redirect(new URL(legacyRoute.destination, request.url), 301);
  }

  if (pathname === "/" && hasWordPressQuery(request.nextUrl)) {
    return new NextResponse(null, { status: 410 });
  }

  if (pathname === "/about" && hasWordPressPreviewParameters(request.nextUrl)) {
    const redirectUrl = request.nextUrl.clone();
    stripWordPressPreviewParameters(redirectUrl);
    return NextResponse.redirect(redirectUrl, 301);
  }

  if (pathname.startsWith("/blog/")) {
    const slug = decodeURIComponent(pathname.replace(/^\/blog\//, "").replace(/\/$/, ""));
    const targetSlug = getArticleRedirect(slug);

    if (targetSlug) {
      return NextResponse.redirect(new URL(`/blog/${targetSlug}`, request.url), 301);
    }
  }

  if (
    pathname.startsWith("/api") &&
    pathname !== "/api/yookassa/webhook" &&
    pathname !== "/api/internal/telegram/payments" &&
    isUnsafeRequest(request) &&
    !hasValidRequestSource(request)
  ) {
    return NextResponse.json({ error: "Invalid request source" }, { status: 403 });
  }

  if (pathname.startsWith("/api") && !pathname.startsWith("/api/admin")) {
    return NextResponse.next();
  }

  if (pathname === "/account/invite" || pathname === "/api/account/invite") {
    return NextResponse.next();
  }

  if (pathname.startsWith("/account")) {
    const userToken = request.cookies.get(USER_COOKIE_NAME)?.value;

    if (await getUserIdFromSession(userToken)) {
      return NextResponse.next();
    }

    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);

    return NextResponse.redirect(loginUrl);
  }

  if (!pathname.startsWith("/admin") && !pathname.startsWith("/api/admin")) {
    return NextResponse.next();
  }

  if (publicAdminPaths.has(pathname)) {
    return NextResponse.next();
  }

  if (bootstrapAdminPaths.has(pathname)) {
    const bootstrap = await authorizeAdminBootstrap(request.cookies.get(ADMIN_BOOTSTRAP_COOKIE_NAME)?.value);
    if (!bootstrap) {
      if (pathname.startsWith("/api/")) return NextResponse.json({ error: "Bootstrap authentication required" }, { status: 401 });
      return NextResponse.redirect(new URL("/admin/login?error=credentials", request.url));
    }
    if (isUnsafeRequest(request) && !(await hasValidCsrfToken(request))) {
      return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
    }
    return NextResponse.next();
  }

  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const authorization = await authorizeAdminSession(token, ["admin", "clinical_admin"]);

  if (authorization.authorized) {
    const clinicalPath = pathname.startsWith("/admin/ai/conversations") || pathname.startsWith("/admin/ai/attention") || pathname.startsWith("/api/admin/ai/clinical");
    if (clinicalPath && authorization.session.role !== "clinical_admin") {
      if (pathname.startsWith("/api/")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    if (
      authorization.session.mustChangePassword &&
      pathname !== "/admin/password" &&
      pathname !== "/api/admin/password" &&
      pathname !== "/api/admin/logout"
    ) {
      if (pathname.startsWith("/api/admin")) {
        return NextResponse.json({ error: "Password change required" }, { status: 403 });
      }
      return NextResponse.redirect(new URL("/admin/password", request.url));
    }

    if (isUnsafeRequest(request) && !(await hasValidCsrfToken(request))) {
      return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
    }

    const response = NextResponse.next();
    response.cookies.set({
      name: ADMIN_COOKIE_NAME,
      value: await renewAdminSessionToken(authorization.session),
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: ADMIN_SESSION_MAX_AGE,
    });
    ensureAdminCsrfCookie(request, response);

    return response;
  }

  if (pathname.startsWith("/api/admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const loginUrl = new URL("/admin/login", request.url);
  loginUrl.searchParams.set("next", pathname);

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/",
    "/admin/:path*",
    "/api/:path*",
    "/account/:path*",
    "/account",
    "/blog/:path*",
    "/contact-us/:path*",
    "/useful-articles/:path*",
    "/luneva-psy-biography/:path*",
    "/psychological-help/:path*",
    "/about",
    "/sample-page",
    "/sample-page-2",
    "/hello-world",
    "/author/:path*",
    "/category/:path*",
    "/tag/:path*",
    "/feed",
    "/comments/feed",
    "/wp-json/:path*",
    "/xmlrpc.php",
    "/wp-admin/:path*",
    "/:year(\\d{4})/:month(\\d{1,2})?/:day(\\d{1,2})?/:path*",
  ],
};
