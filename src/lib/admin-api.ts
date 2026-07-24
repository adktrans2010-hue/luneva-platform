import { NextResponse } from "next/server";

import {
  ADMIN_COOKIE_NAME,
  authorizeAdminSession,
  type AdminRole,
} from "@/src/lib/admin-auth";

export async function requireAdminApiSession(
  request: Request,
  allowedRoles: readonly AdminRole[] = ["admin"]
) {
  const token = request.headers
    .get("cookie")
    ?.split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${ADMIN_COOKIE_NAME}=`))
    ?.replace(`${ADMIN_COOKIE_NAME}=`, "");

  const authorization = await authorizeAdminSession(token, allowedRoles);

  if (authorization.authorized) {
    return { authorized: true as const, session: authorization.session };
  }

  return {
    authorized: false as const,
    response: NextResponse.json(
      { error: "Войдите в админку, чтобы выполнить это действие." },
      { status: authorization.reason === "forbidden" ? 403 : 401 }
    ),
  };
}
