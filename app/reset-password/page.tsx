import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

type ResetPasswordPageProps = {
  searchParams: Promise<{
    email?: string;
    error?: string;
    localCode?: string;
  }>;
};

const errorMessages: Record<string, string> = {
  attempts: "Слишком много попыток. Запросите новый код.",
  code: "Код введён неверно. Проверьте письмо и попробуйте ещё раз.",
  expired: "Код истёк. Запросите новый код.",
  fields: "Введите email, 6-значный код и новый пароль не короче 8 символов.",
  missing: "Код не найден. Запросите новый код.",
  rate: "Слишком много запросов. Попробуйте снова через 15 минут.",
};

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const params = await searchParams;
  const email = params.email ?? "";
  const error = params.error ? errorMessages[params.error] : null;
  const localCode =
    process.env.NODE_ENV !== "production" && params.localCode
      ? params.localCode
      : null;

  return (
    <section className="bg-[#fff8f6] px-6 py-24">
      <div className="mx-auto max-w-xl">
        <p className="mb-4 text-sm uppercase tracking-[0.25em] text-[#c98778]">
          Личный кабинет
        </p>

        <h1 className="font-serif text-5xl leading-tight text-[#332725]">
          Новый пароль
        </h1>

        <p className="mt-5 text-lg leading-8 text-[#5f5552]">
          Введите код из письма и придумайте новый пароль.
        </p>

        {localCode && (
          <p className="mt-5 rounded-2xl bg-[#fff3df] px-5 py-4 text-sm leading-6 text-[#9a5a1f]">
            Почта на этом компьютере пока не настроена, поэтому для локальной
            проверки используйте код:{" "}
            <span className="font-semibold tracking-[0.25em]">
              {localCode}
            </span>
          </p>
        )}

        <form
          action="/api/auth/reset-password"
          method="post"
          className="mt-10 rounded-[2rem] border border-[#ead7d1] bg-white p-8 shadow-sm"
        >
          <input type="hidden" name="email" value={email} />

          <input
            name="code"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            className="w-full rounded-2xl border border-[#ead7d1] px-4 py-3 text-center text-2xl tracking-[0.4em] outline-none transition focus:border-[#c98778]"
            placeholder="000000"
            autoComplete="one-time-code"
            required
          />

          <input
            name="password"
            type="password"
            minLength={8}
            className="mt-5 w-full rounded-2xl border border-[#ead7d1] px-4 py-3 outline-none transition focus:border-[#c98778]"
            placeholder="Новый пароль от 8 символов"
            autoComplete="new-password"
            required
          />

          {error && (
            <p className="mt-4 rounded-2xl bg-[#fff3df] px-4 py-3 text-sm text-[#9a5a1f]">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="mt-6 w-full rounded-2xl bg-[#332725] px-5 py-3 text-white transition hover:bg-[#4a3935]"
          >
            Сохранить новый пароль
          </button>

          <p className="mt-5 text-center text-sm text-[#5f5552]">
            Нужен новый код?{" "}
            <Link href="/forgot-password" className="text-[#c98778]">
              Запросить ещё раз
            </Link>
          </p>
        </form>
      </div>
    </section>
  );
}
