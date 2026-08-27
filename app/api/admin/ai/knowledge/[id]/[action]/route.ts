import { NextRequest, NextResponse } from "next/server";

import {
  authorizeKnowledgeRequest,
  proxyKnowledgeRequest,
  validKnowledgePath,
} from "@/src/lib/ai-admin-bridge";

export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string; action: string }> }
) {
  const admin = await authorizeKnowledgeRequest(request);
  if (!admin.authorized) return admin.response;

  const { id, action } = await context.params;
  if (!validKnowledgePath(id, action)) {
    return NextResponse.json({ error: "Некорректное действие." }, { status: 400 });
  }

  const body = action === "reprocess" ? await request.formData() : undefined;
  return proxyKnowledgeRequest(request, `/${id}/${action}`, body);
}
