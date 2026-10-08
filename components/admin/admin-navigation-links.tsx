"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import {
  getVisibleAdminNavigation,
  isAdminNavigationItemActive,
  type AdminNavigationIcon,
  type AdminNavigationRole,
} from "@/src/lib/admin-navigation";

function NavigationIcon({ icon }: { icon: AdminNavigationIcon }) {
  const paths: Record<AdminNavigationIcon, string> = {
    overview: "M3 12 12 4l9 8v8a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-8Z",
    calendar: "M7 3v3m10-3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z",
    people: "M16 20v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1m9-12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Zm5 2a3 3 0 0 1 0 6m2 4v-1a4 4 0 0 0-3-3.9",
    package: "m3 7 9-4 9 4-9 4-9-4Zm0 0v10l9 4 9-4V7m-9 4v10",
    payment: "M3 6h18v12H3V6Zm0 4h18M7 15h3",
    chart: "M4 19V5m0 14h16M8 16v-4m4 4V8m4 8v-6",
    megaphone: "m3 11 14-6v14L3 13v-2Zm14 1 3 3m-3-7 3-3M7 15l1 5h3l-1-4",
    funnel: "M4 5h16l-6 7v5l-4 2v-7L4 5Z",
    document: "M7 3h7l4 4v14H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm6 0v5h5M8 13h8m-8 4h8",
    video: "M4 6h11a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Zm13 4 5-3v10l-5-3",
    review: "M12 3 15 9l6 .9-4.3 4.2 1 5.9-5.7-3-5.7 3 1-5.9L3 9.9 9 9l3-6Z",
    help: "M9.1 9a3 3 0 1 1 5.5 1.7c-.9.7-1.6 1.2-1.6 2.6M12 17h.01M4 12a8 8 0 1 0 16 0 8 8 0 0 0-16 0Z",
    page: "M6 3h9l3 3v15H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm8 0v4h4",
    certificate: "M7 3h10v12H7V3Zm3 12-2 6 4-2 4 2-2-6",
    search: "m20 20-4-4m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z",
    brain: "M9 5a3 3 0 0 0-5 2.2A3 3 0 0 0 4 13v.2A3 3 0 0 0 7 18h2m6-13a3 3 0 0 1 5 2.2A3 3 0 0 1 20 13v.2A3 3 0 0 1 17 18h-2m-3-14v16m-3-9h6",
    conversation: "M4 5h16v11H8l-4 4V5Zm4 5h8",
    attention: "M12 3 2 21h20L12 3Zm0 7v4m0 3h.01",
    pilot: "M12 3v18m-7-9h14M7 7l10 10m0-10L7 17",
    services: "M4 7h16M4 12h16M4 17h10",
    settings: "M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm0-12 1.2 2.1 2.4.5 1.6-1.8 2.1 2.1-1.8 1.6.5 2.4 2.1 1.2v3l-2.1 1.2-.5 2.4 1.8 1.6-2.1 2.1-1.6-1.8-2.4.5L12 20.5h-3l-1.2-2.1-2.4-.5-1.6 1.8-2.1-2.1 1.8-1.6-.5-2.4-2.1-1.2v-3l2.1-1.2.5-2.4-1.8-1.6 2.1-2.1 1.6 1.8 2.4-.5L9 3.5h3Z",
    history: "M3 12a9 9 0 1 0 3-6.7M3 4v5h5m4-4v7l4 2",
  };

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="size-4 shrink-0">
      <path d={paths[icon]} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function AdminNavigationLinks({ role, onNavigate }: { role: AdminNavigationRole; onNavigate?: () => void }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.size > 0 ? `?${searchParams.toString()}` : "";

  return (
    <nav aria-label="Основная навигация" className="space-y-5">
      {getVisibleAdminNavigation(role).map((group, groupIndex) => (
        <section key={group.label ?? `overview-${groupIndex}`} aria-label={group.label}>
          {group.label ? <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9b8883]">{group.label}</p> : null}
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const active = isAdminNavigationItemActive(item, pathname, search);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition ${active ? "bg-[#f4e2dc] font-medium text-[#4a3935]" : "text-[#665956] hover:bg-[#fff3ef] hover:text-[#332725]"}`}
                  >
                    <NavigationIcon icon={item.icon} />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </nav>
  );
}
