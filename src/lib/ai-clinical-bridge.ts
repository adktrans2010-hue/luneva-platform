import { NextRequest, NextResponse } from "next/server";

import { requireAdminApiSession } from "@/src/lib/admin-api";
import { hasValidCsrfToken, hasValidRequestSource, isUnsafeRequest } from "@/src/lib/admin-security";

function config() {
  const baseUrl = process.env.ALEXANDRA_BOT_API_URL?.trim().replace(/\/$/u, "");
  const secret = process.env.ALEXANDRA_BOT_SITE_ADMIN_SECRET?.trim();
  return baseUrl && secret && /^https?:\/\//u.test(baseUrl) ? { baseUrl, secret } : null;
}

export async function authorizeClinicalRequest(request: NextRequest) {
  const admin = await requireAdminApiSession(request, ["clinical_admin"]);
  if (!admin.authorized) return admin;
  if (isUnsafeRequest(request) && (!hasValidRequestSource(request) || !(await hasValidCsrfToken(request)))) {
    return { authorized: false as const, response: NextResponse.json({ error: "Сессия формы устарела." }, { status: 403 }) };
  }
  return admin;
}

export async function proxyClinicalRequest(request: NextRequest, path: string, body?: unknown) {
  const admin = await authorizeClinicalRequest(request);
  if (!admin.authorized) return admin.response;
  const bridge = config();
  if (!bridge) return NextResponse.json({ error: "Clinical backend не настроен." }, { status: 503 });
  try {
    const response = await fetch(`${bridge.baseUrl}/api/v1/internal/site-admin/ai${path}`, {
      method: request.method,
      headers: {
        "Content-Type": "application/json",
        "X-Site-Admin-Secret": bridge.secret,
        "X-Clinical-Actor": admin.session.email,
        "X-Clinical-Role": admin.session.role,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(30_000),
    });
    const payload = await response.json().catch(() => null);
    return NextResponse.json(response.ok ? payload : { error: payload?.error?.message ?? "Clinical backend недоступен." }, { status: response.status });
  } catch {
    return NextResponse.json({ error: "Clinical backend недоступен." }, { status: 503 });
  }
}
