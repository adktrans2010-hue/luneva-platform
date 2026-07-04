export default function Footer() {
  return (
    <footer className="bg-[#fff8f6] px-6 pb-10 pt-20">
      <div className="mx-auto max-w-7xl border-t border-[#ead7d1] pt-10">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <div className="font-serif text-3xl text-[#332725]">
              Luneva <span className="font-light text-[#c98778]">Psy</span>
            </div>

            <p className="mt-4 max-w-sm leading-7 text-[#5f5552]">
              Бережное пространство психологической поддержки,
              доверия и внутренней опоры.
            </p>
          </div>

          <div>
            <p className="mb-4 text-sm uppercase tracking-[0.25em] text-[#c98778]">
              Навигация
            </p>

            <div className="grid gap-3 text-[#5f5552]">
              <a href="/">Главная</a>
              <a href="/about">Обо мне</a>
              <a href="/blog">Блог</a>
              <a href="/contacts">Контакты</a>
            </div>
          </div>

          <div>
            <p className="mb-4 text-sm uppercase tracking-[0.25em] text-[#c98778]">
              Контакты
            </p>

            <div className="grid gap-3 text-[#5f5552]">
              <a href="/contacts">Записаться на консультацию</a>
              <a href="mailto:hello@luneva-psy.ru">hello@luneva-psy.ru</a>
            </div>
          </div>
        </div>

        <div className="mt-12 text-sm text-[#8a7a76]">
          © 2026 Luneva Psy. Все права защищены.
        </div>
      </div>
    </footer>
  );
}