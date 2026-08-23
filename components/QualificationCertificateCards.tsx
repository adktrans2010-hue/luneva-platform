"use client";

import { useRef, useState } from "react";

import CertificateLightbox from "@/components/CertificateLightbox";
import { trackGoal } from "@/src/lib/client-analytics";
import type { QualificationCertificateCard } from "@/src/lib/qualification-certificates";

type QualificationCertificateCardsProps = {
  cards: QualificationCertificateCard[];
};

export default function QualificationCertificateCards({
  cards,
}: QualificationCertificateCardsProps) {
  const openerRef = useRef<HTMLButtonElement | null>(null);
  const [activeCard, setActiveCard] = useState<QualificationCertificateCard | null>(null);

  function openCard(
    card: QualificationCertificateCard,
    opener: HTMLButtonElement,
  ) {
    openerRef.current = opener;
    trackGoal("certificate_card_click");
    setActiveCard(card);
  }

  function closeModal() {
    setActiveCard(null);
    window.requestAnimationFrame(() => openerRef.current?.focus());
  }

  return (
    <>
      <div className="mt-8 grid gap-4">
        {cards.map((card) => {
          const content = <>
            <span className="min-w-0 max-w-full whitespace-normal [word-break:normal] [overflow-wrap:normal] [hyphens:none]">
              {card.title}
            </span>
            <span className="text-sm leading-5 text-[#9c544c] opacity-80 transition group-hover:translate-x-1 group-hover:opacity-100 sm:shrink-0 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0">
              {card.actionLabel} →
            </span>
          </>;
          const className = "group flex min-h-16 w-full min-w-0 flex-col items-start justify-between gap-3 rounded-2xl border border-[#ead7d1] bg-white px-5 py-4 text-left text-[#5f5552] shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-[#d9b6ad] hover:shadow-[0_14px_34px_rgba(70,45,40,0.08)] disabled:cursor-not-allowed disabled:opacity-65 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#c98778] sm:flex-row sm:items-center sm:gap-4 motion-reduce:transition-none motion-reduce:hover:translate-y-0";
          return (
            <button key={card.id} type="button" data-certificate-card-id={card.id} onClick={(event) => openCard(card, event.currentTarget)} disabled={card.certificates.length === 0} aria-label={`${card.title}. ${card.actionLabel}`} className={className}>
              {content}
            </button>
          );
        })}
      </div>

      {activeCard && (
        <CertificateLightbox
          certificates={activeCard.certificates}
          initialIndex={0}
          title={activeCard.modalTitle}
          onClose={closeModal}
        />
      )}
    </>
  );
}
