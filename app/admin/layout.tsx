import type { Metadata } from "next";

import { AdminSessionKeeper } from "@/components/admin/admin-session-keeper";

export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AdminSessionKeeper />
      {children}
    </>
  );
}
