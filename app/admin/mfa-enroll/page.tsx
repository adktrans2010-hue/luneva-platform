import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import QRCode from "qrcode";

import { MfaEnrollmentForm } from "@/components/admin/mfa-enrollment-form";
import { ADMIN_BOOTSTRAP_COOKIE_NAME, authorizeAdminBootstrap, hashAdminBootstrapToken } from "@/src/lib/admin-auth";
import { getActiveAdminMfaEnrollment } from "@/src/lib/admin-mfa-enrollment";
import { getAdminAccountById, updateAdminAccountMfa } from "@/src/lib/admin-settings";
import { createOtpAuthUrl, createTotpSecret } from "@/src/lib/totp";

export default async function AdminMfaEnrollPage() {
  const token = (await cookies()).get(ADMIN_BOOTSTRAP_COOKIE_NAME)?.value;
  const bootstrap = await authorizeAdminBootstrap(token);
  if (!token || !bootstrap) redirect("/admin/login?error=credentials");
  const state = await getActiveAdminMfaEnrollment(bootstrap.accountId, await hashAdminBootstrapToken(token));
  const account = await getAdminAccountById(bootstrap.accountId);
  if (!state || !account?.isActive || account.totpEnabled) redirect("/admin/login");
  const secret = account.totpSecret || createTotpSecret();
  if (!account.totpSecret) await updateAdminAccountMfa(account.id, { totpSecret: secret, totpEnabled: false });
  const qrCode = await QRCode.toDataURL(createOtpAuthUrl(account.email, secret), { errorCorrectionLevel: "M", margin: 1, width: 240 });
  return (
    <main className="mx-auto min-h-screen max-w-xl px-4 py-12">
      <div className="rounded-[2rem] border border-[#ead7d1] bg-white p-8 text-center shadow-sm">
        <p className="text-sm uppercase tracking-[0.2em] text-[#9a5d50]">Защита администратора</p>
        <h1 className="mt-3 text-3xl text-[#332725]">Подключите MFA</h1>
        <p className="mt-4 text-[#5f5552]">Отсканируйте QR-код в Google Authenticator, Microsoft Authenticator или совместимом TOTP-приложении.</p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qrCode} alt="QR-код для подключения MFA" className="mx-auto mt-6 h-60 w-60" />
        <MfaEnrollmentForm />
      </div>
    </main>
  );
}
