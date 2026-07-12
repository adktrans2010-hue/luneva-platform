import { NextRequest, NextResponse } from "next/server";

import { publicUrl } from "@/src/lib/public-url";
import { USER_COOKIE_NAME } from "@/src/lib/user-session";

export async function POST(request: NextRequest) {
  const response = NextResponse.redirect(publicUrl(request, "/login"), {
    status: 303,
  });

  response.cookies.set({
    name: USER_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  return response;
}
