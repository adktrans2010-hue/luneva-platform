import Link from "next/link";

import Logo from "@/components/Logo";

export default function Footer() {
  return (
    <footer className="relative overflow-hidden bg-[#fff8f6] px-6 pt-24 pb-10">
      <div className="absolute -bottom-40 -left-40 h-[400px] w-[400px] rounded-full bg-[#e7b8ad]/30 blur-[120px]" />

      <div className="relative mx-auto max-w-7xl border-t border-[#ead7d1] pt-14">
        <div className="grid gap-12 md:grid-cols-2 xl:grid-cols-[1.2fr_0.8fr_0.9fr_1.1fr]">
          <div>
            <Logo variant="footer" />

            <p className="mt-6 max-w-sm text-lg leading-8 text-[#5f5552]">
              Пространство бережной психологической поддержки, где можно лучше
              понять себя и найти внутреннюю опору.
            </p>
          </div>

          <div>
            <p className="mb-5 text-sm uppercase tracking-[0.25em] text-[#c98778]">
              Навигация
            </p>

            <div className="grid gap-4 text-[#5f5552]">
              <Link href="/">Главная</Link>
              <Link href="/about">Обо мне</Link>
              <Link href="/help">Психологическая помощь</Link>
              <Link href="/reviews">Отзывы</Link>
              <Link href="/blog">Полезные статьи</Link>
              <Link href="/videos">Полезные видео</Link>
              <Link href="/faq">Частые вопросы</Link>
            </div>
          </div>

          <div>
            <p className="mb-5 text-sm uppercase tracking-[0.25em] text-[#c98778]">
              Контакты
            </p>

            <div className="grid gap-4 text-[#5f5552]">
              <Link href="/contacts#booking">
                Записаться на консультацию
              </Link>

              <a href="mailto:hello@luneva-psy.ru">hello@luneva-psy.ru</a>

              <div className="mt-4 flex gap-4">
                <span className="rounded-full border border-[#ead7d1] px-4 py-2">
                  Telegram
                </span>

                <span className="rounded-full border border-[#ead7d1] px-4 py-2">
                  WhatsApp
                </span>
              </div>
            </div>
          </div>

          <div>
            <p className="mb-5 text-sm uppercase tracking-[0.25em] text-[#c98778]">
              Правовая информация
            </p>

            <div className="grid gap-4 text-sm leading-6 text-[#5f5552]">
              <Link href="/legal/terms">Пользовательское соглашение</Link>
              <Link href="/legal/privacy">Политика обработки персональных данных</Link>
              <Link href="/legal/consent">Согласие на обработку персональных данных</Link>
              <Link href="/legal/cookies">Политика использования Cookie</Link>
            </div>
          </div>
        </div>

        <div className="mt-16 flex flex-col justify-between gap-4 border-t border-[#ead7d1] pt-8 text-sm text-[#8a7a76] md:flex-row">
          <p>© 2026 Luneva Psy. Все права защищены.</p>

          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <p>Создано с заботой</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
