import Link from "next/link";
import type { Metadata } from "next";
import { and, eq, gt, isNull } from "drizzle-orm";

import { db } from "@/src/db";
import { accountInvitations } from "@/src/db/schema";
import { hashInvitationToken } from "@/src/lib/account-invitations";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Доступ в личный кабинет | Luneva Psy",
  robots: { index: false, follow: false },
};

type InvitePageProps = {
  searchParams: Promise<{ token?: string; error?: string }>;
};

export default async function AccountInvitePage({
  searchParams,
}: InvitePageProps) {
  const params = await searchParams;
  const token = String(params.token ?? "").trim();
  const tokenHash = token ? hashInvitationToken(token) : "";
  const [invitation] = tokenHash
    ? await db
        .select()
        .from(accountInvitations)
        .where(
          and(
            eq(accountInvitations.tokenHash, tokenHash),
            isNull(accountInvitations.usedAt),
            gt(accountInvitations.expiresAt, new Date())
          )
        )
        .limit(1)
    : [];

  if (!invitation) {
    return (
      <section className="bg-[#fff8f6] px-6 py-24">
        <div className="mx-auto max-w-2xl rounded-[2rem] border border-[#ead7d1] bg-white p-8 shadow-sm">
          <h1 className="font-serif text-5xl text-[#332725]">
            Ссылка недействительна
          </h1>
          <p className="mt-5 leading-8 text-[#5f5552]">
            Возможно, она уже была использована или срок действия истек.
          </p>
          <Link
            href="/forgot-password"
            className="mt-8 inline-flex rounded-2xl bg-[#332725] px-6 py-3 text-white"
          >
            Восстановить доступ
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-[#fff8f6] px-6 py-24">
      <div className="mx-auto max-w-2xl rounded-[2rem] border border-[#ead7d1] bg-white p-8 shadow-sm">
        <p className="mb-4 text-sm uppercase tracking-[0.25em] text-[#c98778]">
          Личный кабинет
        </p>
        <h1 className="font-serif text-5xl text-[#332725]">
          Установите пароль
        </h1>
        <p className="mt-5 leading-8 text-[#5f5552]">
          После сохранения пароля вы сразу попадете в личный кабинет. Там будет
          видна оплаченная запись или пакет консультаций.
        </p>

        {params.error && (
          <p className="mt-5 rounded-2xl bg-[#fff3df] px-4 py-3 text-sm text-[#9a5a1f]">
            Пароль должен быть не короче 8 символов.
          </p>
        )}

        <form action="/api/account/invite" method="post" className="mt-8 grid gap-4">
          <input type="hidden" name="token" value={token} />
          <input
            type="email"
            value={invitation.email}
            readOnly
            className="rounded-2xl border border-[#ead7d1] bg-[#fff8f6] px-4 py-3"
          />
          <input
            name="password"
            type="password"
            minLength={8}
            autoComplete="new-password"
            placeholder="Пароль от 8 символов"
            className="rounded-2xl border border-[#ead7d1] px-4 py-3"
            required
          />
          <button className="rounded-2xl bg-[#332725] px-6 py-3 text-white">
            Сохранить пароль и войти
          </button>
        </form>
      </div>
    </section>
  );
}
