"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "@/components/Logo";

export default function Header() {
  const pathname = usePathname();

  const linkClass = (path: string) =>
    `transition-colors ${
      pathname === path
        ? "text-slate-900 font-semibold"
        : "text-slate-600 hover:text-slate-900"
    }`;

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/70 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/">
          <Logo />
        </Link>

        <nav className="flex items-center gap-8 text-sm">
          <Link href="/" className={linkClass("/")}>
            Главная
          </Link>

          <Link href="/about" className={linkClass("/about")}>
            О проекте
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