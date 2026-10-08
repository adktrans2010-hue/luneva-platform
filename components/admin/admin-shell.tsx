"use client";

import { usePathname } from "next/navigation";

import { AdminMobileNavigation } from "@/components/admin/admin-mobile-navigation";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { isAdminAuthPath, type AdminNavigationRole } from "@/src/lib/admin-navigation";

export function AdminShell({ children, role }: { children: React.ReactNode; role?: AdminNavigationRole }) {
  const pathname = usePathname();
  if (!role || isAdminAuthPath(pathname)) return <>{children}</>;

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#fff8f6] md:flex">
      <AdminSidebar role={role} />
      <div className="min-w-0 flex-1">
        <div className="flex min-h-16 items-center border-b border-[#ead7d1] bg-[#fffaf8] px-4 md:hidden"><AdminMobileNavigation role={role} /></div>
        <AdminPageHeader />
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
