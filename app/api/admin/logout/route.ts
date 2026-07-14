import { NextRequest, NextResponse } from "next/server";

import { ADMIN_COOKIE_NAME } from "@/src/lib/admin-auth";
import { ADMIN_CSRF_COOKIE_NAME } from "@/src/lib/admin-security-constants";
import { publicUrl } from "@/src/lib/public-url";

export async function POST(request: NextRequest) {
  const response = NextResponse.redirect(publicUrl(request, "/admin/login"), {
    status: 303,
  });

  response.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  response.cookies.set({
    name: ADMIN_CSRF_COOKIE_NAME,
    value: "",
    httpOnly: false,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  return response;
}
