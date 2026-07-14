import { AdminSessionKeeper } from "@/components/admin/admin-session-keeper";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AdminSessionKeeper />
      {children}
    </>
  );
}
