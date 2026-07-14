import Link from "next/link";

export default function NotFound() {
  return (
    <section className="bg-[#fff8f6] px-6 py-24">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-sm uppercase tracking-[0.25em] text-[#c98778]">
          404
        </p>
        <h1 className="mt-5 font-serif text-5xl leading-tight text-[#332725] md:text-6xl">
          Страница не найдена
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-[#5f5552]">
          Возможно, ссылка устарела или страница была перенесена. Можно вернуться
          на главную или перейти к записи на консультацию.
        </p>
        <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
          <Link
            href="/"
            className="rounded-2xl bg-[#332725] px-7 py-4 text-white transition hover:bg-[#4a3935]"
          >
            На главную
          </Link>
          <Link
            href="/contacts#booking"
            className="rounded-2xl border border-[#332725] px-7 py-4 text-[#332725] transition hover:bg-white"
          >
            Записаться
          </Link>
        </div>
      </div>
    </section>
  );
}
