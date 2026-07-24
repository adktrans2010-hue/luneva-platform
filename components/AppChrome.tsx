"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import CookieBanner from "@/components/CookieBanner";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Logo from "@/components/Logo";
import ScrollToTop from "@/components/ScrollToTop";

export default function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  if (isAdmin) {
    return (
      <>
        <header className="sticky top-0 z-50 border-b border-[#ead7d1] bg-[#fff8f6]/95 backdrop-blur-xl">
          <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-3 py-3 sm:px-8 sm:py-4">
            <Link href="/admin" className="flex shrink-0 items-center" aria-label="Luneva Admin">
              <Logo />
            </Link>

            <Link
              href="/admin"
              className="rounded-2xl border border-[#ead7d1] bg-white/80 px-4 py-2 text-sm text-[#5f5552] shadow-sm transition hover:border-[#c98778] hover:text-[#332725]"
            >
              Вернуться в админ-панель
            </Link>
          </div>
        </header>

        <main>{children}</main>
      </>
    );
  }

  return (
    <>
      <Header />

      <main>{children}</main>

      <Footer />

      <ScrollToTop />

      <CookieBanner />
    </>
  );
}
