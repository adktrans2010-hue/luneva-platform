import { NextRequest, NextResponse } from "next/server";
import { proxyClinicalRequest } from "@/src/lib/ai-clinical-bridge";

const actions: Record<string, string> = { takeover: "takeover", release: "return-to-ai", message: "messages" };

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string; action: string }> }) {
  const { id, action } = await params;
  const backendAction = actions[action];
  if (!backendAction) return NextResponse.json({ error: "Unknown action" }, { status: 404 });
  const body = action === "message" ? await request.json() : undefined;
  return proxyClinicalRequest(request, `/conversations/${encodeURIComponent(id)}/${backendAction}`, body);
}
