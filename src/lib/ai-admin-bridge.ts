import { NextRequest, NextResponse } from "next/server";

import { requireAdminApiSession } from "@/src/lib/admin-api";
import {
  hasValidCsrfToken,
  hasValidRequestSource,
  isUnsafeRequest,
} from "@/src/lib/admin-security";

const allowedActions = new Set(["activate", "archive", "reprocess"]);

function bridgeConfig() {
  const baseUrl = process.env.ALEXANDRA_BOT_API_URL?.trim().replace(/\/$/u, "");
  const secret = process.env.ALEXANDRA_BOT_SITE_ADMIN_SECRET?.trim();
  if (!baseUrl || !secret || !/^https?:\/\//u.test(baseUrl)) return null;
  return { baseUrl, secret };
}

export async function authorizeKnowledgeRequest(request: NextRequest) {
  const admin = await requireAdminApiSession(request, ["admin"]);
  if (!admin.authorized) return admin;

  if (
    isUnsafeRequest(request) &&
    (!hasValidRequestSource(request) || !(await hasValidCsrfToken(request)))
  ) {
    return {
      authorized: false as const,
      response: NextResponse.json(
        { error: "Сессия формы устарела. Обновите страницу и повторите действие." },
        { status: 403 }
      ),
    };
  }

  return admin;
}

export async function proxyKnowledgeRequest(
  request: NextRequest,
  path = "",
  body?: FormData
) {
  const config = bridgeConfig();
  if (!config) {
    return NextResponse.json(
      { error: "Управление базой знаний пока не настроено." },
      { status: 503 }
    );
  }

  try {
    const response = await fetch(
      `${config.baseUrl}/api/v1/internal/site-admin/ai/documents${path}`,
      {
        method: request.method,
        headers: { "X-Site-Admin-Secret": config.secret },
        body,
        cache: "no-store",
        signal: AbortSignal.timeout(30_000),
      }
    );
    const payload = await response.json().catch(() => null);
    const safePayload = response.ok
      ? payload
      : {
          error:
            payload?.error?.message ??
            payload?.detail?.message ??
            "Backend базы знаний временно недоступен.",
        };
    return NextResponse.json(safePayload, { status: response.status });
  } catch {
    return NextResponse.json(
      { error: "Backend базы знаний временно недоступен." },
      { status: 503 }
    );
  }
}

export function validKnowledgePath(id: string, action: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(id) &&
    allowedActions.has(action);
}
