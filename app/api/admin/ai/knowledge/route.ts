import { NextRequest } from "next/server";

import {
  authorizeKnowledgeRequest,
  proxyKnowledgeRequest,
} from "@/src/lib/ai-admin-bridge";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const admin = await authorizeKnowledgeRequest(request);
  if (!admin.authorized) return admin.response;
  return proxyKnowledgeRequest(request);
}

export async function POST(request: NextRequest) {
  const admin = await authorizeKnowledgeRequest(request);
  if (!admin.authorized) return admin.response;
  return proxyKnowledgeRequest(request, "", await request.formData());
}
