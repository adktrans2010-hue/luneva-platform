import { NextRequest } from "next/server";
import { proxyClinicalRequest } from "@/src/lib/ai-clinical-bridge";

export async function POST(request: NextRequest) {
  return proxyClinicalRequest(request, "/retention/dry-run", {});
}
