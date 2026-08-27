import { NextRequest } from "next/server";
import { proxyClinicalRequest } from "@/src/lib/ai-clinical-bridge";

export async function GET(request: NextRequest) {
  const attention = request.nextUrl.searchParams.get("attention") === "true" ? "?attention=true" : "";
  return proxyClinicalRequest(request, `/conversations${attention}`);
}
