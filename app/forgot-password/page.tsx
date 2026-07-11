import Link from "next/link";

type ForgotPasswordPageProps = {
  searchParams: Promise<{
    error?: string;
    sent?: string;
  }>;
};

const errorMessages: Record<string, string> = {
  email: "Укажите email, который использовали при регистрации.",
  email_send:
    "Не удалось отправить код на почту. Проверьте email или настройки отправки писем.",
};

export default async function ForgotPasswordPage({
  searchParams,
}: ForgotPasswordPageProps) {
  const params = await searchParams;
  const error = params.error ? errorMessages[params.error] : null;
  const sent = params.sent === "1";

  return (
    <section className="bg-[#fff8f6] px-6 py-24">
      <div className="mx-auto max-w-xl">
        <p className="mb-4 text-sm uppercase tracking-[0.25em] text-[#c98778]">
          Личный кабинет
        </p>

        <h1 className="font-serif text-5xl leading-tight text-[#332725]">
          Восстановление пароля
        </h1>

        <p className="mt-5 text-lg leading-8 text-[#5f5552]">
          Введите почту от личного кабинета. Мы отправим код для смены пароля.
        </p>

        <form
          action="/api/auth/forgot-password"
          method="post"
          className="mt-10 rounded-[2rem] border border-[#ead7d1] bg-white p-8 shadow-sm"
        >
          <input
            name="email"
            type="email"
            className="w-full rounded-2xl border border-[#ead7d1] px-4 py-3 outline-none transition focus:border-[#c98778]"
            placeholder="Email"
            autoComplete="email"
            required
          />

          {error && (
            <p className="mt-4 rounded-2xl bg-[#fff3df] px-4 py-3 text-sm text-[#9a5a1f]">
              {error}
            </p>
          )}

          {sent && (
            <p className="mt-4 rounded-2xl bg-[#edf7ed] px-4 py-3 text-sm text-[#5f8a5f]">
              Если такой email есть в базе, код восстановления отправлен.
            </p>
          )}

          <button
            type="submit"
            className="mt-6 w-full rounded-2xl bg-[#332725] px-5 py-3 text-white transition hover:bg-[#4a3935]"
          >
            Получить код
          </button>

          <p className="mt-5 text-center text-sm text-[#5f5552]">
            Вспомнили пароль?{" "}
            <Link href="/login" className="text-[#c98778]">
              Войти
            </Link>
          </p>
        </form>
      </div>
    </section>
  );
}
