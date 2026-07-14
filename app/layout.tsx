import type { Metadata } from "next";

import { Suspense } from "react";

import AnalyticsTracker from "@/components/AnalyticsTracker";
import CookieBanner from "@/components/CookieBanner";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
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

        <Header />

        <main>{children}</main>

        <Footer />

        <CookieBanner />
      </body>
    </html>
  );
}
