import Link from "next/link";
import type { ChangeEvent } from "react";

type LegalConsentProps = {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  className?: string;
};

const linkClass = "text-[#9f665a] underline underline-offset-4";

export default function LegalConsent({
  checked,
  onChange,
  className = "",
}: LegalConsentProps) {
  const controlledProps =
    checked === undefined
      ? {}
      : {
          checked,
          onChange: (event: ChangeEvent<HTMLInputElement>) =>
            onChange?.(event.target.checked),
        };

  return (
    <div className={`space-y-3 text-sm leading-6 text-[#5f5552] ${className}`}>
      <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[#ead7d1] bg-[#fff8f6] p-4">
        <input
          type="checkbox"
          name="legalConsent"
          required
          defaultChecked={checked === undefined ? false : undefined}
          className="mt-1 h-4 w-4 shrink-0 accent-[#c98778]"
          {...controlledProps}
        />
        <span>
          Я принимаю условия{" "}
          <Link href="/legal/terms" className={linkClass} target="_blank" rel="noreferrer">
            Пользовательского соглашения
          </Link>{" "}
          и даю согласие на обработку персональных данных.
        </span>
      </label>

      <p className="text-xs leading-5 text-[#8a7a76]">
        Нажимая кнопку «Отправить», вы подтверждаете, что ознакомились с{" "}
        <Link href="/legal/terms" className={linkClass} target="_blank" rel="noreferrer">
          Пользовательским соглашением
        </Link>
        ,{" "}
        <Link href="/legal/privacy" className={linkClass} target="_blank" rel="noreferrer">
          Политикой обработки персональных данных
        </Link>{" "}
        и даете{" "}
        <Link href="/legal/consent" className={linkClass} target="_blank" rel="noreferrer">
          Согласие на обработку персональных данных
        </Link>
        .
      </p>
    </div>
  );
}
