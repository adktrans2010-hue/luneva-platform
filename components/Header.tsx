"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "@/components/Logo";

export default function Header() {
  const pathname = usePathname();

  const linkClass = (path: string) =>
    `transition-colors ${
      pathname === path
        ? "text-[#332725] font-semibold border-b border-[#c98778]"
        : "text-[#5f5552] hover:text-[#332725]"
    }`;

  return (
    <header className="sticky top-0 z-50 border-b border-[#ead7d1] bg-[#fff8f6]/85 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/">
          <Logo />
        </Link>

        <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
          <Link href="/" className={linkClass("/")}>
            Главная
          </Link>

          <Link href="/about" className={linkClass("/about")}>
            Обо мне
          </Link>

          <Link href="/blog" className={linkClass("/blog")}>
            Блог
          </Link>

          <Link href="/contacts" className={linkClass("/contacts")}>
            Контакты
          </Link>
        </nav>
      </div>
    </header>
  );
}