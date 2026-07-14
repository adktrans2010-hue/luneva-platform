import type { MetadataRoute } from "next";

import { siteUrl } from "@/src/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin/",
        "/api/",
        "/account/",
        "/login",
        "/register",
        "/forgot-password",
        "/reset-password",
        "/verify",
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
