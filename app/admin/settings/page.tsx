import { getAdminSettings } from "@/src/lib/admin-settings";
import { createOtpAuthUrl } from "@/src/lib/totp";

type AdminSettingsPageProps = {
  searchParams: Promise<{
    status?: string;
  }>;
};

const statusMessages: Record<string, string> = {
  "profile-saved": "Контакты администратора сохранены.",
  "profile-error": "Проверьте email администратора.",
  "2fa-created": "Секрет создан. Добавьте его в Google Authenticator и подтвердите кодом.",
  "2fa-code-error": "Код не подошёл. Проверьте Google Authenticator и попробуйте ещё раз.",
  "2fa-enabled": "2FA включена. Теперь при входе нужен код Google Authenticator.",
  "2fa-disabled": "2FA отключена.",
  "password-error": "Неверный пароль администратора.",
  "password-new-error": "Новый пароль должен быть не короче 8 символов и совпадать с подтверждением.",
  "password-saved": "Пароль администратора изменён. При следующем входе используйте новый пароль.",
  "setup-error": "Настройки администратора пока не созданы.",
};

export default async function AdminSettingsPage({
  searchParams,
}: AdminSettingsPageProps) {
  const params = await searchParams;
  const settings = await getAdminSettings();
  const status = params.status ? statusMessages[params.status] : null;
  const otpAuthUrl =
    settings?.totpSecret && settings.email
      ? createOtpAuthUrl(settings.email, settings.totpSecret)
      : "";

  return (
    <section className="bg-[#fff8f6] px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <p className="mb-4 text-sm uppercase tracking-[0.25em] text-[#c98778]">
          Luneva Admin
        </p>

        <h1 className="font-serif text-5xl leading-tight text-[#332725]">
          Настройки администратора
        </h1>

        {status && (
          <p className="mt-8 rounded-2xl border border-[#ead7d1] bg-white px-5 py-4 text-[#5f5552]">
            {status}
          </p>
        )}

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_1fr]">
          <form
            action="/api/admin/settings"
            method="post"
            className="rounded-[2rem] border border-[#ead7d1] bg-white p-8 shadow-sm"
          >
            <input type="hidden" name="action" value="profile" />

            <h2 className="font-serif text-3xl text-[#332725]">
              Контакты
            </h2>

            <label
              htmlFor="admin-email"
              className="mt-6 block text-sm uppercase tracking-[0.18em] text-[#8a7a76]"
            >
              Email для входа
            </label>

            <input
              id="admin-email"
              name="email"
              type="email"
              defaultValue={settings?.email ?? ""}
              className="mt-3 w-full rounded-2xl border border-[#ead7d1] px-4 py-3 text-[#332725] outline-none transition focus:border-[#c98778]"
              required
            />

            <label
              htmlFor="admin-phone"
              className="mt-5 block text-sm uppercase tracking-[0.18em] text-[#8a7a76]"
            >
              Телефон администратора
            </label>

            <input
              id="admin-phone"
              name="phone"
              type="tel"
              defaultValue={settings?.phone ?? ""}
              className="mt-3 w-full rounded-2xl border border-[#ead7d1] px-4 py-3 text-[#332725] outline-none transition focus:border-[#c98778]"
            />

            <button
              type="submit"
              className="mt-6 rounded-2xl bg-[#332725] px-6 py-3 text-white transition hover:bg-[#4a3935]"
            >
              Сохранить
            </button>
          </form>

          <form
            action="/api/admin/settings"
            method="post"
            className="rounded-[2rem] border border-[#ead7d1] bg-white p-8 shadow-sm"
          >
            <input type="hidden" name="action" value="password" />

            <h2 className="font-serif text-3xl text-[#332725]">
              Пароль
            </h2>

            <label
              htmlFor="current-password"
              className="mt-6 block text-sm uppercase tracking-[0.18em] text-[#8a7a76]"
            >
              Текущий пароль
            </label>

            <input
              id="current-password"
              name="currentPassword"
              type="password"
              autoComplete="current-password"
              className="mt-3 w-full rounded-2xl border border-[#ead7d1] px-4 py-3 text-[#332725] outline-none transition focus:border-[#c98778]"
              required
            />

            <label
              htmlFor="next-password"
              className="mt-5 block text-sm uppercase tracking-[0.18em] text-[#8a7a76]"
            >
              Новый пароль
            </label>

            <input
              id="next-password"
              name="nextPassword"
              type="password"
              autoComplete="new-password"
              minLength={8}
              className="mt-3 w-full rounded-2xl border border-[#ead7d1] px-4 py-3 text-[#332725] outline-none transition focus:border-[#c98778]"
              required
            />

            <label
              htmlFor="confirm-password"
              className="mt-5 block text-sm uppercase tracking-[0.18em] text-[#8a7a76]"
            >
              Повторите новый пароль
            </label>

            <input
              id="confirm-password"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              minLength={8}
              className="mt-3 w-full rounded-2xl border border-[#ead7d1] px-4 py-3 text-[#332725] outline-none transition focus:border-[#c98778]"
              required
            />

            <button
              type="submit"
              className="mt-6 rounded-2xl bg-[#332725] px-6 py-3 text-white transition hover:bg-[#4a3935]"
            >
              Сменить пароль
            </button>
          </form>

          <div className="rounded-[2rem] border border-[#ead7d1] bg-white p-8 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-serif text-3xl text-[#332725]">
                  Google Authenticator
                </h2>

                <p className="mt-3 leading-7 text-[#5f5552]">
                  Статус: {settings?.totpEnabled ? "включена" : "не включена"}
                </p>
              </div>

              <span className="rounded-full bg-[#fff8f6] px-4 py-2 text-sm uppercase tracking-[0.18em] text-[#c98778]">
                2FA
              </span>
            </div>

            {!settings?.totpEnabled && !settings?.totpSecret && (
              <form action="/api/admin/settings" method="post" className="mt-6">
                <input type="hidden" name="action" value="create-2fa" />
                <button
                  type="submit"
                  className="rounded-2xl bg-[#332725] px-6 py-3 text-white transition hover:bg-[#4a3935]"
                >
                  Создать ключ 2FA
                </button>
              </form>
            )}

            {!settings?.totpEnabled && settings?.totpSecret && (
              <div className="mt-6 space-y-5">
                <div className="rounded-2xl bg-[#fff8f6] p-5">
                  <p className="text-sm uppercase tracking-[0.18em] text-[#c98778]">
                    Секретный ключ
                  </p>
                  <p className="mt-3 break-all font-mono text-lg text-[#332725]">
                    {settings.totpSecret}
                  </p>
                </div>

                <div className="rounded-2xl bg-[#fff8f6] p-5">
                  <p className="text-sm uppercase tracking-[0.18em] text-[#c98778]">
                    Ссылка для приложения
                  </p>
                  <p className="mt-3 break-all text-sm leading-6 text-[#5f5552]">
                    {otpAuthUrl}
                  </p>
                </div>

                <form action="/api/admin/settings" method="post">
                  <input type="hidden" name="action" value="enable-2fa" />

                  <label
                    htmlFor="totp-code"
                    className="block text-sm uppercase tracking-[0.18em] text-[#8a7a76]"
                  >
                    Код из Google Authenticator
                  </label>

                  <input
                    id="totp-code"
                    name="totpCode"
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    className="mt-3 w-full rounded-2xl border border-[#ead7d1] px-4 py-3 text-[#332725] outline-none transition focus:border-[#c98778]"
                    required
                  />

                  <button
                    type="submit"
                    className="mt-5 rounded-2xl bg-[#332725] px-6 py-3 text-white transition hover:bg-[#4a3935]"
                  >
                    Включить 2FA
                  </button>
                </form>
              </div>
            )}

            {settings?.totpEnabled && (
              <form action="/api/admin/settings" method="post" className="mt-6">
                <input type="hidden" name="action" value="disable-2fa" />

                <label
                  htmlFor="disable-password"
                  className="block text-sm uppercase tracking-[0.18em] text-[#8a7a76]"
                >
                  Пароль администратора
                </label>

                <input
                  id="disable-password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  className="mt-3 w-full rounded-2xl border border-[#ead7d1] px-4 py-3 text-[#332725] outline-none transition focus:border-[#c98778]"
                  required
                />

                <button
                  type="submit"
                  className="mt-5 rounded-2xl border border-[#c98778] px-6 py-3 text-[#c98778] transition hover:bg-[#fff8f6]"
                >
                  Отключить 2FA
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
