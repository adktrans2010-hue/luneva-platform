import type { Metadata } from "next";
import { cookies } from "next/headers";

import { AdminShell } from "@/components/admin/admin-shell";
import { AdminSessionKeeper } from "@/components/admin/admin-session-keeper";
import { ADMIN_COOKIE_NAME, authorizeAdminSession } from "@/src/lib/admin-auth";
import type { AdminNavigationRole } from "@/src/lib/admin-navigation";

export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const sessionToken = (await cookies()).get(ADMIN_COOKIE_NAME)?.value;
  const authorization = await authorizeAdminSession(sessionToken);
  const sessionRole = authorization.authorized ? authorization.session.role : undefined;
  const role: AdminNavigationRole | undefined =
    sessionRole === "admin" || sessionRole === "clinical_admin" ? sessionRole : undefined;

  return (
    <>
      <AdminSessionKeeper />
      <AdminShell role={role}>{children}</AdminShell>
    </>
  );
}
