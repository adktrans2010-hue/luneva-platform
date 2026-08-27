import { NextRequest } from "next/server";
import { proxyClinicalRequest } from "@/src/lib/ai-clinical-bridge";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyClinicalRequest(request, `/conversations/${encodeURIComponent(id)}`);
}
