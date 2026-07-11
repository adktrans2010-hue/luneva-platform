import Link from "next/link";

type VerifyPageProps = {
  searchParams: Promise<{
    email?: string;
    error?: string;
  }>;
};

const errorMessages: Record<string, string> = {
  attempts: "Слишком много попыток. Зарегистрируйтесь ещё раз и получите новый код.",
  code: "Код введён неверно. Проверьте письмо и попробуйте ещё раз.",
  email: "Пользователь с такой почтой уже зарегистрирован.",
  expired: "Код истёк. Зарегистрируйтесь ещё раз и получите новый код.",
  missing: "Код не найден. Зарегистрируйтесь ещё раз.",
};

export default async function VerifyPage({ searchParams }: VerifyPageProps) {
  const params = await searchParams;
  const email = params.email ?? "";
  const error = params.error ? errorMessages[params.error] : null;

  return (
    <section className="bg-[#fff8f6] px-6 py-24">
      <div className="mx-auto max-w-xl">
        <p className="mb-4 text-sm uppercase tracking-[0.25em] text-[#c98778]">
          Личный кабинет
        </p>

        <h1 className="font-serif text-5xl leading-tight text-[#332725]">
          Подтверждение почты
        </h1>

        <p className="mt-5 text-lg leading-8 text-[#5f5552]">
          Мы отправили 6-значный код на почту {email || "которую вы указали"}.
          Введите его здесь, чтобы завершить регистрацию.
        </p>

        <form
          action="/api/auth/verify"
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

          {error && (
            <p className="mt-4 rounded-2xl bg-[#fff3df] px-4 py-3 text-sm text-[#9a5a1f]">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="mt-6 w-full rounded-2xl bg-[#332725] px-5 py-3 text-white transition hover:bg-[#4a3935]"
          >
            Подтвердить
          </button>

          <p className="mt-5 text-center text-sm text-[#5f5552]">
            Не получили код?{" "}
            <Link href="/register" className="text-[#c98778]">
              Зарегистрироваться заново
            </Link>
          </p>
        </form>
      </div>
    </section>
  );
}
