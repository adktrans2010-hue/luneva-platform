import type { NextConfig } from "next";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(fileURLToPath(import.meta.url));
const isDev = process.env.NODE_ENV === "development";
const staticAssetOrigin = "https://egotifubasem.begetcdn.cloud";
const staticAssetPrefix = `${staticAssetOrigin}/luneva-v1`;
const staticSource = isDev ? "" : ` ${staticAssetOrigin}`;
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}${staticSource}`,
  `style-src 'self' 'unsafe-inline'${staticSource}`,
  `img-src 'self' data: blob:${staticSource}`,
  `font-src 'self' data:${staticSource}`,
  "connect-src 'self'",
  "frame-src 'self' https://yandex.ru",
  "media-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const nextConfig: NextConfig = {
  assetPrefix: isDev ? undefined : staticAssetPrefix,
  poweredByHeader: false,
  skipTrailingSlashRedirect: true,
  async redirects() {
    return [
      {
        source: "/luneva-psy-biography/:path*",
        destination: "/about",
        statusCode: 301,
      },
      {
        source: "/psychological-help/:path*",
        destination: "/help",
        statusCode: 301,
      },
      {
        source: "/useful-articles/:path*",
        destination: "/blog",
        statusCode: 301,
      },
      {
        source: "/contact-us/:path*",
        destination: "/contacts",
        statusCode: 301,
      },
    ];
  },
  async headers() {
    return [
      ...[
        "/admin/:path*",
        "/api/:path*",
        "/account/:path*",
        "/profile",
        "/login",
        "/register",
        "/forgot-password",
        "/reset-password",
        "/verify",
      ].map((source) => ({
        source,
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
        ],
      })),
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: contentSecurityPolicy },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
          },
        ],
      },
    ];
  },
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    localPatterns: [
      {
        pathname: "/**",
      },
    ],
  },
  turbopack: {
    root: projectRoot,
  },
};

export default nextConfig;
