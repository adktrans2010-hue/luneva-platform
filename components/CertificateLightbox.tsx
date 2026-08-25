"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import {
  getCertificateImageSrc,
  type CertificatePreview,
} from "@/src/lib/certificate-previews";
import { trackGoal } from "@/src/lib/client-analytics";

type CertificateLightboxProps = {
  certificates: CertificatePreview[];
  initialIndex: number;
  title: string;
  onClose: () => void;
};

function clampIndex(index: number, total: number) {
  if (total <= 0) return 0;
  if (index < 0) return 0;
  if (index >= total) return total - 1;
  return index;
}

export default function CertificateLightbox({
  certificates,
  initialIndex,
  title,
  onClose,
}: CertificateLightboxProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(() =>
    clampIndex(initialIndex, certificates.length),
  );
  const activeCertificate = certificates[activeIndex] ?? null;
  const hasMany = certificates.length > 1;
  const closeDialog = useCallback(() => {
    trackGoal("certificate_modal_close");
    onClose();
  }, [onClose]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();
    trackGoal("certificate_modal_open");

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeDialog();
        return;
      }

      if (event.key === "ArrowLeft" && hasMany) {
        event.preventDefault();
        setActiveIndex((index) => clampIndex(index - 1, certificates.length));
        return;
      }

      if (event.key === "ArrowRight" && hasMany) {
        event.preventDefault();
        setActiveIndex((index) => clampIndex(index + 1, certificates.length));
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );

      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [certificates.length, closeDialog, hasMany]);

  if (!activeCertificate) {
    return (
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-[#332725]/55 p-4 backdrop-blur-sm"
        onMouseDown={closeDialog}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          ref={dialogRef}
          tabIndex={-1}
          className="max-w-md rounded-[28px] bg-[#fffdfc] p-7 text-[#332725] shadow-[0_24px_80px_rgba(51,39,37,0.24)] focus:outline-none"
          onMouseDown={(event) => event.stopPropagation()}
        >
          <h2 id={titleId} className="font-serif text-3xl">
            Документ не найден
          </h2>
          <p className="mt-4 leading-7 text-[#5f5552]">
            Сейчас к этой квалификации не привязан опубликованный диплом или
            сертификат.
          </p>
          <button
            type="button"
            onClick={closeDialog}
            className="mt-6 min-h-11 rounded-full border border-[#d9b6ad] px-5 text-[#8d443e] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c98778]"
          >
            Закрыть
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#332725]/60 p-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-sm md:p-6"
      onMouseDown={closeDialog}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        ref={dialogRef}
        tabIndex={-1}
        className="relative flex max-h-[calc(100dvh-1.5rem)] w-full max-w-6xl flex-col overflow-hidden rounded-[28px] border border-[#ead7d1] bg-[#fffdfc] shadow-[0_28px_90px_rgba(51,39,37,0.28)] focus:outline-none md:max-h-[calc(100dvh-3rem)]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-[#ead7d1] px-5 py-4 md:px-7">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-[#c98778]">
              Дипломы и сертификаты
            </p>
            <h2 id={titleId} className="mt-2 font-serif text-2xl leading-tight text-[#332725] md:text-3xl">
              {title}
            </h2>
            <p className="mt-1 text-sm text-[#8a7a76]">
              {activeCertificate.title}
              {hasMany ? ` · ${activeIndex + 1} из ${certificates.length}` : ""}
            </p>
          </div>

          <button
            type="button"
            onClick={closeDialog}
            aria-label="Закрыть"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-[#d9b6ad] bg-white text-[#8d443e] shadow-sm transition hover:bg-[#fff8f6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c98778]"
          >
            <span aria-hidden="true" className="text-2xl leading-none">
              ×
            </span>
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 md:px-7">
          {activeCertificate.image ? (
            <div className="relative mx-auto min-h-[58dvh] w-full max-w-5xl md:min-h-[66dvh]">
              <Image
                src={getCertificateImageSrc(activeCertificate)}
                alt={activeCertificate.title}
                fill
                loading="lazy"
                sizes="(max-width: 767px) 94vw, 1024px"
                className="object-contain"
              />
            </div>
          ) : (
            <div className="mx-auto flex min-h-[42dvh] w-full max-w-3xl flex-col items-center justify-center rounded-[24px] border border-[#ead7d1] bg-[#fff8f6] p-8 text-center">
              <p className="text-lg leading-8 text-[#5f5552]">
                Изображение этого документа временно недоступно. Попробуйте
                открыть страницу сертификатов позже.
              </p>
              <Link
                href="/certificates"
                className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-[#332725] px-6 text-white transition hover:bg-[#4a3935] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#c98778]"
              >
                Перейти к сертификатам
              </Link>
            </div>
          )}

          {activeCertificate.description && (
            <p className="mx-auto mt-4 max-w-3xl text-center leading-7 text-[#5f5552]">
              {activeCertificate.description}
            </p>
          )}
        </div>

        <div className="flex shrink-0 flex-col gap-3 border-t border-[#ead7d1] px-5 py-4 sm:flex-row sm:items-center sm:justify-between md:px-7">
          <Link
            href="/certificates"
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#d9b6ad] px-5 text-sm text-[#8d443e] transition hover:bg-[#fff8f6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c98778]"
          >
            Все дипломы и сертификаты
          </Link>

          {hasMany && (
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setActiveIndex((index) => clampIndex(index - 1, certificates.length))}
                disabled={activeIndex === 0}
                aria-label="Предыдущий диплом"
                className="grid h-11 w-11 place-items-center rounded-full border border-[#d9b6ad] bg-white text-[#8d443e] shadow-sm transition hover:bg-[#fff8f6] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c98778]"
              >
                ←
              </button>
              <button
                type="button"
                onClick={() => setActiveIndex((index) => clampIndex(index + 1, certificates.length))}
                disabled={activeIndex === certificates.length - 1}
                aria-label="Следующий диплом"
                className="grid h-11 w-11 place-items-center rounded-full border border-[#d9b6ad] bg-white text-[#8d443e] shadow-sm transition hover:bg-[#fff8f6] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c98778]"
              >
                →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
