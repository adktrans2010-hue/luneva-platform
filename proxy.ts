import { NextRequest, NextResponse } from "next/server";

import {
  ADMIN_COOKIE_NAME,
  isValidAdminSession,
} from "@/src/lib/admin-auth";

const publicAdminPaths = new Set([
  "/admin/login",
  "/api/admin/login",
  "/api/admin/logout",
]);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (publicAdminPaths.has(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;

  if (await isValidAdminSession(token)) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const loginUrl = new URL("/admin/login", request.url);
  loginUrl.searchParams.set("next", pathname);

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
