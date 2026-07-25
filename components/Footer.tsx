import Link from "next/link";

import ContactIcons from "@/components/ContactIcons";
import Logo from "@/components/Logo";
import { footerNavigation } from "@/src/lib/navigation";

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

          <div className="hidden md:block">
            <p className="mb-5 text-sm uppercase tracking-[0.25em] text-[#c98778]">
              Навигация
            </p>

            <div className="grid gap-4 text-[#5f5552]">
              {footerNavigation.map((link) => (
                <Link key={link.href} href={link.href}>{link.label}</Link>
              ))}
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

              <ContactIcons variant="list" className="mt-1" />

            </div>
          </div>

          <div>
            <p className="mb-5 text-sm uppercase tracking-[0.25em] text-[#c98778]">
              Правовая информация
            </p>

            <div className="grid gap-4 text-sm leading-6 text-[#5f5552]">
              <Link href="/legal/terms">Пользовательское соглашение</Link>
              <Link href="/requisites">Реквизиты</Link>
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
