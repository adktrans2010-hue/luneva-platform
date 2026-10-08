"use client";

import { useEffect, useRef, useState } from "react";

import { AdminNavigationLinks } from "@/components/admin/admin-navigation-links";
import type { AdminNavigationRole } from "@/src/lib/admin-navigation";

export function AdminMobileNavigation({ role }: { role: AdminNavigationRole }) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);

  const closeDrawer = () => setOpen(false);

  useEffect(() => {
    if (!open) return;
    drawerRef.current?.focus();
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeDrawer();
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = drawerRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeydown);
    return () => document.removeEventListener("keydown", handleKeydown);
  }, [open]);

  useEffect(() => {
    if (!open) buttonRef.current?.focus();
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        ref={buttonRef}
        type="button"
        aria-label="Открыть навигацию"
        aria-expanded={open}
        aria-controls="admin-mobile-navigation"
        onClick={() => setOpen(true)}
        className="inline-flex size-10 items-center justify-center rounded-xl border border-[#ead7d1] bg-white text-[#4a3935] shadow-sm transition hover:border-[#c98778]"
      >
        <span className="sr-only">Открыть навигацию</span>
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-5"><path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" /></svg>
      </button>

      {open ? (
        <div className="fixed inset-0 z-[70] flex overflow-hidden">
          <button type="button" aria-label="Закрыть навигацию" onClick={closeDrawer} className="absolute inset-0 bg-[#332725]/30" />
          <aside
            id="admin-mobile-navigation"
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Навигация админ-панели"
            tabIndex={-1}
            className="relative flex h-dvh w-[min(85vw,320px)] flex-col overflow-y-auto border-r border-[#ead7d1] bg-[#fffaf8] shadow-2xl outline-none"
          >
            <div className="flex items-center justify-between border-b border-[#ead7d1] px-5 py-5">
              <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#b36f61]">Luneva</p><p className="mt-1 text-lg font-semibold text-[#332725]">Админ-панель</p></div>
              <button type="button" aria-label="Закрыть навигацию" onClick={closeDrawer} className="inline-flex size-9 items-center justify-center rounded-lg text-[#665956] hover:bg-[#f4e2dc]">×</button>
            </div>
            <div className="min-w-0 px-3 py-5"><AdminNavigationLinks role={role} onNavigate={closeDrawer} /></div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
