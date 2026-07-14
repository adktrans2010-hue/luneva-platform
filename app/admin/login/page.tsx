import Link from "next/link";

import { isGoogleAdminOAuthConfigured } from "@/src/lib/google-admin-oauth";

type AdminLoginPageProps = {
  searchParams: Promise<{
    error?: string;
    next?: string;
  }>;
};

const errorMessages: Record<string, string> = {
  credentials: "Неверная почта или пароль. Попробуйте еще раз.",
  password: "Неверный пароль. Попробуйте еще раз.",
  setup: "Добавьте ADMIN_EMAIL и ADMIN_PASSWORD в .env, чтобы включить вход в админку.",
  totp: "Неверный код Google Authenticator. Проверьте код и попробуйте ещё раз.",
  google: "Не удалось войти через Google. Попробуйте ещё раз.",
  google_email: "Этот Google-аккаунт не имеет доступа к админке.",
  google_setup: "Вход через Google ещё не настроен: добавьте Client ID и Client Secret.",
};

export default async function AdminLoginPage({
  searchParams,
}: AdminLoginPageProps) {
  const params = await searchParams;
  const nextPath = params.next?.startsWith("/admin") ? params.next : "/admin";
  const error = params.error ? errorMessages[params.error] : null;
  const googleConfigured = isGoogleAdminOAuthConfigured();

  return (
    <section className="bg-[#fff8f6] px-6 py-24">
      <div className="mx-auto max-w-xl">
        <p className="mb-4 text-sm uppercase tracking-[0.25em] text-[#c98778]">
          Luneva Admin
        </p>

        <h1 className="font-serif text-5xl leading-tight text-[#332725]">
          Вход в админку
        </h1>

        {googleConfigured ? (
          <Link
            href={`/api/admin/google/start?next=${encodeURIComponent(nextPath)}`}
            className="mt-10 flex w-full items-center justify-center gap-3 rounded-2xl border border-[#ead7d1] bg-white px-5 py-3 font-medium text-[#332725] shadow-sm transition hover:border-[#c98778]"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
              <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.24-.2-1.79H12v3.4h5.52a4.72 4.72 0 0 1-2.05 3.1l-.02.11 2.98 2.31.2.02c1.84-1.7 2.97-4.2 2.97-7.15Z" />
              <path fill="#34A853" d="M12 22c2.68 0 4.93-.88 6.57-2.4l-3.13-2.43c-.84.57-1.96.97-3.44.97-2.58 0-4.77-1.7-5.56-4.05l-.1.01-3.1 2.4-.03.1A9.93 9.93 0 0 0 12 22Z" />
              <path fill="#FBBC05" d="M6.44 14.09A6.02 6.02 0 0 1 6.1 12c0-.73.13-1.43.33-2.09V9.8L3.3 7.37l-.1.05A10 10 0 0 0 2 12c0 1.65.4 3.2 1.2 4.58l3.24-2.49Z" />
              <path fill="#EA4335" d="M12 5.86c1.87 0 3.13.8 3.85 1.47l2.78-2.71A9.43 9.43 0 0 0 12 2a9.94 9.94 0 0 0-8.79 5.42l3.23 2.49C7.24 7.56 9.42 5.86 12 5.86Z" />
            </svg>
            Войти через Google
          </Link>
        ) : (
          <p className="mt-10 rounded-2xl border border-[#ead7d1] bg-white/60 px-5 py-4 text-sm leading-6 text-[#8a7a76]">
            Вход через Google появится после добавления Client ID и Client Secret.
          </p>
        )}

        <div className="my-7 flex items-center gap-4 text-xs uppercase tracking-[0.18em] text-[#8a7a76]">
          <span className="h-px flex-1 bg-[#ead7d1]" />
          или по паролю
          <span className="h-px flex-1 bg-[#ead7d1]" />
        </div>

        <form
          action="/api/admin/login"
          method="post"
          className="rounded-[2rem] border border-[#ead7d1] bg-white p-8 shadow-sm"
        >
          <input type="hidden" name="next" value={nextPath} />

          <label
            htmlFor="admin-email"
            className="block text-sm uppercase tracking-[0.18em] text-[#8a7a76]"
          >
            Email администратора
          </label>

          <input
            id="admin-email"
            name="email"
            type="email"
            autoComplete="email"
            className="mt-3 w-full rounded-2xl border border-[#ead7d1] px-4 py-3 text-[#332725] outline-none transition focus:border-[#c98778]"
            required
          />

          <label
            htmlFor="admin-password"
            className="mt-5 block text-sm uppercase tracking-[0.18em] text-[#8a7a76]"
          >
            Пароль
          </label>

          <input
            id="admin-password"
            name="password"
            type="password"
            autoComplete="current-password"
            className="mt-3 w-full rounded-2xl border border-[#ead7d1] px-4 py-3 text-[#332725] outline-none transition focus:border-[#c98778]"
            required
          />

          <label
            htmlFor="admin-totp"
            className="mt-5 block text-sm uppercase tracking-[0.18em] text-[#8a7a76]"
          >
            Код Google Authenticator
          </label>

          <input
            id="admin-totp"
            name="totpCode"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            placeholder="6 цифр, если 2FA включена"
            className="mt-3 w-full rounded-2xl border border-[#ead7d1] px-4 py-3 text-[#332725] outline-none transition focus:border-[#c98778]"
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
            Войти
          </button>
        </form>
      </div>
    </section>
  );
}
