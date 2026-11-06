import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, authorizeAdminSession } from "@/src/lib/admin-auth";
import { readPublisherQueue } from "@/src/lib/publisher-admin-server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await authorizeAdminSession(request.cookies.get(ADMIN_COOKIE_NAME)?.value, ["admin", "clinical_admin"]);
  if (!auth.authorized) return NextResponse.json({ error: "Доступ запрещён" }, {
    status: auth.reason === "unauthenticated" ? 401 : 403, headers: { "Cache-Control": "no-store" },
  });
  const result = await readPublisherQueue();
  return NextResponse.json(result, { status: result.state === "ready" ? 200 : 503,
    headers: { "Cache-Control": "no-store" } });
}
