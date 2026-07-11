import Link from "next/link";

type RegisterPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

const errorMessages: Record<string, string> = {
  email: "Пользователь с такой почтой уже зарегистрирован.",
  email_send:
    "Не удалось отправить код на почту. Проверьте email или настройки отправки писем.",
  fields: "Заполните имя, email и пароль не короче 8 символов.",
};

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const params = await searchParams;
  const error = params.error ? errorMessages[params.error] : null;

  return (
    <section className="bg-[#fff8f6] px-6 py-24">
      <div className="mx-auto max-w-2xl">
        <p className="mb-4 text-sm uppercase tracking-[0.25em] text-[#c98778]">
          Личный кабинет
        </p>

        <h1 className="font-serif text-5xl leading-tight text-[#332725]">
          Регистрация
        </h1>

        <p className="mt-5 text-lg leading-8 text-[#5f5552]">
          Укажите email и придумайте пароль. Мы отправим код подтверждения,
          после ввода кода кабинет будет создан.
        </p>

        <form
          action="/api/auth/register"
          method="post"
          className="mt-10 rounded-[2rem] border border-[#ead7d1] bg-white p-8 shadow-sm"
        >
          <div className="grid gap-5">
            <input
              name="name"
              className="rounded-2xl border border-[#ead7d1] px-4 py-3 outline-none transition focus:border-[#c98778]"
              placeholder="Ваше имя"
              autoComplete="name"
              required
            />

            <input
              name="email"
              type="email"
              className="rounded-2xl border border-[#ead7d1] px-4 py-3 outline-none transition focus:border-[#c98778]"
              placeholder="Email"
              autoComplete="email"
              required
            />

            <input
              name="phone"
              className="rounded-2xl border border-[#ead7d1] px-4 py-3 outline-none transition focus:border-[#c98778]"
              placeholder="Телефон, если хотите"
              autoComplete="tel"
            />

            <input
              name="password"
              type="password"
              minLength={8}
              className="rounded-2xl border border-[#ead7d1] px-4 py-3 outline-none transition focus:border-[#c98778]"
              placeholder="Пароль от 8 символов"
              autoComplete="new-password"
              required
            />
          </div>

          {error && (
            <p className="mt-4 rounded-2xl bg-[#fff3df] px-4 py-3 text-sm text-[#9a5a1f]">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="mt-6 w-full rounded-2xl bg-[#332725] px-5 py-3 text-white transition hover:bg-[#4a3935]"
          >
            Получить код
          </button>

          <p className="mt-5 text-center text-sm text-[#5f5552]">
            Уже есть аккаунт?{" "}
            <Link href="/login" className="text-[#c98778]">
              Войти
            </Link>
          </p>
        </form>
      </div>
    </section>
  );
}
