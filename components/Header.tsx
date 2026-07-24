"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import Logo from "@/components/Logo";
import {
  isNavigationItemActive,
  navigationItems,
  type NavigationItem,
} from "@/src/lib/navigation";

function Chevron({ open = false }: { open?: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden="true"
      className={`h-4 w-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
    >
      <path d="m5 7.5 5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DesktopMenu({
  item,
  open,
  onToggle,
  onNavigate,
  pathname,
}: {
  item: NavigationItem;
  open: boolean;
  onToggle: () => void;
  onNavigate: () => void;
  pathname: string;
}) {
  const panelId = `desktop-menu-${item.href.replaceAll("/", "-") || "home"}`;
  const columns = item.menuColumns === 3 ? "grid-cols-3" : item.menuColumns === 2 ? "grid-cols-2" : "grid-cols-1";
  const width = item.menuColumns === 3 ? "w-[920px]" : item.menuColumns === 2 ? "w-[620px]" : "w-[320px]";
  const active = isNavigationItemActive(pathname, item.href);

  return (
    <li className="relative flex items-center">
      <Link
        href={item.href}
        onClick={onNavigate}
        className={`whitespace-nowrap border-b py-2 ${active ? "border-[#c98778] text-[#332725]" : "border-transparent text-[#5f5552] hover:text-[#332725]"}`}
      >
        {item.label}
      </Link>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={panelId}
        aria-haspopup="menu"
        aria-label={`${open ? "Закрыть" : "Открыть"} меню «${item.label}»`}
        className="ml-0.5 grid h-7 w-6 place-items-center rounded-md text-[#8a7a76] hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c98778]"
      >
        <Chevron open={open} />
      </button>

      {open && (
        <div
          id={panelId}
          className={`absolute top-[calc(100%+1rem)] left-1/2 z-[70] ${width} max-w-[calc(100vw-3rem)] -translate-x-1/2 rounded-3xl border border-[#ead7d1] bg-[#fffdfc] p-6 shadow-[0_24px_70px_rgba(51,39,37,0.16)]`}
        >
          <div className={`grid ${columns} gap-7`}>
            {item.groups?.map((group) => (
              <div key={group.title}>
                <p className="mb-3 text-xs font-medium uppercase tracking-[0.16em] text-[#c98778]">
                  {group.title}
                </p>
                <ul className="grid gap-1">
                  {group.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        onClick={onNavigate}
                        className={`block rounded-xl px-3 py-2.5 text-sm leading-5 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#c98778] ${isNavigationItemActive(pathname, link.href) ? "bg-[#fff4f1] text-[#332725]" : "text-[#5f5552] hover:bg-white hover:text-[#332725]"}`}
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          {item.menuCta && (
            <Link
              href={item.menuCta.href}
              onClick={onNavigate}
              className="mt-5 flex items-center justify-between border-t border-[#ead7d1] pt-4 text-sm font-medium text-[#9c544c] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#c98778]"
            >
              {item.menuCta.label}
              <span aria-hidden="true">→</span>
            </Link>
          )}
        </div>
      )}
    </li>
  );
}

function MobileSection({
  item,
  open,
  onToggle,
  onNavigate,
  pathname,
}: {
  item: NavigationItem;
  open: boolean;
  onToggle: () => void;
  onNavigate: () => void;
  pathname: string;
}) {
  const [nestedOpen, setNestedOpen] = useState(false);
  const id = useId();
  const active = isNavigationItemActive(pathname, item.href);

  if (!item.groups) {
    return (
      <li>
        <Link
          href={item.href}
          onClick={onNavigate}
          className={`flex min-h-12 items-center rounded-xl px-4 py-3 text-base ${item.account ? "mt-3 justify-center border border-[#c98778] bg-white text-[#8d443e]" : active ? "bg-white text-[#332725] shadow-sm" : "text-[#5f5552]"}`}
        >
          {item.label}
        </Link>
      </li>
    );
  }

  return (
    <li className="border-b border-[#ead7d1] last:border-b-0">
      <div className="flex items-center gap-1">
        <Link
          href={item.href}
          onClick={onNavigate}
          className={`flex min-h-12 flex-1 items-center px-4 py-3 text-base ${active ? "text-[#332725]" : "text-[#5f5552]"}`}
        >
          {item.label}
        </Link>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={id}
          aria-label={`${open ? "Свернуть" : "Развернуть"} раздел «${item.label}»`}
          className="grid h-12 w-12 place-items-center rounded-xl text-[#8d443e] focus-visible:outline-2 focus-visible:outline-[#c98778]"
        >
          <Chevron open={open} />
        </button>
      </div>
      {open && (
        <div id={id} className="pb-4 pl-4">
          {item.groups.map((group) =>
            group.collapsibleOnMobile ? (
              <div key={group.title} className="mt-2">
                <button
                  type="button"
                  onClick={() => setNestedOpen((value) => !value)}
                  aria-expanded={nestedOpen}
                  className="flex min-h-11 w-full items-center justify-between rounded-xl bg-white/70 px-4 text-left text-sm font-medium text-[#8d443e]"
                >
                  {group.title}
                  <Chevron open={nestedOpen} />
                </button>
                {nestedOpen && (
                  <ul className="mt-1 grid">
                    {group.links.map((link) => (
                      <li key={link.href}>
                        <Link href={link.href} onClick={onNavigate} className="flex min-h-11 items-center px-4 py-2 text-sm leading-5 text-[#5f5552]">
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : (
              <div key={group.title} className="mt-3">
                <p className="px-4 text-xs uppercase tracking-[0.14em] text-[#c98778]">{group.title}</p>
                <ul className="mt-1 grid">
                  {group.links.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} onClick={onNavigate} className="flex min-h-11 items-center px-4 py-2 text-sm leading-5 text-[#5f5552]">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ),
          )}
          {item.menuCta && (
            <Link href={item.menuCta.href} onClick={onNavigate} className="mt-3 flex min-h-11 items-center px-4 text-sm font-medium text-[#9c544c]">
              {item.menuCta.label} →
            </Link>
          )}
        </div>
      )}
    </li>
  );
}

export default function Header() {
  const pathname = usePathname() || "/";
  const [menuOpen, setMenuOpen] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState<string | null>(null);
  const headerRef = useRef<HTMLElement>(null);

  const closeMenus = () => {
    setDesktopOpen(null);
    setMenuOpen(false);
    setMobileOpen(null);
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMenus();
    };
    const onPointerDown = (event: PointerEvent) => {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
        setDesktopOpen(null);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [menuOpen]);

  return (
    <header ref={headerRef} className="sticky top-0 z-50 border-b border-transparent bg-[#fff8f6]/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-5 px-3 py-3 sm:px-8 sm:py-4">
        <Link href="/" onClick={closeMenus} className="flex shrink-0 items-center" aria-label="Luneva Psy — главная">
          <Logo />
        </Link>

        <nav aria-label="Основная навигация" className="hidden xl:block">
          <ul className="flex items-center gap-4 text-[13px] 2xl:gap-6 2xl:text-sm">
            {navigationItems.map((item) =>
              item.groups ? (
                <DesktopMenu
                  key={item.href}
                  item={item}
                  pathname={pathname}
                  open={desktopOpen === item.href}
                  onToggle={() => setDesktopOpen((current) => (current === item.href ? null : item.href))}
                  onNavigate={closeMenus}
                />
              ) : (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={closeMenus}
                    className={`whitespace-nowrap border-b py-2 ${item.account ? "rounded-full border-[#d9b6ad] bg-white/80 px-4 text-[#8d443e] shadow-sm" : isNavigationItemActive(pathname, item.href) ? "border-[#c98778] text-[#332725]" : "border-transparent text-[#5f5552] hover:text-[#332725]"}`}
                  >
                    {item.label}
                  </Link>
                </li>
              ),
            )}
          </ul>
        </nav>

        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
          aria-label={menuOpen ? "Закрыть меню" : "Открыть меню"}
          className="flex h-12 w-12 shrink-0 flex-col items-center justify-center gap-1.5 rounded-full border border-[#d9b6ad] bg-white/90 shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c98778] xl:hidden"
        >
          <span className={`h-0.5 w-5 bg-[#8d443e] transition ${menuOpen ? "translate-y-2 rotate-45" : ""}`} />
          <span className={`h-0.5 w-5 bg-[#8d443e] transition ${menuOpen ? "opacity-0" : ""}`} />
          <span className={`h-0.5 w-5 bg-[#8d443e] transition ${menuOpen ? "-translate-y-2 -rotate-45" : ""}`} />
        </button>
      </div>

      {menuOpen && (
        <nav
          id="mobile-navigation"
          aria-label="Мобильная навигация"
          className="fixed inset-x-0 top-[73px] z-[80] h-[calc(100dvh-73px)] overflow-y-auto overscroll-contain border-t border-[#ead7d1] bg-[#fff8f6] px-4 py-4 shadow-[0_20px_50px_rgba(51,39,37,0.14)] sm:top-[89px] sm:h-[calc(100dvh-89px)] xl:hidden"
        >
          <ul className="mx-auto grid max-w-xl pb-[max(2rem,env(safe-area-inset-bottom))]">
            {navigationItems.map((item) => (
              <MobileSection
                key={item.href}
                item={item}
                pathname={pathname}
                open={mobileOpen === item.href}
                onToggle={() => setMobileOpen((current) => (current === item.href ? null : item.href))}
                onNavigate={closeMenus}
              />
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
