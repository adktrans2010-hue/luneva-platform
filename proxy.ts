import { NextRequest, NextResponse } from "next/server";

import {
  ADMIN_COOKIE_NAME,
  ADMIN_SESSION_MAX_AGE,
  authorizeAdminSession,
  renewAdminSessionToken,
} from "@/src/lib/admin-auth";
import {
  getUserIdFromSession,
  USER_COOKIE_NAME,
} from "@/src/lib/user-session";

const publicAdminPaths = new Set([
  "/admin/login",
  "/api/admin/login",
  "/api/admin/logout",
  "/api/admin/google/start",
  "/api/admin/google/callback",
]);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/account")) {
    const userToken = request.cookies.get(USER_COOKIE_NAME)?.value;

    if (await getUserIdFromSession(userToken)) {
      return NextResponse.next();
    }

    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);

    return NextResponse.redirect(loginUrl);
  }

  if (publicAdminPaths.has(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const authorization = await authorizeAdminSession(token, ["admin"]);

  if (authorization.authorized) {
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
  matcher: ["/admin/:path*", "/api/admin/:path*", "/account/:path*", "/account"],
};
