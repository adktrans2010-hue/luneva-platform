import { AdminNavigationLinks } from "@/components/admin/admin-navigation-links";
import type { AdminNavigationRole } from "@/src/lib/admin-navigation";

export function AdminSidebar({ role }: { role: AdminNavigationRole }) {
  return (
    <aside className="sticky top-0 hidden h-dvh w-[232px] shrink-0 border-r border-[#ead7d1] bg-[#fffaf8] md:flex md:flex-col" aria-label="Навигация админ-панели">
      <div className="border-b border-[#ead7d1] px-5 py-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#b36f61]">Luneva</p>
        <p className="mt-1 text-lg font-semibold text-[#332725]">Админ-панель</p>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-5">
        <AdminNavigationLinks role={role} />
      </div>
    </aside>
  );
}
