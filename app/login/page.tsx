import Link from "next/link";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
    next?: string;
  }>;
};

const errorMessages: Record<string, string> = {
  login: "Неверная почта или пароль.",
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const error = params.error ? errorMessages[params.error] : null;
  const nextPath = params.next?.startsWith("/") ? params.next : "/account";

  return (
    <section className="bg-[#fff8f6] px-6 py-24">
      <div className="mx-auto max-w-xl">
        <p className="mb-4 text-sm uppercase tracking-[0.25em] text-[#c98778]">
          Личный кабинет
        </p>

        <h1 className="font-serif text-5xl leading-tight text-[#332725]">
          Вход
        </h1>

        <form
          action="/api/auth/login"
          method="post"
          className="mt-10 rounded-[2rem] border border-[#ead7d1] bg-white p-8 shadow-sm"
        >
          <input type="hidden" name="next" value={nextPath} />

          <input
            name="email"
            type="email"
            className="w-full rounded-2xl border border-[#ead7d1] px-4 py-3 outline-none transition focus:border-[#c98778]"
            placeholder="Email"
            autoComplete="email"
            required
          />

          <input
            name="password"
            type="password"
            className="mt-5 w-full rounded-2xl border border-[#ead7d1] px-4 py-3 outline-none transition focus:border-[#c98778]"
            placeholder="Пароль"
            autoComplete="current-password"
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
            Войти
          </button>

          <p className="mt-5 text-center text-sm text-[#5f5552]">
            Нет аккаунта?{" "}
            <Link href="/register" className="text-[#c98778]">
              Зарегистрироваться
            </Link>
          </p>
        </form>
      </div>
    </section>
  );
}
