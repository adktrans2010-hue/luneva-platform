import type { Metadata, Viewport } from "next";

import { Suspense } from "react";

import AnalyticsTracker from "@/components/AnalyticsTracker";
import AppChrome from "@/components/AppChrome";
import YandexMetrika from "@/components/YandexMetrika";
import GlobalStructuredData from "@/components/seo/global-structured-data";
import { defaultSocialImage } from "@/src/lib/seo";
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
    <html lang="ru" className="overflow-x-hidden">
      <body className="min-h-screen overflow-x-hidden bg-[#fff8f6] text-[#332725] antialiased">
        <Suspense fallback={null}>
          <AnalyticsTracker />
        </Suspense>
        <YandexMetrika />

        <GlobalStructuredData />

        <AppChrome>{children}</AppChrome>
      </body>
    </html>
  );
}
