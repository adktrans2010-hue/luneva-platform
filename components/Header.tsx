"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import Logo from "@/components/Logo";

export default function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const links = [
    { href: "/", label: "Главная" },
    { href: "/about", label: "Обо мне" },
    { href: "/help", label: "Помощь" },
    { href: "/reviews", label: "Отзывы" },
    { href: "/blog", label: "Статьи" },
    { href: "/videos", label: "Видео" },
    { href: "/contacts", label: "Контакты" },
    { href: "/account", label: "Кабинет" },
  ];

  const linkClass = (path: string) =>
    `transition ${
      pathname === path
        ? "border-b border-[#c98778] text-[#332725]"
        : "text-[#5f5552] hover:text-[#332725]"
    }`;

  return (
    <header className="sticky top-0 z-50 bg-[#fff8f6]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1500px] items-center justify-between px-3 py-3 sm:px-8 sm:py-4">
        <Link href="/" className="flex shrink-0 items-center">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-10 text-sm md:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className={linkClass(link.href)}>
              {link.label}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
          aria-label={menuOpen ? "Закрыть меню" : "Открыть меню"}
          className="flex h-11 w-11 shrink-0 flex-col items-center justify-center gap-1.5 rounded-full border border-[#d9b6ad] bg-white/85 shadow-sm md:hidden"
        >
          <span className={`h-0.5 w-5 bg-[#8d443e] transition ${menuOpen ? "translate-y-2 rotate-45" : ""}`} />
          <span className={`h-0.5 w-5 bg-[#8d443e] transition ${menuOpen ? "opacity-0" : ""}`} />
          <span className={`h-0.5 w-5 bg-[#8d443e] transition ${menuOpen ? "-translate-y-2 -rotate-45" : ""}`} />
        </button>
      </div>

      {menuOpen && (
        <nav
          id="mobile-navigation"
          className="absolute inset-x-0 top-full border-y border-[#ead7d1] bg-[#fff8f6]/98 px-6 py-5 shadow-[0_20px_50px_rgba(51,39,37,0.14)] backdrop-blur-xl md:hidden"
        >
          <div className="mx-auto grid max-w-xl gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`rounded-xl px-4 py-3 text-base ${
                  pathname === link.href
                    ? "bg-white text-[#332725] shadow-sm"
                    : "text-[#5f5552]"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
