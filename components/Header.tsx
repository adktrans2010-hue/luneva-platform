"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "@/components/Logo";

export default function Header() {
  const pathname = usePathname();

  const linkClass = (path: string) =>
    `transition ${
      pathname === path
        ? "text-[#332725] border-b border-[#c98778]"
        : "text-[#5f5552] hover:text-[#332725]"
    }`;

  return (
    <header
      className="
        sticky
        top-0
        z-50
        bg-[#fff8f6]/80
        backdrop-blur-xl
      "
    >
      <div
        className="
          mx-auto
          flex
          max-w-[1500px]
          items-center
          justify-between
          px-8
          py-4
        "
      >
        <Link href="/">
          <Logo />
        </Link>

        <nav
          className="
            hidden
            items-center
            gap-12
            text-sm
            md:flex
          "
        >
          <Link href="/" className={linkClass("/")}>
            Главная
          </Link>

          <Link href="/about" className={linkClass("/about")}>
            Обо мне
          </Link>

          <Link href="/help" className={linkClass("/help")}>
            Психологическая помощь
          </Link>

          <Link href="/reviews" className={linkClass("/reviews")}>
            Отзывы
          </Link>

          <Link href="/blog" className={linkClass("/blog")}>
            Полезные статьи
          </Link>

          <Link href="/contacts" className={linkClass("/contacts")}>
            Контакты
          </Link>
        </nav>
      </div>
    </header>
  );
}