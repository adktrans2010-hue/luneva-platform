"use client";

import { usePathname } from "next/navigation";

import { getAdminPageTitle } from "@/src/lib/admin-navigation";

export function AdminPageHeader() {
  const pathname = usePathname();
  return (
    <header className="border-b border-[#ead7d1] bg-[#fffaf8]/90 px-4 py-4 backdrop-blur sm:px-6 md:px-8">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#a4867e]">Luneva Admin</p>
      <h1 className="mt-1 text-xl font-semibold text-[#332725]">{getAdminPageTitle(pathname)}</h1>
    </header>
  );
}
