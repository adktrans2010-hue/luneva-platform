import { NextRequest } from "next/server";
import { proxyClinicalRequest } from "@/src/lib/ai-clinical-bridge";

export async function GET(request: NextRequest) {
  return proxyClinicalRequest(request, "/pilot/usage");
}
