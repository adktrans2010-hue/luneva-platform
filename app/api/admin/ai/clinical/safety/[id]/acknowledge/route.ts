import { NextRequest } from "next/server";
import { proxyClinicalRequest } from "@/src/lib/ai-clinical-bridge";
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) { const { id } = await params; return proxyClinicalRequest(request, `/safety/${encodeURIComponent(id)}/acknowledge`, {}); }
