import type { Metadata, Viewport } from "next";

import { Suspense } from "react";

import AnalyticsTracker from "@/components/AnalyticsTracker";
import AppChrome from "@/components/AppChrome";
import YandexMetrika from "@/components/YandexMetrika";
import JsonLd from "@/components/seo/json-ld";
import { defaultSocialImage } from "@/src/lib/seo";
import { createGlobalSchema } from "@/src/lib/schema-org";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://luneva-psy.ru"),
  title: {
    default: "Luneva Psy",
    template: "%s",
  },
  description: "Психолог Александра Лунева. Консультации онлайн и очно.",
  openGraph: {
    title: "Luneva Psy",
    description: "Психолог Александра Лунева. Консультации онлайн и очно.",
    url: "https://luneva-psy.ru",
    siteName: "Luneva Psy",
    locale: "ru_RU",
    type: "website",
    images: [defaultSocialImage],
  },
  twitter: {
    card: "summary_large_image",
    title: "Luneva Psy",
    description: "Психолог Александра Лунева. Консультации онлайн и очно.",
    images: [defaultSocialImage.url],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#fff8f6",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className="min-h-screen bg-[#fff8f6] text-[#332725] antialiased">
        <Suspense fallback={null}>
          <AnalyticsTracker />
        </Suspense>
        <YandexMetrika />

        <JsonLd data={createGlobalSchema()} />

        <AppChrome>{children}</AppChrome>
      </body>
    </html>
  );
}
