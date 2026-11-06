import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE_NAME, authorizeAdminSession } from "@/src/lib/admin-auth";
import { TelegramQueue } from "@/components/admin/telegram-queue";

export default async function AdminTelegramPage() {
  const auth = await authorizeAdminSession((await cookies()).get(ADMIN_COOKIE_NAME)?.value, ["admin", "clinical_admin"]);
  if (!auth.authorized) redirect("/admin/login?next=%2Fadmin%2Ftelegram");
  return <TelegramQueue />;
}
