import { NextRequest } from "next/server";

export function publicUrl(request: NextRequest, path: string) {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (configuredUrl) {
    return new URL(path, configuredUrl.endsWith("/") ? configuredUrl : `${configuredUrl}/`);
  }

  return new URL(path, request.url);
}
