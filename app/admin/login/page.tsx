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
};

export default async function AdminLoginPage({
  searchParams,
}: AdminLoginPageProps) {
  const params = await searchParams;
  const nextPath = params.next?.startsWith("/admin") ? params.next : "/admin";
  const error = params.error ? errorMessages[params.error] : null;

  return (
    <section className="bg-[#fff8f6] px-6 py-24">
      <div className="mx-auto max-w-xl">
        <p className="mb-4 text-sm uppercase tracking-[0.25em] text-[#c98778]">
          Luneva Admin
        </p>

        <h1 className="font-serif text-5xl leading-tight text-[#332725]">
          Вход в админку
        </h1>

        <form
          action="/api/admin/login"
          method="post"
          className="mt-10 rounded-[2rem] border border-[#ead7d1] bg-white p-8 shadow-sm"
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
